import { HISTORY_LIMIT } from '../history/history.js'

/**
 * Módulo: recommendations
 * Descripción: Reglas de personalización (laboratorio 5, requerimiento C).
 *              Funciones puras: reciben el historial real del usuario y
 *              devuelven qué recomendar y por qué. No consultan Algolia ni
 *              tocan la pantalla, así se pueden explicar y probar aparte.
 *
 * Estrategia:
 *   1. Cada producto visto suma puntos a su categoría. Los más recientes
 *      pesan más: el último visto vale HISTORY_LIMIT (10) y el más viejo 1.
 *   2. Las categorías con más puntos son los intereses del usuario.
 *   3. "Para ti" combina las 3 principales; cada una tiene además su propia
 *      pestaña. La última búsqueda agrega una pestaña más.
 *   4. Nunca se recomiendan productos que el usuario ya vio.
 */

export const TOP_CATEGORIES = 3

/**
 * Nombre: escapeFilterValue
 * Descripción: Escapa comillas dobles para usar un valor en un filtro de Algolia.
 */
export function escapeFilterValue(value) {
  return String(value).replace(/"/g, '\\"')
}

/**
 * Nombre: formatList
 * Descripción: Une textos en español: ["A"] → "A", ["A","B","C"] → "A, B y C".
 */
export function formatList(values) {
  if (values.length <= 1) return values[0] ?? ''
  return `${values.slice(0, -1).join(', ')} y ${values.at(-1)}`
}

/**
 * Nombre: rankCategories
 * Descripción: Puntúa las categorías de los productos vistos.
 * Entradas: products: history.products (el más reciente primero).
 * Salidas: [{ category, score, views }] de mayor a menor puntaje; ante un
 *          empate gana la que tiene más vistas y luego el orden alfabético.
 * Excepciones: No lanza.
 */
export function rankCategories(products = []) {
  const byCategory = new Map()

  products.forEach((product, index) => {
    const category = product?.category_facet
    if (!category) return
    const weight = Math.max(1, HISTORY_LIMIT - index)
    const entry = byCategory.get(category) ?? { category, score: 0, views: 0 }
    entry.score += weight
    entry.views += 1
    byCategory.set(category, entry)
  })

  return [...byCategory.values()].sort(
    (a, b) => b.score - a.score || b.views - a.views || a.category.localeCompare(b.category)
  )
}

/**
 * Nombre: categoryFilter
 * Descripción: Filtro de Algolia que acepta cualquiera de las categorías.
 */
export function categoryFilter(categories) {
  return categories.map((category) => `category_facet:"${escapeFilterValue(category)}"`).join(' OR ')
}

/**
 * Nombre: buildRecommendationTabs
 * Descripción: Arma las pestañas de "Inspirado en tu historial".
 * Entradas: history: { products, searches } del usuario activo.
 * Salidas: arreglo de pestañas { id, label, reason, categories?, query? }.
 *          Vacío si el usuario todavía no vio productos ni buscó nada.
 * Excepciones: No lanza.
 */
export function buildRecommendationTabs(history) {
  const ranked = rankCategories(history?.products).slice(0, TOP_CATEGORIES)
  const lastSearch = history?.searches?.[0]?.query
  const tabs = []

  if (ranked.length > 0) {
    const categories = ranked.map((entry) => entry.category)
    tabs.push({
      id: 'all',
      label: 'Para ti',
      categories,
      reason: `Porque viste ${formatList(categories)}`,
    })
    ranked.forEach(({ category, views }) => {
      tabs.push({
        id: `category:${category}`,
        label: category,
        categories: [category],
        reason: `Porque viste ${views} ${views === 1 ? 'producto' : 'productos'} de ${category}`,
      })
    })
  }

  if (lastSearch) {
    tabs.push({
      id: 'search',
      label: `«${lastSearch}»`,
      query: lastSearch,
      reason: `Según tu búsqueda «${lastSearch}»`,
    })
  }

  return tabs
}

/**
 * Nombre: buildProductRequest
 * Descripción: Convierte una pestaña (o una lista de categorías) en la
 *              consulta a Algolia. Pide de más para poder descartar los
 *              productos excluidos sin quedarse corto.
 * Entradas: { categories?, query? }, excludeIds, limit.
 * Salidas: { query, filters, hitsPerPage } o null si no hay criterio.
 * Excepciones: No lanza.
 */
export function buildProductRequest({ categories = [], query = '' } = {}, excludeIds = [], limit = 12) {
  if (categories.length === 0 && !query) return null
  return {
    query,
    filters: categories.length > 0 ? categoryFilter(categories) : '',
    hitsPerPage: limit + excludeIds.length,
  }
}

/**
 * Nombre: excludeAndLimit
 * Descripción: Quita de los resultados los productos excluidos y recorta.
 */
export function excludeAndLimit(hits, excludeIds = [], limit = 12) {
  const excluded = new Set(excludeIds)
  return hits.filter((hit) => !excluded.has(hit.objectID)).slice(0, limit)
}

/**
 * Nombre: rankCartCategories
 * Descripción: Categorías de los productos del carrito, de la que tiene más
 *              unidades a la que tiene menos.
 * Entradas: cartProducts: productos de Algolia que están en el carrito;
 *           quantities: { [objectID]: unidades }.
 * Salidas: arreglo de nombres de categoría.
 */
export function rankCartCategories(cartProducts, quantities = {}) {
  const units = new Map()
  cartProducts.forEach((product) => {
    const category = product?.category_facet
    if (!category) return
    units.set(category, (units.get(category) ?? 0) + (quantities[product.objectID] ?? 1))
  })
  return [...units.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([category]) => category)
}
