/**
 * Módulo: branches
 * Descripción: Sucursales de la tienda e inventario por sucursal (proyecto 3).
 *              Cada producto de Algolia trae `locations: [{ site, stock_quantity }]`
 *              y el producto del carrito guarda una copia de esa lista. Aquí
 *              se consulta cuánto hay de cada producto en la sucursal elegida
 *              y se valida que la compra no pida más de lo que hay.
 */

export const BRANCHES = [
  { id: 'san-jose', name: 'San José', address: 'Paseo Colón, San José' },
  { id: 'alajuela', name: 'Alajuela', address: 'Radial Francisco J. Orlich, Alajuela' },
  { id: 'cartago', name: 'Cartago Centro', address: 'Avenida 1, Cartago Centro' },
]

export const AVAILABILITY_STATUS = {
  OK: 'ok',
  INSUFFICIENT: 'insufficient',
  UNAVAILABLE: 'unavailable',
}

/**
 * Nombre: normalizeSite
 * Descripción: Normaliza el nombre de una sede para compararlo (sin tildes,
 *              sin mayúsculas ni espacios extra).
 */
export function normalizeSite(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

/**
 * Nombre: getBranch
 * Descripción: Busca una sucursal por id.
 * Salidas: la sucursal o null.
 */
export function getBranch(branchId) {
  return BRANCHES.find((branch) => branch.id === branchId) ?? null
}

/**
 * Nombre: getBranchStock
 * Descripción: Unidades de un producto en una sucursal.
 * Entradas: product: objeto con `locations` (producto de Algolia o del
 *           carrito); branchId: id de la sucursal.
 * Salidas: número de unidades, o null si la sucursal no maneja el producto
 *          (no aparece en sus locations).
 * Excepciones: No lanza.
 */
export function getBranchStock(product, branchId) {
  const branch = getBranch(branchId)
  if (!branch) return null
  const location = (product?.locations ?? []).find(
    (loc) => normalizeSite(loc?.site) === normalizeSite(branch.name)
  )
  if (!location) return null
  const quantity = Number(location.stock_quantity)
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0
}

/**
 * Nombre: checkItemAvailability
 * Descripción: Revisa si una línea del carrito se puede surtir en la sucursal.
 * Entradas: item: producto del carrito ({ name, quantity, locations });
 *           branchId: id de la sucursal elegida.
 * Salidas: { id, name, requested, available, status, message }.
 *          status: 'ok' | 'insufficient' (hay menos de lo pedido) |
 *          'unavailable' (la sucursal no lo tiene).
 */
export function checkItemAvailability(item, branchId) {
  const branch = getBranch(branchId)
  const available = getBranchStock(item, branchId)
  const requested = item.quantity
  const base = { id: item.id, name: item.name, requested, available: available ?? 0 }

  if (available === null || available === 0) {
    return {
      ...base,
      status: AVAILABILITY_STATUS.UNAVAILABLE,
      message: `La sucursal ${branch?.name ?? ''} no tiene "${item.name}" disponible. Elige otra sucursal o quítalo de la compra.`,
    }
  }
  if (requested > available) {
    return {
      ...base,
      status: AVAILABILITY_STATUS.INSUFFICIENT,
      message: `Pediste ${requested} ${unitsWord(requested)} de "${item.name}", pero en ${branch.name} solo hay ${available}. Reduce la cantidad en el carrito o elige otra sucursal.`,
    }
  }
  return { ...base, status: AVAILABILITY_STATUS.OK, message: null }
}

/**
 * Nombre: checkBranchAvailability
 * Descripción: Revisa todas las líneas de una compra contra una sucursal.
 * Entradas: items: productos del carrito; branchId: sucursal elegida.
 * Salidas: { lines, allAvailable, availableCount, errors }.
 */
export function checkBranchAvailability(items, branchId) {
  const lines = (items ?? []).map((item) => checkItemAvailability(item, branchId))
  const errors = lines.filter((line) => line.status !== AVAILABILITY_STATUS.OK).map((line) => line.message)
  return {
    lines,
    allAvailable: lines.length > 0 && errors.length === 0,
    availableCount: lines.length - errors.length,
    errors,
  }
}

function unitsWord(count) {
  return count === 1 ? 'unidad' : 'unidades'
}
