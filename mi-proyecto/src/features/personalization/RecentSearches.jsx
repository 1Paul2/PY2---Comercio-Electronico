import { removeSearch } from '../history/history'
import { usePersonalHistory } from './usePersonalHistory'
import '../../styles/Personalization.css'

/**
 * Nombre: RecentSearches
 * Descripción: Botones con las últimas búsquedas del usuario
 *              (history.searches). Tocar uno repite la búsqueda; la ✕ la
 *              quita del historial. Sin sesión o sin búsquedas no se muestra.
 * Entradas: onSelect: función que recibe el texto elegido.
 *           className: clase extra de la sección.
 * Salidas: JSX con los botones o null.
 * Excepciones: No hay.
 */
function RecentSearches({ onSelect, className = '' }) {
  const { history } = usePersonalHistory()
  const searches = history?.searches ?? []

  if (searches.length === 0) return null

  return (
    <section className={`recent-searches ${className}`.trim()} aria-label="Tus búsquedas recientes">
      <h2 className="recent-searches__title">Tus búsquedas recientes</h2>
      <ul className="recent-searches__list">
        {searches.map(({ query }) => (
          <li key={query} className="recent-search-chip">
            <button
              type="button"
              className="recent-search-chip__query"
              onClick={() => onSelect(query)}
              title={`Buscar «${query}»`}
            >
              <span aria-hidden="true">🕘</span>
              {query}
            </button>
            <button
              type="button"
              className="recent-search-chip__remove"
              onClick={() => removeSearch(query)}
              aria-label={`Quitar «${query}» de tus búsquedas recientes`}
              title="Quitar"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RecentSearches
