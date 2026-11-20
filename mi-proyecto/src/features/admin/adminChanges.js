import { BRANCHES, getBranch, normalizeSite } from '../inventory/branches'

/**
 * Módulo: adminChanges
 * Descripción: Modificaciones administrativas simuladas (proyecto 3).
 *
 *              El administrador puede cambiar el precio de un producto o el
 *              inventario de una sucursal. Los cambios NO se escriben en
 *              Algolia: hacerlo desde el navegador exigiría publicar una
 *              llave con permiso de escritura, que cualquiera podría leer en
 *              el paquete de la aplicación. En su lugar se guardan en
 *              localStorage y se aplican sobre el producto cuando se lee del
 *              índice, de modo que el cambio se ve en el panel y en la
 *              tienda sin tocar la fuente de datos.
 *
 *              De cada cambio se guarda el valor anterior, el nuevo y la
 *              fecha, para que el panel pueda mostrar qué se modificó y
 *              permitir restablecerlo.
 */

export const ADMIN_CHANGES_KEY = 'maquinaria-cr-admin-changes-v1'

export const CHANGE_TYPES = {
  PRICE_B2C: 'price_b2c',
  PRICE_B2B: 'price_b2b',
  STOCK: 'stock',
}

export const CHANGE_LABELS = {
  [CHANGE_TYPES.PRICE_B2C]: 'Precio B2C',
  [CHANGE_TYPES.PRICE_B2B]: 'Precio B2B',
  [CHANGE_TYPES.STOCK]: 'Inventario',
}

/** Aviso que se emite al cambiar algo, para que las pantallas abiertas se actualicen. */
export const ADMIN_CHANGES_EVENT = 'admin-changes-updated'

const emptyStore = () => ({ prices: {}, stock: {}, history: [] })
const MAX_HISTORY = 50

/**
 * Nombre: isPositiveInteger
 * Descripción: Comprueba que un valor sirva como precio o como existencias.
 * Entradas: value: cualquier valor; allowZero: si el cero es válido.
 * Salidas: boolean.
 * Excepciones: No lanza.
 */
function isPositiveInteger(value, allowZero = false) {
  return Number.isInteger(value) && (allowZero ? value >= 0 : value > 0)
}

/**
 * Nombre: readStore
 * Descripción: Lee los cambios guardados. Ante un dato dañado devuelve un
 *              almacén vacío, nunca lanza: el panel debe abrir igual.
 * Salidas: { prices, stock, history }.
 */
export function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ADMIN_CHANGES_KEY))
    if (!parsed || typeof parsed !== 'object') return emptyStore()
    return {
      prices: typeof parsed.prices === 'object' && parsed.prices !== null ? parsed.prices : {},
      stock: typeof parsed.stock === 'object' && parsed.stock !== null ? parsed.stock : {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  } catch {
    return emptyStore()
  }
}

/**
 * Nombre: writeStore
 * Descripción: Guarda los cambios y avisa a las pantallas abiertas.
 * Salidas: true si se guardó; false si el almacenamiento falló.
 */
function writeStore(store) {
  try {
    localStorage.setItem(ADMIN_CHANGES_KEY, JSON.stringify(store))
    window.dispatchEvent(new CustomEvent(ADMIN_CHANGES_EVENT))
    return true
  } catch {
    return false
  }
}

/**
 * Nombre: addHistoryEntry
 * Descripción: Agrega un movimiento al historial, del más reciente al más
 *              antiguo, con tope para que el almacenamiento no crezca sin fin.
 */
function addHistoryEntry(store, entry) {
  return {
    ...store,
    history: [{ ...entry, at: new Date().toISOString() }, ...store.history].slice(0, MAX_HISTORY),
  }
}

/**
 * Nombre: getPriceOverride
 * Descripción: Precio modificado de un producto, si el administrador lo cambió.
 * Entradas: productId: objectID; type: CHANGE_TYPES.PRICE_B2C o PRICE_B2B.
 * Salidas: número o null.
 */
export function getPriceOverride(productId, type, store = readStore()) {
  const value = store.prices?.[productId]?.[type]
  return isPositiveInteger(value) ? value : null
}

/**
 * Nombre: getStockOverride
 * Descripción: Existencias modificadas de un producto en una sucursal.
 * Entradas: productId: objectID; branchId: id de la sucursal.
 * Salidas: número o null.
 */
export function getStockOverride(productId, branchId, store = readStore()) {
  const value = store.stock?.[productId]?.[branchId]
  return isPositiveInteger(value, true) ? value : null
}

/**
 * Nombre: setPrice
 * Descripción: Cambia el precio B2C o B2B de un producto y deja constancia
 *              del valor anterior.
 * Entradas: product: producto de Algolia; type: CHANGE_TYPES.PRICE_*;
 *           newValue: entero mayor que 0.
 * Salidas: { ok, error } — error con un mensaje para el usuario si no se pudo.
 * Excepciones: No lanza.
 */
export function setPrice(product, type, newValue) {
  if (!product?.objectID) return { ok: false, error: 'No se identificó el producto.' }
  if (type !== CHANGE_TYPES.PRICE_B2C && type !== CHANGE_TYPES.PRICE_B2B) {
    return { ok: false, error: 'Tipo de precio no válido.' }
  }
  if (!isPositiveInteger(newValue)) {
    return { ok: false, error: 'El precio debe ser un número entero mayor que cero.' }
  }

  const store = readStore()
  const previous = getEffectivePrice(product, type, store)
  if (previous === newValue) {
    return { ok: false, error: 'El valor nuevo es igual al actual.' }
  }

  const next = addHistoryEntry(
    {
      ...store,
      prices: {
        ...store.prices,
        [product.objectID]: { ...(store.prices[product.objectID] ?? {}), [type]: newValue },
      },
    },
    {
      type,
      productId: product.objectID,
      productName: product.title ?? product.objectID,
      previous,
      next: newValue,
    }
  )

  return writeStore(next)
    ? { ok: true }
    : { ok: false, error: 'No se pudo guardar el cambio en este navegador.' }
}

/**
 * Nombre: setStock
 * Descripción: Cambia las existencias de un producto en una sucursal.
 * Entradas: product: producto de Algolia; branchId: id de la sucursal;
 *           newValue: entero mayor o igual que 0 (el cero deja la sucursal
 *           sin existencias, que es un caso válido).
 * Salidas: { ok, error }.
 * Excepciones: No lanza.
 */
export function setStock(product, branchId, newValue) {
  if (!product?.objectID) return { ok: false, error: 'No se identificó el producto.' }
  const branch = getBranch(branchId)
  if (!branch) return { ok: false, error: 'La sucursal indicada no existe.' }
  if (!isPositiveInteger(newValue, true)) {
    return { ok: false, error: 'Las existencias deben ser un número entero mayor o igual que cero.' }
  }

  const store = readStore()
  const previous = getEffectiveStock(product, branchId, store)
  if (previous === newValue) {
    return { ok: false, error: 'El valor nuevo es igual al actual.' }
  }

  const next = addHistoryEntry(
    {
      ...store,
      stock: {
        ...store.stock,
        [product.objectID]: { ...(store.stock[product.objectID] ?? {}), [branchId]: newValue },
      },
    },
    {
      type: CHANGE_TYPES.STOCK,
      productId: product.objectID,
      productName: product.title ?? product.objectID,
      branchId,
      branchName: branch.name,
      previous,
      next: newValue,
    }
  )

  return writeStore(next)
    ? { ok: true }
    : { ok: false, error: 'No se pudo guardar el cambio en este navegador.' }
}

/**
 * Nombre: getEffectivePrice
 * Descripción: Precio vigente de un producto: el modificado si existe, si no
 *              el del índice de Algolia.
 * Entradas: product: producto; type: CHANGE_TYPES.PRICE_*.
 * Salidas: número o null si el producto no trae ese precio.
 */
export function getEffectivePrice(product, type, store = readStore()) {
  const override = getPriceOverride(product?.objectID, type, store)
  if (override !== null) return override
  const original =
    type === CHANGE_TYPES.PRICE_B2B
      ? product?.pricing?.b2b?.price_crc
      : product?.pricing?.b2c?.price_crc
  return Number.isFinite(original) ? original : null
}

/**
 * Nombre: getEffectiveStock
 * Descripción: Existencias vigentes de un producto en una sucursal.
 * Salidas: número de unidades (0 si la sucursal no lo maneja).
 */
export function getEffectiveStock(product, branchId, store = readStore()) {
  const override = getStockOverride(product?.objectID, branchId, store)
  if (override !== null) return override
  const branch = getBranch(branchId)
  if (!branch) return 0
  const location = (product?.locations ?? []).find(
    (loc) => normalizeSite(loc?.site) === normalizeSite(branch.name)
  )
  const quantity = Number(location?.stock_quantity)
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0
}

/**
 * Nombre: applyAdminChanges
 * Descripción: Devuelve una copia del producto con los cambios del
 *              administrador ya aplicados: precios y existencias por
 *              sucursal. Es la función que usan las pantallas de la tienda
 *              para que una modificación simulada se note de verdad.
 * Entradas: product: producto tal como viene de Algolia.
 * Salidas: producto equivalente, con `adminModified: true` si algo cambió.
 * Excepciones: No lanza; sin cambios devuelve el producto original.
 */
export function applyAdminChanges(product, store = readStore()) {
  if (!product?.objectID) return product
  const priceB2C = getPriceOverride(product.objectID, CHANGE_TYPES.PRICE_B2C, store)
  const priceB2B = getPriceOverride(product.objectID, CHANGE_TYPES.PRICE_B2B, store)
  const stockByBranch = store.stock?.[product.objectID]
  if (priceB2C === null && priceB2B === null && !stockByBranch) return product

  const locations = BRANCHES.map((branch) => {
    const original = (product.locations ?? []).find(
      (loc) => normalizeSite(loc?.site) === normalizeSite(branch.name)
    )
    const override = getStockOverride(product.objectID, branch.id, store)
    if (override === null && !original) return null
    return {
      site: branch.name,
      stock_quantity: override !== null ? override : Number(original?.stock_quantity ?? 0),
    }
  }).filter(Boolean)

  return {
    ...product,
    adminModified: true,
    pricing: {
      ...product.pricing,
      b2c: { ...product.pricing?.b2c, ...(priceB2C !== null ? { price_crc: priceB2C } : {}) },
      b2b: { ...product.pricing?.b2b, ...(priceB2B !== null ? { price_crc: priceB2B } : {}) },
    },
    locations: locations.length > 0 ? locations : product.locations,
  }
}

/**
 * Nombre: getHistory
 * Descripción: Movimientos administrativos, del más reciente al más antiguo.
 */
export function getHistory(store = readStore()) {
  return store.history ?? []
}

/**
 * Nombre: countChanges
 * Descripción: Cuántos productos tienen precio o inventario modificado.
 * Salidas: { prices, stock, total }.
 */
export function countChanges(store = readStore()) {
  const prices = Object.keys(store.prices ?? {}).length
  const stock = Object.keys(store.stock ?? {}).length
  return { prices, stock, total: prices + stock }
}

/**
 * Nombre: resetProduct
 * Descripción: Deja un producto con los valores originales del índice.
 * Salidas: { ok, error }.
 */
export function resetProduct(productId) {
  if (!productId) return { ok: false, error: 'No se identificó el producto.' }
  const store = readStore()
  if (!store.prices[productId] && !store.stock[productId]) {
    return { ok: false, error: 'Ese producto no tiene cambios que restablecer.' }
  }
  const prices = { ...store.prices }
  const stock = { ...store.stock }
  delete prices[productId]
  delete stock[productId]

  const next = addHistoryEntry({ ...store, prices, stock }, {
    type: 'reset_product',
    productId,
    productName: productId,
    previous: 'valores modificados',
    next: 'valores originales',
  })
  return writeStore(next) ? { ok: true } : { ok: false, error: 'No se pudo guardar el cambio.' }
}

/**
 * Nombre: resetAll
 * Descripción: Borra todas las modificaciones simuladas, incluido el
 *              historial, y deja el catálogo como está en Algolia.
 * Salidas: { ok, error }.
 */
export function resetAll() {
  try {
    localStorage.removeItem(ADMIN_CHANGES_KEY)
    window.dispatchEvent(new CustomEvent(ADMIN_CHANGES_EVENT))
    return { ok: true }
  } catch {
    return { ok: false, error: 'No se pudo limpiar el almacenamiento de este navegador.' }
  }
}
