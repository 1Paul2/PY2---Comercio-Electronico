import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { searchClient } from './searchClient'
import { formatCRC, formatCRCParts, formatPercent } from './format'
import RelatedProducts from './RelatedProducts'
import RecentlyViewed from '../personalization/RecentlyViewed'
import { useCart } from '../../context/useCart'
import { useSession } from '../../context/useSession'
import { rememberProduct } from '../history/history'
import { hasPermission, PERMISSIONS, ROLES } from '../session/roles'
import { getBasePrice, getProductPricing, INVALID_PRICE_MESSAGE, PRICE_TYPES } from '../pricing/pricing'
import { getTotalStock, toCartItem } from './cartProduct'
import { EVENT_TYPES, trackEvent } from '../activity/activityLog'
import '../../styles/ProductDetail.css'

const INDEX_NAME = 'grupo-07_products'
const QUOTE_EMAIL = 'ventas@maquinariacr.com'
const QUICK_FACT_KEYS = ['brand', 'condition', 'category', 'year']
const FACET_LABELS = {
  año_produccion_rango: 'Rango de año de producción',
  blade_type: 'Tipo de hoja',
  blade_width_m: 'Ancho de hoja (m)',
  brand: 'Marca',
  bucket_capacity_m3: 'Capacidad de cucharón (m³)',
  capacity_ah: 'Capacidad (Ah)',
  capacity_m3: 'Capacidad (m³)',
  capacity_ton: 'Capacidad (ton)',
  category: 'Categoría',
  compatible_models: 'Modelos compatibles',
  condition: 'Condición',
  digging_reach_m: 'Alcance de excavación (m)',
  drum_type: 'Tipo de tambor',
  drum_width_m: 'Ancho de tambor (m)',
  engine_model: 'Modelo de motor',
  filtration_microns: 'Filtración (micrones)',
  flow_lpm: 'Caudal (l/min)',
  frequency_hz: 'Frecuencia (Hz)',
  fuel_capacity_liters: 'Capacidad de combustible (l)',
  includes: 'Incluye',
  load_capacity_kg: 'Capacidad de carga (kg)',
  load_capacity_ton: 'Capacidad de carga (ton)',
  material: 'Material',
  max_capacity_ton: 'Capacidad máxima (ton)',
  max_length_m: 'Longitud máxima (m)',
  potencia_motor_hp: 'Potencia del motor (hp)',
  power_hp: 'Potencia (hp)',
  power_kw: 'Potencia (kW)',
  pressure_psi: 'Presión (psi)',
  price_range_crc: 'Rango de precio (₡)',
  size: 'Tamaño / medida',
  torque_nm: 'Torque (N·m)',
  transmision: 'Transmisión',
  type: 'Tipo',
  voltage: 'Voltaje',
  weight_kg: 'Peso (kg)',
  weight_ton: 'Peso (ton)',
  width_m: 'Ancho (m)',
  year: 'Año',
}

/**
 * Nombre: formatFacetValue
 * Descripción: Normaliza el valor de un facet para mostrarlo en texto legible.
 * Entradas: value: valor del facet a convertir.
 * Salidas: Cadena formateada para renderizar en la ficha técnica.
 * Excepciones: No hay.
 */
function formatFacetValue(value) {
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

/**
 * Nombre: useProduct
 * Descripción: Consulta un producto por ID desde Algolia y devuelve su estado de carga o resultado.
 * Entradas: id: identificador del producto.
 * Salidas: Objeto con status y product.
 * Excepciones: No hay.
 */
function useProduct(id) {
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false

    searchClient
      .search({
        requests: [
          {
            indexName: INDEX_NAME,
            query: '',
            filters: `objectID:"${id}"`,
            hitsPerPage: 1,
          },
        ],
      })
      .then((response) => {
        if (cancelled) return
        const hit = response.results?.[0]?.hits?.[0]
        setResult({ id, status: hit ? 'found' : 'not-found', product: hit || null })
      })
      .catch(() => {
        if (!cancelled) setResult({ id, status: 'error', product: null })
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (!result || result.id !== id) {
    return { status: 'loading', product: null }
  }

  return result
}

/**
 * Nombre: ProductDetail
 * Descripción: Renderiza la vista completa del detalle de un producto con información, stock, precios y productos relacionados.
 * Entradas: id: identificador del producto a mostrar.
 * Salidas: JSX con la ficha completa del producto.
 * Excepciones: No hay.
 */
function ProductDetail({ id }) {
  const { status, product } = useProduct(id)
  const { addItem } = useCart()
  const { session } = useSession()

  useEffect(() => {
    if (status === 'found' && product && session?.userId) rememberProduct(product)
  }, [status, product, session?.userId])

  const navigate = useNavigate()
  const role = session?.role
  const canUseCart = hasPermission(session, PERMISSIONS.USE_CART)
  const isAdmin = role === ROLES.ADMIN
  const [quantityChoice, setQuantity] = useState(null)

  useEffect(() => {
    if (status !== 'found' || !product) return
    trackEvent(EVENT_TYPES.PRODUCT_VIEW, {
      productId: product.objectID,
      name: product.title,
      brand: product.brand ?? null,
      category: product.category_facet ?? null,
      price: getBasePrice(product, role),
      priceType: role === ROLES.B2B ? PRICE_TYPES.B2B : PRICE_TYPES.B2C,
    })
  }, [status, product, role])

  if (status === 'loading') {
    return <p className="product-detail__message">Cargando producto...</p>
  }

  if (status === 'error') {
    return <p className="product-detail__message">Ocurrió un error al consultar el producto.</p>
  }

  if (status === 'not-found') {
    return (
      <div className="product-detail__message">
        <p>No se encontró un producto con el ID «{id}».</p>
        <Link to="/productos">Volver al catálogo</Link>
      </div>
    )
  }

  const {
    title,
    description,
    brand,
    categories = [],
    rating,
    image_url,
    facets = {},
    pricing = {},
    locations = [],
    objectID,
    category_facet,
    brand_facet,
  } = product

  const totalStock = getTotalStock(product)
  const minQuantity = getProductPricing(product, role).minQuantity
  const maxQuantity = totalStock
  const quantity = Math.max(minQuantity, Math.min(quantityChoice ?? minQuantity, Math.max(maxQuantity, minQuantity)))
  const productPricing = getProductPricing(product, role, quantity)
  const isB2B = productPricing.priceType === PRICE_TYPES.B2B
  const hasStock = totalStock > 0 && pricing.b2c?.in_stock !== false
  const belowMinimumStock = hasStock && totalStock < minQuantity
  const isAtMaxStock = quantity >= maxQuantity
  const canBuy = hasStock && productPricing.isValid && !belowMinimumStock
  const bestDiscount = productPricing.discount
  const discountedUnitPrice = productPricing.unitPrice
  const totalPrice = typeof discountedUnitPrice === 'number' ? discountedUnitPrice * quantity : null
  const activePrice = formatCRCParts(totalPrice)
  const unitPriceParts = formatCRCParts(discountedUnitPrice)
  const originalUnitPriceParts = bestDiscount ? formatCRCParts(productPricing.basePrice) : null
  const adminB2C = getBasePrice(product, PRICE_TYPES.B2C)
  const adminB2B = getProductPricing(product, PRICE_TYPES.B2B)

  const quoteHref = (() => {
    const subject = `Cotización — ${title} (${objectID})`
    const body = [
      `Hola, quisiera cotizar ${quantity} unidad(es) de "${title}" (SKU ${objectID}).`,
      `Tipo de precio: ${isB2B ? 'Mayorista (B2B)' : 'Público (B2C)'}.`,
    ].join('\n')
    return `mailto:${QUOTE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  })()

  /**
   * Nombre: handleAddToCart
   * Descripción: Agrega la cantidad elegida con el precio del rol actual. El
   *              carrito recalcula el descuento por volumen con el total de
   *              unidades que quede en la línea.
   */
  function handleAddToCart() {
    addItem(toCartItem(product, role, quantity))
  }

  const ratingRounded = typeof rating === 'number' ? Math.round(rating) : 0
  const quickFacts = QUICK_FACT_KEYS.filter((key) => facets[key] !== undefined).map((key) => ({
    key,
    label: FACET_LABELS[key] || key,
    value: formatFacetValue(facets[key]),
  }))

  return (
    <article className="product-detail">
      <button
        type="button"
        className="product-detail__back"
        onClick={() => navigate(-1)}
      >
        <span aria-hidden="true">←</span> Volver
      </button>

      <nav className="product-detail__breadcrumb" aria-label="Ruta de navegación">
        <Link to="/productos">Catálogo</Link>
        {categories.map((category, index) => (
          <span key={category}>
            <span aria-hidden="true"> › </span>
            {index === categories.length - 1 ? (
              <span aria-current="page">{category}</span>
            ) : (
              category
            )}
          </span>
        ))}
      </nav>

      <div className="product-detail__layout">
        <div className="product-detail__gallery">
          <div className="product-detail__image">
            <img
              src={image_url}
              alt={title}
              onError={(e) => {
                e.currentTarget.src = '/icons.svg'
              }}
            />
          </div>
          <div className="product-detail__thumbnails">
            <div className="product-detail__thumbnail is-active">
              <img src={image_url} alt="" />
            </div>
          </div>
        </div>

        <div className="product-detail__title-block">
          <span className="product-detail__category">{category_facet}</span>
          <h1>{title}</h1>
          <p className="product-detail__sku">SKU: {objectID}</p>
        </div>

        <div className="product-detail__meta">
          <p className="product-detail__brand">{brand}</p>
          {typeof rating === 'number' && (
            <span className="star-rating" aria-label={`Calificación ${rating.toFixed(1)} de 5`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className={`star-rating__star${index < ratingRounded ? ' is-filled' : ''}`}
                >
                  ★
                </span>
              ))}
              <span className="product-detail__rating-value">{rating.toFixed(1)} / 5</span>
            </span>
          )}
        </div>

        <div className="product-detail__buybox">
          <h2 className="buybox__heading">{isB2B ? 'Precio mayorista (B2B)' : 'Precio al público'}</h2>

          <p className="pricing-card__price">
            {productPricing.isValid && activePrice ? (
              <>
                <span className="pricing-card__currency">{activePrice.symbol}</span>
                {activePrice.amount}
              </>
            ) : (
              'Precio no disponible'
            )}
          </p>

          {!productPricing.isValid && (
            <p className="pricing-card__error" role="alert">
              {INVALID_PRICE_MESSAGE}
            </p>
          )}

          {quantity > 1 && productPricing.isValid && unitPriceParts && (
            <p className="pricing-card__unit-price">
              {originalUnitPriceParts && (
                <span className="pricing-card__unit-price-original">
                  {originalUnitPriceParts.symbol}
                  {originalUnitPriceParts.amount}
                </span>
              )}
              {unitPriceParts.symbol}
              {unitPriceParts.amount} c/u
              {bestDiscount && (
                <span className="pricing-card__discount-badge">
                  −{formatPercent(bestDiscount.discount_pct)}
                </span>
              )}
            </p>
          )}

          <span className={`stock-badge ${hasStock ? 'stock-badge--in' : 'stock-badge--out'}`}>
            {hasStock ? 'Disponible' : 'Agotado'}
          </span>

          {isB2B && (
            <p className="pricing-card__meta">
              Pedido mínimo: {minQuantity} {minQuantity === 1 ? 'unidad' : 'unidades'}
            </p>
          )}

          {belowMinimumStock && (
            <p className="pricing-card__error" role="status">
              Solo hay {totalStock} {totalStock === 1 ? 'unidad' : 'unidades'} en inventario y el pedido mínimo
              B2B es de {minQuantity}. Puedes solicitar una cotización.
            </p>
          )}

          {isB2B && productPricing.discounts.length > 0 && (
            <div className="pricing-card__discounts-wrap">
              <table className="pricing-card__discounts">
                <thead>
                  <tr>
                    <th>Desde (unidades)</th>
                    <th>Descuento</th>
                  </tr>
                </thead>
                <tbody>
                  {productPricing.discounts.map((discount) => (
                    <tr
                      key={discount.min_units}
                      className={bestDiscount?.min_units === discount.min_units ? 'is-active' : undefined}
                    >
                      <td>{discount.min_units}</td>
                      <td>{formatPercent(discount.discount_pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!session && (
            <p className="pricing-card__hint">
              ¿Compras para una empresa? <Link to="/login">Inicia sesión como cliente B2B</Link> para ver el
              precio mayorista.
            </p>
          )}

          {isAdmin && (
            <div className="pricing-card__admin" role="note">
              <p className="pricing-card__admin-title">Vista de administrador</p>
              <p>Precio B2C: {adminB2C !== null ? formatCRC(adminB2C) : 'no disponible'}</p>
              <p>
                Precio B2B: {adminB2B.isValid ? formatCRC(adminB2B.basePrice) : 'no disponible'}
                {adminB2B.isValid && ` · mínimo ${adminB2B.minQuantity}`}
              </p>
              <p className="pricing-card__admin-note">Los administradores consultan precios, pero no compran.</p>
            </div>
          )}

          {canUseCart && (
            <div className="buybox__actions">
              <div className="quantity-selector">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                  disabled={quantity <= minQuantity || !canBuy}
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="quantity-selector__value">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={isAtMaxStock || !canBuy}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              {canBuy ? (
                <button type="button" className="btn-cta" onClick={handleAddToCart}>
                  Agregar al carrito
                </button>
              ) : (
                <button type="button" className="btn-cta" disabled>
                  No disponible
                </button>
              )}
              {hasStock && (
                <a className="btn-cta btn-cta--secondary" href={quoteHref}>
                  Solicitar cotización
                </a>
              )}
            </div>
          )}

          <p className="product-detail__seller">Vendido por Maquinaria CR</p>
        </div>

        {categories.length > 0 && (
          <div className="product-detail__tags">
            {categories.map((category) => (
              <span key={category} className="product-detail__tag">
                {category}
              </span>
            ))}
          </div>
        )}

        {quickFacts.length > 0 && (
          <div className="product-detail__quickfacts-wrap">
            <dl className="quick-facts">
              {quickFacts.map((fact) => (
                <div key={fact.key} className="quick-facts__row">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <section className="product-detail__section">
        <h2>Descripción</h2>
        <p className="product-detail__description">{description}</p>
      </section>

      <div className="product-detail__panels">
        {locations.length > 0 && (
          <section className="product-detail__section">
            <h2>Disponibilidad por sede</h2>
            <dl className="spec-table">
              {locations.map((location) => (
                <div key={location.site} className="spec-table__row">
                  <dt>📍 {location.site}</dt>
                  <dd className={`stock-quantity stock-quantity--${location.stock_quantity > 2 ? 'high' : 'low'}`}>
                    {location.stock_quantity} unid.
                  </dd>
                </div>
              ))}
              <div className="spec-table__row spec-table__row--total">
                <dt>Total</dt>
                <dd>{totalStock} unid.</dd>
              </div>
            </dl>
          </section>
        )}

        {Object.keys(facets).length > 0 && (
          <section className="product-detail__section">
            <h2>Ficha técnica</h2>
            <dl className="spec-table spec-table--specs">
              {Object.entries(facets).map(([key, value]) => (
                <div key={key} className="spec-table__row">
                  <dt>{FACET_LABELS[key] || key}</dt>
                  <dd>{formatFacetValue(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      <div className="product-detail__related">
        <RelatedProducts categoryFacet={category_facet} brandFacet={brand_facet} excludeId={objectID} />
        <RecentlyViewed excludeId={objectID} className="personal-section--detail" />
      </div>
    </article>
  )
}

export default ProductDetail
