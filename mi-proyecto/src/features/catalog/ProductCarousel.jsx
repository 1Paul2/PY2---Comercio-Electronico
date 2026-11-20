import { useEffect, useRef, useState } from 'react'
import ProductCard from './ProductCard'
import '../../styles/ProductCarousel.css'

/**
 * Nombre: ProductCarousel
 * Descripción: Fila desplazable de tarjetas de producto. La comparten
 *              "Productos relacionados" y los bloques personalizados
 *              (vistos recientemente, recomendaciones y carrito).
 *              Se navega con dos flechas sobre los costados de la fila
 *              (semitransparentes, se resaltan al pasar el mouse) o deslizando
 *              con el dedo en pantallas táctiles. La navegación es de ida y
 *              vuelta: al llegar al final, "›" regresa al inicio, y desde el
 *              inicio, "‹" salta al final. Si todos los productos caben, las
 *              flechas se ocultan.
 * Entradas: title: título de la sección.
 *           subtitle: texto opcional que explica por qué se muestran.
 *           headerAction: elemento opcional a la derecha del título.
 *           toolbar: elemento opcional entre el título y la fila (pestañas).
 *           hits: productos de Algolia a mostrar.
 *           onRemoveItem: si se recibe, cada tarjeta muestra una ✕ que lo
 *                         llama con el producto.
 *           ariaLabel: nombre accesible de la sección (por defecto el título).
 *           className: clase extra para la sección.
 * Salidas: JSX con la sección, o null si no hay productos.
 * Excepciones: No hay.
 */
function ProductCarousel({
  title,
  subtitle,
  headerAction,
  toolbar,
  hits,
  onRemoveItem,
  ariaLabel,
  className = '',
}) {
  const trackRef = useRef(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const hasOverflow = canScrollPrev || canScrollNext
  const hasHits = hits.length > 0

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    function updateScrollState() {
      setCanScrollPrev(track.scrollLeft > 4)
      setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4)
    }

    updateScrollState()
    track.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      track.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [hits])

  /**
   * Nombre: scrollByDirection
   * Descripción: Avanza o retrocede la fila. En los extremos da la vuelta:
   *              al final regresa al inicio y al inicio salta al final.
   * Entradas: direction: 1 (siguiente) o -1 (anterior).
   */
  function scrollByDirection(direction) {
    const track = trackRef.current
    if (!track) return

    if (direction > 0 && !canScrollNext) {
      track.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (direction < 0 && !canScrollPrev) {
      track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' })
    } else {
      track.scrollBy({ left: track.clientWidth * 0.8 * direction, behavior: 'smooth' })
    }
  }

  if (!hasHits && !toolbar) return null

  return (
    <section className={`product-carousel ${className}`.trim()} aria-label={ariaLabel ?? title}>
      <div className="product-carousel__header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="product-carousel__subtitle">{subtitle}</p>}
        </div>
        {headerAction}
      </div>

      {toolbar}

      {hasHits && (
        <div className="product-carousel__viewport">
          <button
            type="button"
            className="product-carousel__arrow product-carousel__arrow--prev"
            onClick={() => scrollByDirection(-1)}
            hidden={!hasOverflow}
            aria-label={canScrollPrev ? 'Ver productos anteriores' : 'Ir al final de los productos'}
          >
            ‹
          </button>

          <div className="product-carousel__track" ref={trackRef}>
            {hits.map((hit) => (
              <div className="product-carousel__item" key={hit.objectID}>
                {onRemoveItem && (
                  <button
                    type="button"
                    className="product-carousel__remove"
                    onClick={() => onRemoveItem(hit)}
                    aria-label={`Quitar "${hit.title}" de tu historial`}
                    title="Quitar de tu historial"
                  >
                    ✕
                  </button>
                )}
                <ProductCard hit={hit} />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="product-carousel__arrow product-carousel__arrow--next"
            onClick={() => scrollByDirection(1)}
            hidden={!hasOverflow}
            aria-label={canScrollNext ? 'Ver más productos' : 'Volver al inicio de los productos'}
          >
            ›
          </button>
        </div>
      )}
    </section>
  )
}

export default ProductCarousel
