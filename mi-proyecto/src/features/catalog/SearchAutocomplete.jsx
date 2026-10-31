import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { autocomplete } from '@algolia/autocomplete-js'
import '@algolia/autocomplete-theme-classic'
import { recentSearchesPlugin } from './recentSearchesPlugin'
import { createProductSuggestionsSource } from './productSuggestionsSource'
import { EVENT_TYPES, trackEvent } from '../analytics/events'
import '../../styles/SearchAutocomplete.css'

// Mientras se escribe en el catálogo, la búsqueda se registra cuando la
// persona deja de teclear este tiempo (no una vez por cada letra).
const TYPING_PAUSE_MS = 1000
// La misma búsqueda repetida en este lapso se cuenta una sola vez (por
// ejemplo, la pausa al escribir seguida de Enter con el mismo texto).
const SAME_QUERY_WINDOW_MS = 5000

/**
 * Nombre: SearchAutocomplete
 * Descripción: Inicializa el buscador con autocompletado y sugerencias de productos.
 * Actualiza los resultados en tiempo real con cada tecla, y vuelve al
 * estado normal sin filtro de búsqueda cuando el campo queda vacío.
 * Entradas: redirectSearchTo: ruta de redirección opcional; onQuery: callback para manejar la búsqueda.
 * Salidas: JSX con el contenedor del autocompletado.
 * Excepciones: No hay.
 */
function SearchAutocomplete({ redirectSearchTo, onQuery }) {
  const containerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!containerRef.current) return

    let typingTimer = null
    let lastLogged = { query: '', at: 0 }

    /**
     * Nombre: logSearch
     * Descripción: Registra el evento "search" con el texto buscado y cómo
     *              se hizo (enter, sugerencia o escritura en el catálogo).
     */
    const logSearch = (query, method) => {
      window.clearTimeout(typingTimer)
      const trimmed = query.trim()
      if (trimmed.length < 2) return
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

    const search = autocomplete({
      container: containerRef.current,
      placeholder: 'Buscar productos...',
      openOnFocus: true,
      // Por defecto, en pantallas de menos de 680px la librería cambia a un
      // "modo móvil" (un botón que abre otra pantalla en blanco, con "Cancel"
      // en inglés y los nombres cortados). 'none' lo desactiva para que en el
      // celular el buscador funcione igual que en la web: el campo queda en el
      // encabezado y las sugerencias se despliegan debajo.
      detachedMediaQuery: 'none',
      plugins: [recentSearchesPlugin],
      getSources() {
        return [
          createProductSuggestionsSource({
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
        // Solo filtra en vivo cuando el buscador ya está sobre el catálogo.
        // Con redirectSearchTo, navegar en cada tecla mandaba al catálogo con
        // la PRIMERA letra escrita ("e" en vez de "excavadora") y el resto del
        // texto se perdía al desmontarse el input. En ese caso la navegación
        // ocurre en onSubmit (Enter) o al elegir una sugerencia.
        if (redirectSearchTo) return
        if (state.query !== prevState.query) {
          handleQuery(state.query)
          window.clearTimeout(typingTimer)
          typingTimer = window.setTimeout(() => logSearch(state.query, 'typing'), TYPING_PAUSE_MS)
        }
      },
    })

    return () => {
      window.clearTimeout(typingTimer)
      search.destroy()
    }
  }, [redirectSearchTo, onQuery, navigate])

  return <div ref={containerRef} className="search-header__autocomplete" />
}

export default SearchAutocomplete