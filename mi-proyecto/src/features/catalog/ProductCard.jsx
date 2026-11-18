import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCRC } from './format'
import { useCart } from '../../context/useCart'
import { useSession } from '../../context/useSession'
import { hasPermission, PERMISSIONS } from '../session/roles'
import { formatB2BConditions, PRICE_TYPES } from '../pricing/pricing'
import { getAddButtonLabel, getCartAvailability, toCartItem } from './cartProduct'
import '../../styles/ProductCard.css'

/**
 * Nombre: ProductCard
 * Descripción: Renderiza la tarjeta del producto con imagen, precio y estado de
 *              disponibilidad. Incluye una acción para agregar el producto al
 *              carrito directamente desde el catálogo, sin necesidad de entrar
 *              al detalle. El enlace al detalle y el botón de agregar son
 *              elementos independientes (no se anida un <button> dentro de un
 *              <a>, lo cual sería HTML inválido y dispararía la navegación).
 * Entradas: hit: objeto con la información del producto (resultado de Algolia).
 * Salidas: JSX con la tarjeta: un <article> que contiene un enlace navegable
 *          hacia el detalle y un botón de "Agregar al carrito".
 * Excepciones: No hay.
 */
function ProductCard({ hit }) {
  const { addItem, items } = useCart()
  const { session } = useSession()
  const [justAdded, setJustAdded] = useState(false)
  const role = session?.role
  // El administrador consulta el catálogo pero no compra: no ve el botón.
  const canUseCart = hasPermission(session, PERMISSIONS.USE_CART)

  const quantityInCart = items.find((item) => item.id === hit.objectID)?.quantity ?? 0
  const availability = getCartAvailability(hit, quantityInCart, role)
  const { isAvailable, isAtStockLimit, canAddToCart, hasStock, pricing } = availability
  const isB2B = pricing.priceType === PRICE_TYPES.B2B
  const b2bConditions = isB2B ? formatB2BConditions(pricing.minQuantity, pricing.discounts) : ''

  useEffect(() => {
    if (!justAdded) return undefined

    const timeoutId = window.setTimeout(() => setJustAdded(false), 1500)
    return () => window.clearTimeout(timeoutId)
  }, [justAdded])

  /**
   * Nombre: handleAddToCart
   * Descripción: Agrega el producto al carrito con el precio del rol actual
   *              (una unidad, o el pedido mínimo si es cliente B2B).
   * Entradas: Ninguna (usa los datos de `hit` del closure).
   * Salidas: No retorna valor; despacha addItem y activa la confirmación visual.
   * Excepciones: No hay; el reducer del carrito valida el stock disponible.
   */
  function handleAddToCart() {
    addItem(toCartItem(hit, role))
    setJustAdded(true)
  }

  return (
    <article className="product-card">
      <div className="product-card__surface">
        <Link to={`/producto/${hit.objectID}`} className="product-card__link">
          <div className="product-card__image">
            <img
              src={hit.image_url}
              alt={hit.title}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = `${import.meta.env.BASE_URL}icons.svg`
              }}
            />
          </div>

          <div className="product-card__info">
            <span className="product-card__category">{hit.category_facet}</span>
            <h3 className="product-card__title">{hit.title}</h3>
            <p className="product-card__brand">{hit.brand}</p>

            <div className="product-card__footer">
              {pricing.isValid ? (
                <span className="product-card__price">
                  {formatCRC(pricing.basePrice)}
                  {isB2B && <span className="product-card__price-type">B2B</span>}
                </span>
              ) : (
                <span className="product-card__price product-card__price--invalid">Precio no disponible</span>
              )}
              <span className={`product-card__stock ${hasStock ? 'in-stock' : 'out-of-stock'}`}>
                {hasStock ? 'Disponible' : 'Agotado'}
              </span>
            </div>
            {b2bConditions && <p className="product-card__conditions">{b2bConditions}</p>}
          </div>
        </Link>

        {canUseCart && (
        <button
          type="button"
          className={`product-card__add${justAdded ? ' product-card__add--success' : ''}`}
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          aria-label={
            !isAvailable
              ? `${hit.title}: ${getAddButtonLabel(availability, false)}`
              : isAtStockLimit
                ? `${hit.title}: ya tienes todo el stock disponible en el carrito`
                : `Agregar ${hit.title} al carrito`
          }
        >
          {getAddButtonLabel(availability, justAdded)}
        </button>
        )}
      </div>
    </article>
  )
}

export default ProductCard
