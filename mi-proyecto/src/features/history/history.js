import { getSession } from '../session/session.js'

export const HISTORY_PREFIX = 'ecom_history_'
export const HISTORY_LIMIT = 10

const emptyHistory = () => ({ products: [], searches: [] })
const cleanQuery = (query) => typeof query === 'string' ? query.trim().replace(/\s+/g, ' ') : ''

// Sin sesión no se guarda historial: evita compartir datos entre visitantes.
export function getHistory(userId = getSession()?.userId) {
  if (!userId) return emptyHistory()
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_PREFIX + userId))
    return {
      products: Array.isArray(value?.products)
        ? value.products.filter((item) => item && typeof item.objectID === 'string').slice(0, HISTORY_LIMIT) : [],
      searches: Array.isArray(value?.searches)
        ? value.searches.filter((item) => item && cleanQuery(item.query)).slice(0, HISTORY_LIMIT) : [],
    }
  } catch {
    return emptyHistory()
  }
}

function saveEntry(list, entry, matches) {
  const userId = getSession()?.userId
  if (!userId) return false
  try {
    const history = getHistory(userId)
    history[list] = [entry, ...history[list].filter((item) => !matches(item))].slice(0, HISTORY_LIMIT)
    localStorage.setItem(HISTORY_PREFIX + userId, JSON.stringify(history))
    return true
  } catch {
    // Una falla de almacenamiento no debe interrumpir la navegación.
    return false
  }
}

// Conserva los campos necesarios para mostrar tarjetas y recomendar por categoría.
export function rememberProduct(product) {
  if (!product || product.objectID == null) return false
  const objectID = String(product.objectID)
  if (!objectID) return false
  const entry = {
    objectID,
    title: product.title ?? '',
    image_url: product.image_url ?? '',
    brand: product.brand ?? null,
    category_facet: product.category_facet ?? null,
    price_crc: product.pricing?.b2c?.price_crc ?? null,
    viewedAt: new Date().toISOString(),
  }
  return saveEntry('products', entry, (item) => item.objectID === objectID)
}

export function rememberSearch(query) {
  const normalized = cleanQuery(query)
  if (!normalized) return false
  return saveEntry('searches', {
    query: normalized,
    searchedAt: new Date().toISOString(),
  }, (item) => cleanQuery(item.query).toLowerCase() === normalized.toLowerCase())
}
