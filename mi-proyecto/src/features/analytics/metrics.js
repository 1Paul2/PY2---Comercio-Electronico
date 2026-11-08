import { EVENT_TYPES, getEvents } from '../activity/activityLog'

/**
 * Módulo: metrics
 * Descripción: Calcula las métricas de uso de la tienda (laboratorio 5,
 *              requerimiento D) a partir de los eventos que registra
 *              activityLog en localStorage. No guarda nada por su cuenta ni
 *              inventa datos: todo sale de acciones reales del usuario, así
 *              que con el registro vacío todas las métricas dan cero.
 *
 *              Se mantiene separado de la página para poder calcular las
 *              mismas cifras desde otro componente y para poder probarlo
 *              sin montar la interfaz.
 */

/**
 * Nombre: isEvent
 * Descripción: Comprueba que un valor leído del almacenamiento tenga la
 *              forma mínima de un evento utilizable.
 * Entradas: value: cualquier valor.
 * Salidas: true si sirve para calcular métricas.
 * Excepciones: No lanza.
 */
function isEvent(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.type === 'string' &&
    typeof value.timestamp === 'string' &&
    !Number.isNaN(Date.parse(value.timestamp))
  )
}

/**
 * Nombre: toNumber
 * Descripción: Devuelve el número si es finito; si no, el valor de respaldo.
 *              Evita que un dato dañado convierta un total en NaN.
 */
function toNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

/**
 * Nombre: countTop
 * Descripción: Cuenta cuántas veces aparece cada clave y devuelve las más
 *              frecuentes, de mayor a menor.
 * Entradas: values: arreglo de textos (los vacíos se ignoran); limit.
 * Salidas: arreglo de { label, count }.
 * Excepciones: No lanza.
 */
function countTop(values, limit = 5) {
  const counts = new Map()
  for (const raw of values) {
    const label = String(raw ?? '').trim()
    if (!label) continue
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
}

/**
 * Nombre: percent
 * Descripción: Porcentaje entero de parte sobre total. Devuelve 0 si el
 *              total es cero, para no dividir entre cero en el embudo.
 */
function percent(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

/**
 * Nombre: filterEvents
 * Descripción: Toma los eventos guardados y deja solo los válidos, con la
 *              opción de limitarlos a un usuario.
 * Entradas: userId: id del usuario, o null para incluir todos.
 * Salidas: arreglo de eventos válidos, del más viejo al más nuevo.
 * Excepciones: No lanza.
 */
export function filterEvents(userId = null) {
  const events = getEvents().filter(isEvent)
  return userId ? events.filter((event) => event.userId === userId) : events
}

/**
 * Nombre: computeMetrics
 * Descripción: Calcula todas las métricas de la sección de Analytics.
 *
 *              Las cuatro que pide el enunciado son productsViewed,
 *              searches, addedToCart y purchases. Las demás se derivan de
 *              los mismos eventos y sirven para leer el comportamiento:
 *              el embudo muestra dónde se cae la gente y los "top" muestran
 *              qué busca y qué mira.
 *
 * Entradas: userId: id del usuario para ver solo su actividad, o null para
 *           ver toda la actividad registrada en este navegador.
 * Salidas: objeto con los contadores, el embudo, los listados y la
 *          actividad por día.
 * Excepciones: No lanza; con datos dañados o ausentes devuelve ceros.
 */
export function computeMetrics(userId = null) {
  const events = filterEvents(userId)

  const views = events.filter((e) => e.type === EVENT_TYPES.PRODUCT_VIEW)
  const searches = events.filter((e) => e.type === EVENT_TYPES.SEARCH)
  const addsToCart = events.filter((e) => e.type === EVENT_TYPES.ADD_TO_CART)
  const checkouts = events.filter((e) => e.type === EVENT_TYPES.BEGIN_CHECKOUT)
  const purchases = events.filter((e) => e.type === EVENT_TYPES.PURCHASE)
  const logins = events.filter((e) => e.type === EVENT_TYPES.LOGIN)

  // Unidades realmente agregadas, no veces que se pulsó el botón.
  const unitsAddedToCart = addsToCart.reduce(
    (sum, e) => sum + toNumber(e.data?.quantity, 1),
    0
  )

  const revenue = purchases.reduce((sum, e) => sum + toNumber(e.data?.total), 0)
  const purchasedUnits = purchases.reduce((sum, e) => sum + toNumber(e.data?.itemCount), 0)

  // Un mismo producto visto tres veces cuenta una sola vez aquí.
  const uniqueProductsViewed = new Set(
    views.map((e) => e.data?.productId).filter(Boolean)
  ).size

  // Actividad por día, del día más viejo al más reciente.
  const byDay = new Map()
  for (const event of events) {
    const day = event.timestamp.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + 1)
  }
  const activityByDay = [...byDay.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day))

  return {
    // --- Las cuatro métricas que pide el enunciado ---
    productsViewed: views.length,
    searches: searches.length,
    addedToCart: addsToCart.length,
    purchases: purchases.length,

    // --- Derivadas, de los mismos eventos ---
    totalEvents: events.length,
    logins: logins.length,
    uniqueProductsViewed,
    unitsAddedToCart,
    checkoutsStarted: checkouts.length,
    purchasedUnits,
    revenue,
    averageOrderValue: purchases.length > 0 ? Math.round(revenue / purchases.length) : 0,

    // Embudo: cuánta gente avanza de mirar a comprar.
    // El porcentaje se calcula sobre el paso más amplio y no sobre las
    // vistas: en esta tienda se puede agregar al carrito desde el catálogo
    // sin abrir el detalle, así que las vistas no siempre son el paso más
    // grande y usarlas como base daba porcentajes sin sentido (o división
    // entre cero cuando nadie había abierto un producto).
    funnel: (() => {
      const pasos = [
        { step: 'Productos vistos', count: views.length },
        { step: 'Agregados al carrito', count: addsToCart.length },
        { step: 'Checkout iniciado', count: checkouts.length },
        { step: 'Compras completadas', count: purchases.length },
      ]
      const base = pasos.reduce((top, paso) => Math.max(top, paso.count), 0)
      return pasos.map((paso) => ({ ...paso, rate: percent(paso.count, base) }))
    })(),

    topSearches: countTop(searches.map((e) => e.data?.query)),
    topCategories: countTop(views.map((e) => e.data?.category)),
    topProducts: countTop(views.map((e) => e.data?.name)),

    activityByDay,
    lastEventAt: events.at(-1)?.timestamp ?? null,
  }
}

/**
 * Nombre: EVENT_LABELS
 * Descripción: Nombre en español de cada tipo de evento, para no mostrar el
 *              identificador técnico en pantalla.
 */
export const EVENT_LABELS = Object.freeze({
  [EVENT_TYPES.LOGIN]: 'Inicio de sesión',
  [EVENT_TYPES.LOGOUT]: 'Cierre de sesión',
  [EVENT_TYPES.SEARCH]: 'Búsqueda',
  [EVENT_TYPES.PRODUCT_VIEW]: 'Producto visto',
  [EVENT_TYPES.ADD_TO_CART]: 'Agregado al carrito',
  [EVENT_TYPES.BEGIN_CHECKOUT]: 'Checkout iniciado',
  [EVENT_TYPES.PURCHASE]: 'Compra completada',
})

/**
 * Nombre: getEventLabel
 * Descripción: Devuelve la etiqueta de un tipo de evento; si no se conoce,
 *              devuelve el tipo tal cual para no perder información.
 */
export function getEventLabel(type) {
  return EVENT_LABELS[type] ?? type
}

/**
 * Nombre: describeEvent
 * Descripción: Resume en una línea lo que pasó en un evento, para la tabla
 *              de actividad reciente.
 * Entradas: event: evento guardado.
 * Salidas: texto corto; cadena vacía si el evento no trae detalles.
 * Excepciones: No lanza.
 */
export function describeEvent(event) {
  const data = event?.data ?? {}
  switch (event?.type) {
    case EVENT_TYPES.SEARCH:
      return data.query ? `"${data.query}"` : ''
    case EVENT_TYPES.PRODUCT_VIEW:
      return data.name ?? ''
    case EVENT_TYPES.ADD_TO_CART:
      return data.name ? `${data.name} × ${toNumber(data.quantity, 1)}` : ''
    case EVENT_TYPES.BEGIN_CHECKOUT:
      return `${toNumber(data.itemCount)} ${toNumber(data.itemCount) === 1 ? 'artículo' : 'artículos'}`
    case EVENT_TYPES.PURCHASE:
      return data.orderNumber ?? ''
    case EVENT_TYPES.LOGIN:
      return data.name ?? data.email ?? ''
    default:
      return ''
  }
}
