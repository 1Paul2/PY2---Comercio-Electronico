import { isValidOrderNumber } from './orderNumber'

const ORDERS_STORAGE_KEY = 'maquinaria-cr-orders-v1'

/**
 * Nombre: isStoredOrder
 * Descripción: Verifica que un valor leído tenga la forma mínima de una orden
 *              para descartar datos corruptos o editados a mano.
 */
function isStoredOrder(order) {
  return (
    order !== null &&
    typeof order === 'object' &&
    isValidOrderNumber(order.orderNumber) &&
    Array.isArray(order.items) &&
    Number.isFinite(order.total) &&
    typeof order.orderStatus === 'string' &&
    typeof order.paymentStatus === 'string'
  )
}

/**
 * Nombre: readStore
 * Descripción: Lee el contenedor completo desde localStorage.
 * Salidas: { orders, lastOrderNumber }; vacío si no hay datos o son inválidos.
 * Excepciones: No lanza.
 */
function readStore() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    const orders = {}
    if (parsed && typeof parsed.orders === 'object' && parsed.orders !== null) {
      for (const [key, order] of Object.entries(parsed.orders)) {
        if (isStoredOrder(order) && order.orderNumber === key) orders[key] = order
      }
    }
    const last = parsed?.lastOrderNumber
    return { orders, lastOrderNumber: orders[last] ? last : null }
  } catch {
    return { orders: {}, lastOrderNumber: null }
  }
}

/**
 * Nombre: writeStore
 * Descripción: Guarda el contenedor en localStorage.
 * Salidas: true si se guardó; false si el almacenamiento falló.
 * Excepciones: No lanza.
 */
function writeStore(store) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(store))
    return true
  } catch {
    return false
  }
}

/**
 * Nombre: saveOrder
 * Descripción: Guarda una orden nueva y la marca como la última creada.
 * Entradas: order: objeto devuelto por buildOrder.
 * Salidas: true si quedó guardada; false si la orden es inválida, ya existe
 *          ese número de orden o el almacenamiento falló.
 * Excepciones: No lanza; el llamador decide qué mostrar al usuario.
 */
export function saveOrder(order) {
  if (!isStoredOrder(order)) return false
  const store = readStore()
  if (store.orders[order.orderNumber]) return false
  store.orders[order.orderNumber] = order
  store.lastOrderNumber = order.orderNumber
  return writeStore(store)
}

/**
 * Nombre: updateOrder
 * Descripción: Actualiza campos de una orden ya guardada (por ejemplo, los
 *              estados tras el resultado del pago). No permite cambiar el
 *              número de orden.
 * Entradas: orderNumber: número de la orden; changes: campos a sobrescribir.
 * Salidas: la orden actualizada, o null si no existe o no se pudo guardar.
 * Excepciones: No lanza.
 */
export function updateOrder(orderNumber, changes) {
  const store = readStore()
  const current = store.orders[orderNumber]
  if (!current) return null
  const updated = { ...current, ...changes, orderNumber: current.orderNumber }
  if (!isStoredOrder(updated)) return null
  store.orders[orderNumber] = updated
  return writeStore(store) ? updated : null
}

/**
 * Nombre: getOrder
 * Descripción: Busca una orden por su número.
 * Salidas: la orden, o null si no existe.
 * Excepciones: No lanza.
 */
export function getOrder(orderNumber) {
  return readStore().orders[orderNumber] ?? null
}

/**
 * Nombre: getLastOrder
 * Descripción: Devuelve la última orden creada (para la página de confirmación
 *              si se abre sin datos de navegación).
 * Salidas: la orden, o null si no hay.
 * Excepciones: No lanza.
 */
export function getLastOrder() {
  const { orders, lastOrderNumber } = readStore()
  return lastOrderNumber ? orders[lastOrderNumber] : null
}

/**
 * Nombre: listOrders
 * Descripción: Lista todas las órdenes guardadas, la más reciente primero.
 * Salidas: arreglo de órdenes (vacío si no hay).
 * Excepciones: No lanza.
 */
export function listOrders() {
  return Object.values(readStore().orders).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )
}