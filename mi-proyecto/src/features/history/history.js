import { getSession } from '../session/session.js'

export const HISTORY_PREFIX = 'ecom_history_'
export const HISTORY_LIMIT = 10
export const HISTORY_UPDATED_EVENT = 'ecom-history-updated'

const emptyHistory = () => ({ products: [], searches: [] })
const cleanQuery = (query) => typeof query === 'string' ? query.trim().replace(/\s+/g, ' ') : ''

export function parseHistory(raw) {
  try {
    const value = JSON.parse(raw)
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

export function readRawHistory(userId) {
  if (!userId) return null
  try {
    return localStorage.getItem(HISTORY_PREFIX + userId)
  } catch {
    return null
  }
}

export function getHistory(userId = getSession()?.userId) {
  if (!userId) return emptyHistory()
  return parseHistory(readRawHistory(userId))
}

function notifyHistoryChange(userId) {
  window.dispatchEvent(new CustomEvent(HISTORY_UPDATED_EVENT, { detail: { userId } }))
}

function updateHistory(change) {
  const userId = getSession()?.userId
  if (!userId) return false
  try {
    const history = change(getHistory(userId))
    localStorage.setItem(HISTORY_PREFIX + userId, JSON.stringify(history))
    notifyHistoryChange(userId)
    return true
  } catch {
    return false
  }
}

function saveEntry(list, entry, matches) {
  return updateHistory((history) => ({
    ...history,
    [list]: [entry, ...history[list].filter((item) => !matches(item))].slice(0, HISTORY_LIMIT),
  }))
}

const sameQuery = (a, b) => cleanQuery(a).toLowerCase() === cleanQuery(b).toLowerCase()

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
  }, (item) => sameQuery(item.query, normalized))
}

export function removeProduct(objectID) {
  const id = String(objectID ?? '')
  if (!id) return false
  return updateHistory((history) => ({
    ...history,
    products: history.products.filter((item) => item.objectID !== id),
  }))
}

export function removeSearch(query) {
  if (!cleanQuery(query)) return false
  return updateHistory((history) => ({
    ...history,
    searches: history.searches.filter((item) => !sameQuery(item.query, query)),
  }))
}

export function clearHistory() {
  return updateHistory(() => emptyHistory())
}
