import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { autocomplete } from '@algolia/autocomplete-js'
import '@algolia/autocomplete-theme-classic'
import { createRecentSearchesPlugin } from './recentSearchesPlugin'
import { useSession } from '../../context/useSession'
import { rememberSearch, removeSearch } from '../history/history'
import { createProductSuggestionsSource } from './productSuggestionsSource'
import { EVENT_TYPES, trackEvent } from '../activity/activityLog'
import '../../styles/SearchAutocomplete.css'

const TYPING_PAUSE_MS = 1000
const SAME_QUERY_WINDOW_MS = 5000
const MIN_QUERY_LENGTH = 2

/**
 * Nombre: isSameSearchInProgress
 * Descripción: Indica si dos textos escritos seguidos son la misma búsqueda
 *              a medio escribir ("exca" → "excavadora", o al borrar letras).
 */
function isSameSearchInProgress(previous, current) {
  const a = previous.toLowerCase()
  const b = current.toLowerCase()
  return a.startsWith(b) || b.startsWith(a)
}

/**
 * Nombre: SearchAutocomplete
 * Descripción: Inicializa el buscador con autocompletado y sugerencias de productos.
 * Actualiza los resultados en tiempo real con cada tecla, y vuelve al
 * estado normal sin filtro de búsqueda cuando el campo queda vacío.
 * Entradas: redirectSearchTo: ruta de redirección opcional; onQuery: callback para manejar la búsqueda;
 *           activeQuery: búsqueda activa del catálogo. Si cambia desde fuera
 *           del campo (por ejemplo, al tocar una búsqueda reciente), el campo
 *           muestra ese texto.
 * Salidas: JSX con el contenedor del autocompletado.
 * Excepciones: No hay.
 */
function SearchAutocomplete({ redirectSearchTo, onQuery, activeQuery = '' }) {
  const containerRef = useRef(null)
  const searchRef = useRef(null)
  const inputQueryRef = useRef(activeQuery)
  const externalQueryRef = useRef(null)
  const navigate = useNavigate()
  const { session } = useSession()

  useEffect(() => {
    if (!containerRef.current) return

    let typingTimer = null
    let lastLogged = { query: '', at: 0 }
    let lastTypedSearch = null

    /**
     * Nombre: logSearch
     * Descripción: Registra el evento "search" con el texto buscado y cómo
     *              se hizo (enter, sugerencia o escritura en el catálogo).
     */
    const logSearch = (query, method) => {
      window.clearTimeout(typingTimer)
      const trimmed = query.trim()
      if (trimmed.length < MIN_QUERY_LENGTH) return
      if (method === 'typing') {
        if (lastTypedSearch && isSameSearchInProgress(lastTypedSearch, trimmed)) {
          removeSearch(lastTypedSearch)
        }
        lastTypedSearch = trimmed
      } else {
        lastTypedSearch = null
      }
      rememberSearch(trimmed)
      const now = Date.now()
      const sameQuery = trimmed.toLowerCase() === lastLogged.query
      if (sameQuery && now - lastLogged.at < SAME_QUERY_WINDOW_MS) return
      lastLogged = { query: trimmed.toLowerCase(), at: now }
      trackEvent(EVENT_TYPES.SEARCH, { query: trimmed, method })
    }

    const handleQuery = (query) => {
      const trimmed = query.trim()

      if (redirectSearchTo) {
        if (!trimmed) return
        navigate(`${redirectSearchTo}?q=${encodeURIComponent(trimmed)}`)
      } else {
        onQuery?.(trimmed)
      }
    }

    const recentSearchesPlugin = createRecentSearchesPlugin(session?.userId, (query) => {
      logSearch(query, 'suggestion')
      handleQuery(query)
    })
    const search = autocomplete({
      container: containerRef.current,
      placeholder: 'Buscar productos...',
      openOnFocus: true,
      detachedMediaQuery: 'none',
      initialState: { query: inputQueryRef.current },
      plugins: recentSearchesPlugin ? [recentSearchesPlugin] : [],
      getSources() {
        return [
          createProductSuggestionsSource({
            recentSearchesPlugin,
            onSelect: (query) => {
              logSearch(query, 'suggestion')
              handleQuery(query)
            },
          }),
        ]
      },
      onSubmit({ state }) {
        logSearch(state.query, 'enter')
        handleQuery(state.query)
      },
      onStateChange({ state, prevState }) {
        inputQueryRef.current = state.query
        if (externalQueryRef.current !== null && state.query === externalQueryRef.current) {
          externalQueryRef.current = null
          return
        }
        if (redirectSearchTo) return
        if (state.query !== prevState.query) {
          handleQuery(state.query)
          window.clearTimeout(typingTimer)
          typingTimer = window.setTimeout(() => logSearch(state.query, 'typing'), TYPING_PAUSE_MS)
        }
      },
    })

    searchRef.current = search

    return () => {
      window.clearTimeout(typingTimer)
      search.destroy()
      searchRef.current = null
    }
  }, [redirectSearchTo, onQuery, navigate, session?.userId])

  useEffect(() => {
    const search = searchRef.current
    if (!search || activeQuery === inputQueryRef.current) return
    externalQueryRef.current = activeQuery
    inputQueryRef.current = activeQuery
    search.setQuery(activeQuery)
    search.refresh()
  }, [activeQuery])

  return <div ref={containerRef} className="search-header__autocomplete" />
}

export default SearchAutocomplete
