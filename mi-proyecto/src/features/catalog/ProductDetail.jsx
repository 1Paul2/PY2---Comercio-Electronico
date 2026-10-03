import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { searchClient } from './searchClient'
import { formatCRCParts, formatPercent } from './format'
import RelatedProducts from './RelatedProducts'
import { useCart } from '../../context/useCart'
import '../../styles/ProductDetail.css'

// Nombre del índice de productos en Algolia.
const INDEX_NAME = 'grupo-07_products'

// Correo de contacto para enviar cotizaciones desde la vista de detalle.
const QUOTE_EMAIL = 'ventas@maquinariacr.com'

// Atributos prioritarios que se mostrarán como datos rápidos del producto.
const QUICK_FACT_KEYS = ['brand', 'condition', 'category', 'year']

// Etiquetas legibles para cada facet técnico que se renderiza en la ficha.
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
  // Almacena el resultado de la consulta del producto por ID.
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
  // Estado del producto consultado: carga, éxito, error o no encontrado.
  const { status, product } = useProduct(id)
  const { addItem } = useCart()

  // Permite volver a la vista anterior desde el detalle.
  const navigate = useNavigate()

  // Selección activa del tipo de precio: público o mayorista.
  const [priceTab, setPriceTab] = useState('b2c')

  // Cantidad seleccionada por el usuario para cotizar o comprar.
  const [quantity, setQuantity] = useState(1)

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

  // Desestructura la información principal del producto para renderizar la vista.
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

  // Suma total del inventario disponible en todas las sedes del producto.
  const totalStock = locations.reduce((sum, loc) => sum + (loc.stock_quantity || 0), 0)

  // Indica si el producto ofrece precios mayoristas además del público.
  const hasB2B = Boolean(pricing.b2b)

  // Precio activo según la opción seleccionada por el usuario.
  const activeTab = hasB2B ? priceTab : 'b2c'

  // Cantidad mínima permitida según el tipo de precio activo.
  const minQuantity = activeTab === 'b2b' ? pricing.b2b?.min_order_quantity || 1 : 1

  // Verifica si el producto está agotado en la modalidad pública.
  const isOutOfStock = totalStock <= 0 || (activeTab === 'b2c' && pricing.b2c?.in_stock === false)

  // Máximo de unidades permitidas según el stock disponible.
  const maxQuantity = totalStock

  // Indica si la cantidad actual llegó al límite disponible.
  const isAtMaxStock = quantity >= maxQuantity

  // Precio unitario vigente según la pestaña activa.
  const rawUnitPrice = activeTab === 'b2b' ? pricing.b2b?.price_crc : pricing.b2c?.price_crc

  // Mejor descuento aplicable según la cantidad elegida para precio mayorista.
  const bestDiscount =
    activeTab === 'b2b'
      ? (pricing.b2b?.volume_discounts || [])
          .filter((discount) => quantity >= discount.min_units)
          .reduce((best, discount) => (!best || discount.min_units > best.min_units ? discount : best), null)
      : null

  // Precio unitario final luego de aplicar el descuento vigente.
  const discountedUnitPrice =
    typeof rawUnitPrice === 'number' && bestDiscount
      ? rawUnitPrice * (1 - bestDiscount.discount_pct)
      : rawUnitPrice

  // Monto total calculado para la cantidad seleccionada.
  const totalPrice = typeof discountedUnitPrice === 'number' ? discountedUnitPrice * quantity : null

  // Datos del precio total para renderizar moneda y monto.
  const activePrice = formatCRCParts(totalPrice)

  // Datos del precio unitario final para mostrarlo en pantalla.
  const unitPriceParts = formatCRCParts(discountedUnitPrice)

  // Datos del precio original para comparar con el descuento aplicado.
  const originalUnitPriceParts = bestDiscount ? formatCRCParts(rawUnitPrice) : null

  /**
   * Nombre: handleTabChange
   * Descripción: Cambia la pestaña de precio activa y ajusta la cantidad seleccionada al mínimo correspondiente.
   * Entradas: tab: identificador de la pestaña a activar ('b2c' o 'b2b').
   * Salidas: No retorna valor; actualiza priceTab y quantity.
   * Excepciones: No hay.
   */
  function handleTabChange(tab) {
    setPriceTab(tab)
    const nextMin = tab === 'b2b' ? pricing.b2b?.min_order_quantity || 1 : 1
    setQuantity(totalStock > 0 ? Math.min(nextMin, totalStock) : nextMin)
  }

  // Genera el enlace de correo para enviar la cotización del producto actual.
  const quoteHref = (() => {
    const subject = `Cotización — ${title} (${objectID})`
    const body = [
      `Hola, quisiera cotizar ${quantity} unidad(es) de "${title}" (SKU ${objectID}).`,
      `Tipo de precio: ${activeTab === 'b2b' ? 'Mayorista (B2B)' : 'Público (B2C)'}.`,
    ].join('\n')
    return `mailto:${QUOTE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  })()

  function handleAddToCart() {
    addItem({
      id: objectID,
      name: title,
      price: discountedUnitPrice,
      image: image_url,
      weight_kg: facets.weight_kg,
      quantity,
      maxStock: totalStock,
    })
  }

  // Redondea la calificación para mostrar estrellas completas visualmente.
  const ratingRounded = typeof rating === 'number' ? Math.round(rating) : 0

  // Resumen de datos clave del producto para mostrar en la parte superior.
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
          {hasB2B ? (
            <div className="buybox__tabs" role="tablist" aria-label="Tipo de precio">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'b2c'}
                className={activeTab === 'b2c' ? 'is-active' : ''}
                onClick={() => handleTabChange('b2c')}
              >
                Precio al público
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'b2b'}
                className={activeTab === 'b2b' ? 'is-active' : ''}
                onClick={() => handleTabChange('b2b')}
              >
                Precio mayorista
              </button>
            </div>
          ) : (
            <h2 className="buybox__heading">Precio al público</h2>
          )}

          <p className="pricing-card__price">
            {activePrice ? (
              <>
                <span className="pricing-card__currency">{activePrice.symbol}</span>
                {activePrice.amount}
              </>
            ) : (
              'Precio no disponible'
            )}
          </p>

          {quantity > 1 && unitPriceParts && (
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

          {activeTab === 'b2c' ? (
            <span className={`stock-badge ${pricing.b2c?.in_stock ? 'stock-badge--in' : 'stock-badge--out'}`}>
              {pricing.b2c?.in_stock ? 'Disponible' : 'Agotado'}
            </span>
          ) : (
            <p className="pricing-card__meta">
              Pedido mínimo: {pricing.b2b.min_order_quantity} unidad(es)
            </p>
          )}

          {activeTab === 'b2b' && pricing.b2b.volume_discounts?.length > 0 && (
            <div className="pricing-card__discounts-wrap">
              <table className="pricing-card__discounts">
                <thead>
                  <tr>
                    <th>Desde (unidades)</th>
                    <th>Descuento</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.b2b.volume_discounts.map((discount) => (
                    <tr key={discount.min_units}>
                      <td>{discount.min_units}</td>
                      <td>{formatPercent(discount.discount_pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="buybox__actions">
            <div className="quantity-selector">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(minQuantity, q - 1))}
                disabled={quantity <= minQuantity}
                aria-label="Disminuir cantidad"
              >
                −
              </button>
              <span className="quantity-selector__value">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={isAtMaxStock}
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>

            {isOutOfStock ? (
              <button type="button" className="btn-cta" disabled>
                No disponible
              </button>
            ) : (
              <>
                <button type="button" className="btn-cta" onClick={handleAddToCart}>
                  Agregar al carrito
                </button>
                <a className="btn-cta btn-cta--secondary" href={quoteHref}>
                  Solicitar cotización
                </a>
              </>
            )}
          </div>

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
      </div>
    </article>
  )
}

export default ProductDetail