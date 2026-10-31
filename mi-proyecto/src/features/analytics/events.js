import { getSession } from '../session/session'

/**
 * Nombre: events
 * Descripción: Registro local de las acciones importantes del usuario
 *              (laboratorio 5, requerimiento A). Cada evento se agrega a una
 *              lista guardada en localStorage bajo la llave "ecom_events".
 *
 * Forma de un evento guardado:
 *   {
 *     id: "evt-lx3k9a-4f2b",
 *     type: "add_to_cart",
 *     timestamp: "2026-10-31T15:24:10.512Z",
 *     userId: "u-1a2b3c4d",        // null si nadie ha iniciado sesión
 *     data: { productId: "...", name: "...", quantity: 1, price: 6200000 }
 *   }
 *
 * La persona 4 calcula las métricas leyendo esta lista (getEvents).
 */

export const EVENTS_STORAGE_KEY = 'ecom_events'

export const EVENT_TYPES = Object.freeze({
  LOGIN: 'login',
  LOGOUT: 'logout',
  SEARCH: 'search',
  PRODUCT_VIEW: 'product_view',
  ADD_TO_CART: 'add_to_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',
})

// Tope de eventos guardados: evita que localStorage se llene con el uso.
// Al pasarlo se descartan los más viejos.
const MAX_EVENTS = 1000

// Dos eventos idénticos seguidos en menos de este tiempo se consideran uno
// solo (por ejemplo, el doble montaje de React en desarrollo o un doble clic).
const DUPLICATE_WINDOW_MS = 1500

/**
 * Nombre: getEvents
 * Descripción: Devuelve todos los eventos guardados, del más viejo al más nuevo.
 * Entradas: No recibe parámetros.
 * Salidas: arreglo de eventos (vacío si no hay o el dato está dañado).
 * Excepciones: No lanza.
 */
export function getEvents() {
  try {
    const stored = JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY))
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

/**
 * Nombre: isDuplicate
 * Descripción: Indica si el evento nuevo repite al último registrado.
 */
function isDuplicate(last, event) {
  return (
    Boolean(last) &&
    last.type === event.type &&
    last.userId === event.userId &&
    JSON.stringify(last.data) === JSON.stringify(event.data) &&
    Date.parse(event.timestamp) - Date.parse(last.timestamp) < DUPLICATE_WINDOW_MS
  )
}

/**
 * Nombre: trackEvent
 * Descripción: Registra un evento con su tipo, fecha/hora, el usuario activo
 *              y la información de la acción.
 * Entradas: type: uno de EVENT_TYPES; data: objeto con los detalles.
 * Salidas: el evento guardado, o null si era un duplicado o no se pudo guardar.
 * Excepciones: No lanza: registrar un evento nunca debe romper la tienda.
 */
export function trackEvent(type, data = {}) {
  try {
    const event = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      timestamp: new Date().toISOString(),
      userId: getSession()?.userId ?? null,
      data,
    }

    const events = getEvents()
    if (isDuplicate(events.at(-1), event)) return null

    events.push(event)
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)))
    return event
  } catch {
    return null
  }
}
