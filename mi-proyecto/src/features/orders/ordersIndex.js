import { searchClient } from '../catalog/searchClient'
import { isValidOrderNumber } from './orderNumber'
import { getOrder as getLocalOrder, listOrders as listLocalOrders } from './orderStorage'

/**
 * Módulo: ordersIndex
 * Descripción: Consulta de órdenes para "Mis órdenes" y el panel
 *              administrativo (proyecto 3).
 *
 * Estrategia de persistencia elegida por el grupo:
 *   - Índice de Algolia grupo-07_orders: contiene las órdenes de ejemplo que
 *     carga `npm run seed-orders` (scripts/seed-orders.mjs). La app solo lo
 *     LEE con la llave de búsqueda; nunca escribe en Algolia desde el
 *     navegador, porque eso exigiría publicar una llave con permiso de
 *     escritura.
 *   - localStorage (orderStorage.js): guarda las órdenes que se generan en
 *     el checkout de este navegador.
 *   - Las funciones de este módulo juntan ambas fuentes. Si un número de
 *     orden está en las dos, gana la copia local (es la más reciente, por
 *     ejemplo tras reintentar un pago).
 *
 * Si Algolia no responde, se devuelven al menos las órdenes locales y se
 * marca `remoteError: true` para que la pantalla avise.
 */

export const ORDERS_INDEX = 'grupo-07_orders'
const MAX_REMOTE_ORDERS = 1000

/**
 * Nombre: normalizeRemoteOrder
 * Descripción: Quita los campos internos de Algolia y descarta registros sin
 *              los datos mínimos de una orden.
 */
function normalizeRemoteOrder(hit) {
  if (!hit || !isValidOrderNumber(hit.orderNumber) || !Array.isArray(hit.items)) return null
  // eslint-disable-next-line no-unused-vars
  const { objectID, _highlightResult, _snippetResult, _rankingInfo, ...order } = hit
  return { ...order, source: 'algolia' }
}

/**
 * Nombre: fetchRemoteOrders
 * Descripción: Lee órdenes del índice de Algolia.
 * Entradas: filters (opcional): filtro de Algolia, por ejemplo
 *           'customer.userId:"u-b2b-01"'.
 * Salidas: Promise con el arreglo de órdenes.
 * Excepciones: Rechaza si Algolia no responde.
 */
async function fetchRemoteOrders(filters) {
  const { results } = await searchClient.search({
    requests: [
      {
        indexName: ORDERS_INDEX,
        query: '',
        hitsPerPage: MAX_REMOTE_ORDERS,
        ...(filters ? { filters } : {}),
      },
    ],
  })
  return (results[0]?.hits ?? []).map(normalizeRemoteOrder).filter(Boolean)
}

/**
 * Nombre: mergeOrders
 * Descripción: Junta órdenes locales y remotas sin repetir números de orden
 *              y las ordena de la más reciente a la más antigua.
 */
function mergeOrders(localOrders, remoteOrders) {
  const byNumber = new Map()
  for (const order of remoteOrders) byNumber.set(order.orderNumber, order)
  for (const order of localOrders) byNumber.set(order.orderNumber, { ...order, source: 'local' })
  return [...byNumber.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

/**
 * Nombre: listAllOrders
 * Descripción: Todas las órdenes (para el administrador).
 * Salidas: Promise con { orders, remoteError }.
 * Excepciones: No rechaza.
 */
export async function listAllOrders() {
  const localOrders = listLocalOrders()
  try {
    return { orders: mergeOrders(localOrders, await fetchRemoteOrders()), remoteError: false }
  } catch {
    return { orders: mergeOrders(localOrders, []), remoteError: true }
  }
}

/**
 * Nombre: listOrdersByUser
 * Descripción: Órdenes de un usuario (para "Mis órdenes").
 * Entradas: userId: objectID del usuario en grupo-07_users.
 * Salidas: Promise con { orders, remoteError }.
 * Excepciones: No rechaza; sin userId devuelve una lista vacía.
 */
export async function listOrdersByUser(userId) {
  if (!userId) return { orders: [], remoteError: false }
  const localOrders = listLocalOrders().filter((order) => order.customer?.userId === userId)
  try {
    const safeId = String(userId).replace(/"/g, '')
    const remoteOrders = await fetchRemoteOrders(`customer.userId:"${safeId}"`)
    return {
      orders: mergeOrders(localOrders, remoteOrders.filter((order) => order.customer?.userId === userId)),
      remoteError: false,
    }
  } catch {
    return { orders: mergeOrders(localOrders, []), remoteError: true }
  }
}

/**
 * Nombre: getOrder
 * Descripción: Busca una orden por número, primero en este navegador y
 *              luego en Algolia.
 * Entradas: orderNumber: número de orden (MCR-AAAAMMDD-XXXXXXXX).
 * Salidas: Promise con la orden, o null si no existe o el número es inválido.
 * Excepciones: No rechaza; si Algolia falla devuelve null y quien llama
 *              muestra "no encontramos la orden".
 */
export async function getOrder(orderNumber) {
  if (!isValidOrderNumber(orderNumber)) return null
  const local = getLocalOrder(orderNumber)
  if (local) return { ...local, source: 'local' }
  try {
    const remote = await fetchRemoteOrders(`orderNumber:"${orderNumber}"`)
    return remote[0] ?? null
  } catch {
    return null
  }
}
