import { useEffect, useRef, useState } from 'react'
import { searchClient } from './searchClient'
import ProductCard from './ProductCard'
import '../../styles/RelatedProducts.css'

const INDEX_NAME = 'grupo-07_products'
const RELATED_LIMIT = 12

/**
 * Nombre: escapeFilterValue
 * Descripción: Escapa comillas dobles dentro de un valor de filtro para consultas de Algolia.
 * Entradas: value: valor a escapar.
 * Salidas: Cadena segura para la consulta de filtros.
 * Excepciones: No hay.
 */
function escapeFilterValue(value) {
  return String(value).replace(/"/g, '\\"')
}

/**
 * Nombre: useRelatedProducts
 * Descripción: Consulta productos relacionados según categoría o marca para mostrar sugerencias.
 * Entradas: categoryFacet, brandFacet, excludeId: filtros y exclusión del producto actual.
 * Salidas: Estado con hits y estatus de carga.
 * Excepciones: No hay.
 */
function useRelatedProducts({ categoryFacet, brandFacet, excludeId }) {
  const [state, setState] = useState({ status: 'loading', hits: [] })

  useEffect(() => {
    if (!categoryFacet && !brandFacet) {
      return undefined
    }

    let cancelled = false

    const clauses = []
    if (categoryFacet) clauses.push(`category_facet:"${escapeFilterValue(categoryFacet)}"`)
    if (brandFacet) clauses.push(`brand_facet:"${escapeFilterValue(brandFacet)}"`)
    const filters = clauses.length > 1 ? `(${clauses.join(' OR ')})` : clauses[0]

    searchClient
      .search([
        {
          indexName: INDEX_NAME,
          params: {
            query: '',
            filters,
            hitsPerPage: RELATED_LIMIT + 1,
          },
        },
      ])
      .then((response) => {
        if (cancelled) return
        const hits = (response.results?.[0]?.hits || [])
          .filter((hit) => hit.objectID !== excludeId)
          .slice(0, RELATED_LIMIT)
        setState({ status: hits.length > 0 ? 'ready' : 'empty', hits })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', hits: [] })
      })

    return () => {
      cancelled = true
    }
  }, [categoryFacet, brandFacet, excludeId])

  if (!categoryFacet && !brandFacet) {
    return { status: 'empty', hits: [] }
  }

  return state
}

/**
 * Nombre: RelatedProducts
 * Descripción: Renderiza una fila desplazable con productos relacionados al producto actual.
 *              Se navega con dos flechas sobre los costados de la fila (semitransparentes,
 *              se resaltan al pasar el mouse) o deslizando con el dedo en pantallas táctiles.
 *              La navegación es de ida y vuelta: al llegar al final, "›" regresa al inicio, y desde
 *              el inicio, "‹" salta al final. Si todos los productos caben, las flechas se ocultan.
 * Entradas: categoryFacet, brandFacet, excludeId: datos para encontrar productos similares.
 * Salidas: JSX con la sección de productos relacionados.
 * Excepciones: No hay.
 */
function RelatedProducts({ categoryFacet, brandFacet, excludeId }) {
  const { status, hits } = useRelatedProducts({ categoryFacet, brandFacet, excludeId })
  const trackRef = useRef(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  // Solo hay flechas si los productos no caben todos a la vez.
  const hasOverflow = canScrollPrev || canScrollNext

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

  if (status === 'loading' || status === 'empty' || status === 'error') {
    return null
  }

  return (
    <section className="related-products" aria-label="Productos relacionados">
      <div className="related-products__header">
        <h2>Productos relacionados</h2>
      </div>

      <div className="related-products__viewport">
        <button
          type="button"
          className="related-products__arrow related-products__arrow--prev"
          onClick={() => scrollByDirection(-1)}
          hidden={!hasOverflow}
          aria-label={canScrollPrev ? 'Ver productos anteriores' : 'Ir al final de los productos'}
        >
          ‹
        </button>

        <div className="related-products__track" ref={trackRef}>
          {hits.map((hit) => (
            <div className="related-products__item" key={hit.objectID}>
              <ProductCard hit={hit} />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="related-products__arrow related-products__arrow--next"
          onClick={() => scrollByDirection(1)}
          hidden={!hasOverflow}
          aria-label={canScrollNext ? 'Ver más productos' : 'Volver al inicio de los productos'}
        >
          ›
        </button>
      </div>
    </section>
  )
}

export default RelatedProducts
