import { useMemo } from 'react'
import ProductCarousel from '../catalog/ProductCarousel'
import { removeProduct } from '../history/history'
import { usePersonalHistory } from './usePersonalHistory'
import { useProductsByIds } from './productQueries'
import '../../styles/Personalization.css'

/**
 * Nombre: RecentlyViewed
 * Descripción: Carrusel con los productos que el usuario vio, del más
 *              reciente al más antiguo (history.products). Cada tarjeta tiene
 *              una ✕ para quitarla del historial. Sin sesión o sin productos
 *              vistos no se muestra.
 * Entradas: title: título de la sección.
 *           subtitle: texto opcional bajo el título.
 *           excludeId: producto a omitir (el que se está viendo en el detalle).
 *           headerAction: elemento opcional a la derecha del título.
 *           className: clase extra de la sección.
 * Salidas: JSX con el carrusel o null.
 * Excepciones: No hay.
 */
function RecentlyViewed({ title = 'Vistos recientemente', subtitle, excludeId, headerAction, className = '' }) {
  const { history } = usePersonalHistory()
  const products = history?.products

  const ids = useMemo(
    () => (products ?? []).map((item) => item.objectID).filter((id) => id !== excludeId),
    [products, excludeId]
  )
  const { hits } = useProductsByIds(ids)

  if (hits.length === 0) return null

  return (
    <ProductCarousel
      title={title}
      subtitle={subtitle}
      headerAction={headerAction}
      hits={hits}
      onRemoveItem={(hit) => removeProduct(hit.objectID)}
      className={`personal-section ${className}`.trim()}
    />
  )
}

export default RecentlyViewed
