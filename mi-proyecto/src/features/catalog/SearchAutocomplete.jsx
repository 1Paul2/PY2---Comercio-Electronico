import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { autocomplete } from '@algolia/autocomplete-js'
import '@algolia/autocomplete-theme-classic'
import { recentSearchesPlugin } from './recentSearchesPlugin'
import { createProductSuggestionsSource } from './productSuggestionsSource'
import '../../styles/SearchAutocomplete.css'

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
      plugins: [recentSearchesPlugin],
      getSources() {
        return [createProductSuggestionsSource({ onSelect: handleQuery })]
      },
      onSubmit({ state }) {
        handleQuery(state.query)
      },
      onStateChange({ state, prevState }) {
        if (state.query !== prevState.query) {
          handleQuery(state.query)
        }
      },
    })

    return () => search.destroy()
  }, [redirectSearchTo, onQuery, navigate])

  return <div ref={containerRef} className="search-header__autocomplete" />
}

export default SearchAutocomplete