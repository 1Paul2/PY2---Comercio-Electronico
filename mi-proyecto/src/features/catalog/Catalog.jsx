import { useState } from 'react'
import { Hits, useInstantSearch, useSearchBox } from 'react-instantsearch'
import Filters from './Filters'
import ProductCard from './ProductCard'
import Pagination from './Pagination'
import EmptyState from './EmptyState'
import RecentSearches from '../personalization/RecentSearches'
import { repeatSearch } from '../personalization/usePersonalHistory'
import '../../styles/Catalog.css'

/**
 * Nombre: filtrosAbiertosPorDefecto
 * Descripción: Determina si los filtros deben mostrarse abiertos por defecto según el ancho de pantalla.
 * Entradas: No recibe parámetros.
 * Salidas: Booleano que indica si el panel de filtros debe estar abierto.
 * Excepciones: No hay.
 */
const filtrosAbiertosPorDefecto = () =>
  typeof window === 'undefined' || window.matchMedia('(min-width: 769px)').matches

/**
 * Nombre: Catalog
 * Descripción: Renderiza el catálogo de productos con filtros, listado y estado vacío cuando no hay resultados.
 * Entradas: No recibe parámetros.
 * Salidas: JSX con la vista del catálogo.
 * Excepciones: No hay.
 */
function Catalog() {
  const [filtersOpen, setFiltersOpen] = useState(filtrosAbiertosPorDefecto)
  const { results } = useInstantSearch()
  const { query, refine } = useSearchBox()
  const hasHits = Boolean(results?.nbHits)

  function handleRecentSearch(recentQuery) {
    repeatSearch(recentQuery)
    refine(recentQuery)
  }

  return (
    <div className="catalog">
      <div className="catalog__body">
        <Filters isOpen={filtersOpen} onToggle={() => setFiltersOpen((o) => !o)} />

        <div className="catalog__results">
          {!query && <RecentSearches onSelect={handleRecentSearch} className="recent-searches--catalog" />}
          {hasHits ? (
            <>
              <Hits hitComponent={ProductCard} classNames={{ list: 'catalog__grid' }} />
              <Pagination />
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

export default Catalog