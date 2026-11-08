import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCRC } from '../catalog/format'
import { removeProduct } from '../history/history'
import { usePersonalHistory } from './usePersonalHistory'
import { useProductsByIds } from './productQueries'
import '../../styles/Personalization.css'

const COLLAPSED_COUNT = 4
const MAX_ITEMS = 10

/**
 * Nombre: RecentlyViewedList
 * Descripción: Lista compacta de los productos vistos (del más reciente al más
 *              antiguo). Cada fila enlaza al detalle y tiene una ✕ aparte para
 *              quitarla del historial. En escritorio muestra 4 y permite
 *              expandir hasta 10; en pantallas pequeñas es una fila de tiles
 *              desplazable. Sin sesión o sin productos vistos no se muestra.
 * Entradas: title: título de la sección.
 *           subtitle: texto opcional bajo el título.
 *           className: clase extra de la sección.
 * Salidas: JSX con la lista o null.
 * Excepciones: No hay.
 */
function RecentlyViewedList({ title = 'Seguí donde lo dejaste', subtitle, className = '' }) {
  const { history } = usePersonalHistory()
  const products = history?.products
  const [expanded, setExpanded] = useState(false)

  const ids = useMemo(() => (products ?? []).map((item) => item.objectID).slice(0, MAX_ITEMS), [products])
  const { hits } = useProductsByIds(ids)

  if (hits.length === 0) return null

  const canExpand = hits.length > COLLAPSED_COUNT

  return (
    <section className={`viewed-list ${className}`.trim()} aria-label={title}>
      <div className="viewed-list__header">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <ul className={`viewed-list__items${expanded ? ' viewed-list__items--expanded' : ''}`}>
        {hits.map((hit) => (
          <li className="viewed-item" key={hit.objectID}>
            <Link to={`/producto/${hit.objectID}`} className="viewed-item__link">
              <img
                className="viewed-item__image"
                src={hit.image_url}
                alt=""
                loading="lazy"
                width="72"
                height="72"
              />
              <span className="viewed-item__info">
                <span className="viewed-item__category">{hit.category_facet}</span>
                <span className="viewed-item__title">{hit.title}</span>
                <span className="viewed-item__price">{formatCRC(hit.pricing?.b2c?.price_crc)}</span>
              </span>
            </Link>
            <button
              type="button"
              className="viewed-item__remove"
              onClick={() => removeProduct(hit.objectID)}
              aria-label={`Quitar "${hit.title}" de tu historial`}
              title="Quitar de tu historial"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {canExpand && (
        <button
          type="button"
          className="viewed-list__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Ver menos' : `Ver todos (${hits.length})`}
        </button>
      )}
    </section>
  )
}

export default RecentlyViewedList
