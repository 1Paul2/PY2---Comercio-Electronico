import { useEffect, useState } from 'react'
import { searchClient } from './searchClient'
import ProductCarousel from './ProductCarousel'

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
 * Descripción: Renderiza una fila desplazable con productos relacionados al
 *              producto actual (misma categoría o marca). La fila y sus
 *              flechas viven en ProductCarousel.
 * Entradas: categoryFacet, brandFacet, excludeId: datos para encontrar productos similares.
 * Salidas: JSX con la sección de productos relacionados.
 * Excepciones: No hay.
 */
function RelatedProducts({ categoryFacet, brandFacet, excludeId }) {
  const { status, hits } = useRelatedProducts({ categoryFacet, brandFacet, excludeId })

  if (status !== 'ready') return null

  return <ProductCarousel title="Productos relacionados" hits={hits} className="related-products" />
}

export default RelatedProducts
