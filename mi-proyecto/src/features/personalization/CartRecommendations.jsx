import { useMemo } from 'react'
import ProductCarousel from '../catalog/ProductCarousel'
import { useProductsByIds, useProductSearch } from './productQueries'
import { buildProductRequest, excludeAndLimit, formatList, rankCartCategories } from './recommendations'
import '../../styles/Personalization.css'

const CART_RECOMMENDATION_LIMIT = 12
const CART_CATEGORIES = 2

/**
 * Nombre: CartRecommendations
 * Descripción: "Completa tu compra". Recomienda productos de las categorías
 *              que más unidades tienen en el carrito (por ejemplo, repuestos
 *              junto a la máquina), sin repetir lo que ya está en él.
 *              Las líneas del carrito no guardan la categoría, por eso
 *              primero se consultan sus productos en Algolia.
 * Entradas: items: líneas del carrito ({ id, quantity, ... }).
 * Salidas: JSX con el carrusel o null.
 * Excepciones: No hay.
 */
function CartRecommendations({ items }) {
  const cartIds = useMemo(() => items.map((item) => item.id), [items])
  const quantities = useMemo(
    () => Object.fromEntries(items.map((item) => [item.id, item.quantity])),
    [items]
  )
  const { hits: cartProducts } = useProductsByIds(cartIds)
  const categories = useMemo(
    () => rankCartCategories(cartProducts, quantities).slice(0, CART_CATEGORIES),
    [cartProducts, quantities]
  )

  const request = buildProductRequest({ categories }, cartIds, CART_RECOMMENDATION_LIMIT)
  const { status, hits } = useProductSearch(request)
  const recommendations = excludeAndLimit(hits, cartIds, CART_RECOMMENDATION_LIMIT)

  if (status !== 'ready' || recommendations.length === 0) return null

  return (
    <ProductCarousel
      title="Completa tu compra"
      subtitle={`Porque tienes ${formatList(categories)} en tu carrito`}
      hits={recommendations}
      className="personal-section personal-section--cart"
    />
  )
}

export default CartRecommendations
