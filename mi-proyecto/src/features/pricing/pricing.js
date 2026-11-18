/**
 * Módulo: pricing
 * Descripción: Reglas de precio según el rol del usuario (proyecto 3). Es la
 *              única fuente de verdad para saber qué precio ve y paga cada
 *              persona: el catálogo, el detalle, el carrito y el checkout
 *              preguntan aquí, así el precio mostrado y el guardado en la
 *              orden nunca difieren.
 *
 * Reglas:
 *   - Cliente B2B: paga pricing.b2b.price_crc, debe comprar al menos
 *     pricing.b2b.min_order_quantity unidades por producto y recibe el
 *     descuento por volumen más alto que alcance su cantidad
 *     (pricing.b2b.volume_discounts).
 *   - Cliente B2C, visitante sin sesión y administrador: ven
 *     pricing.b2c.price_crc, mínimo 1 unidad y sin descuento por volumen.
 *     (El administrador no compra; solo consulta.)
 *   - Precio inválido: si el precio del tipo que corresponde falta, no es un
 *     número o no es mayor que 0, el producto no se puede comprar y se
 *     muestra INVALID_PRICE_MESSAGE. No se usa el otro precio como respaldo
 *     para no cobrar una tarifa que no corresponde al rol.
 *
 * Los montos en colones se redondean a la unidad.
 */

export const PRICE_TYPES = {
  B2C: 'B2C',
  B2B: 'B2B',
}

export const INVALID_PRICE_MESSAGE = 'Precio no disponible: este producto no se puede comprar por ahora.'

/**
 * Nombre: getPriceType
 * Descripción: Tipo de precio que corresponde a un rol.
 * Entradas: rol: 'B2C' | 'B2B' | 'ADMIN' | undefined (visitante).
 * Salidas: 'B2B' solo para el rol B2B; 'B2C' en cualquier otro caso.
 * Excepciones: No lanza.
 */
export function getPriceType(rol) {
  return rol === PRICE_TYPES.B2B ? PRICE_TYPES.B2B : PRICE_TYPES.B2C
}

/**
 * Nombre: isValidPrice
 * Descripción: Indica si un valor sirve como precio (número finito mayor que 0).
 */
export function isValidPrice(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * Nombre: getBasePrice
 * Descripción: Precio de lista del producto para el rol, sin descuentos.
 * Entradas: producto: registro de Algolia (con pricing); rol: rol del usuario.
 * Salidas: número en colones, o null si el precio falta o es inválido.
 * Excepciones: No lanza.
 */
export function getBasePrice(producto, rol) {
  const pricing = producto?.pricing
  const price = getPriceType(rol) === PRICE_TYPES.B2B ? pricing?.b2b?.price_crc : pricing?.b2c?.price_crc
  return isValidPrice(price) ? price : null
}

/**
 * Nombre: getMinQuantity
 * Descripción: Cantidad mínima por producto para el rol (1 si no es B2B o si
 *              el dato falta o es inválido).
 */
export function getMinQuantity(producto, rol) {
  if (getPriceType(rol) !== PRICE_TYPES.B2B) return 1
  const min = producto?.pricing?.b2b?.min_order_quantity
  return Number.isInteger(min) && min > 1 ? min : 1
}

/**
 * Nombre: normalizeDiscounts
 * Descripción: Limpia una lista de descuentos por volumen: descarta los
 *              tramos inválidos y los ordena de menor a mayor cantidad.
 * Entradas: discounts: [{ min_units, discount_pct }] o cualquier valor.
 * Salidas: arreglo limpio y ordenado (vacío si no hay tramos válidos).
 */
export function normalizeDiscounts(discounts) {
  if (!Array.isArray(discounts)) return []
  return discounts
    .filter(
      (tier) =>
        Number.isInteger(tier?.min_units) &&
        tier.min_units >= 1 &&
        typeof tier.discount_pct === 'number' &&
        tier.discount_pct > 0 &&
        tier.discount_pct < 1
    )
    .map((tier) => ({ min_units: tier.min_units, discount_pct: tier.discount_pct }))
    .sort((a, b) => a.min_units - b.min_units)
}

/**
 * Nombre: getVolumeDiscounts
 * Descripción: Tramos de descuento por volumen para el rol (solo B2B).
 */
export function getVolumeDiscounts(producto, rol) {
  if (getPriceType(rol) !== PRICE_TYPES.B2B) return []
  return normalizeDiscounts(producto?.pricing?.b2b?.volume_discounts)
}

/**
 * Nombre: getApplicableDiscount
 * Descripción: Tramo de descuento más alto que alcanza una cantidad.
 * Entradas: discounts: tramos normalizados; cantidad: unidades.
 * Salidas: { min_units, discount_pct } o null si no alcanza ninguno.
 */
export function getApplicableDiscount(discounts, cantidad) {
  let applicable = null
  for (const tier of normalizeDiscounts(discounts)) {
    if (cantidad >= tier.min_units) applicable = tier
  }
  return applicable
}

/**
 * Nombre: computeUnitPrice
 * Descripción: Precio unitario a partir del precio de lista y del descuento
 *              por volumen que corresponde a la cantidad.
 * Entradas: basePrice: precio de lista; discounts: tramos; cantidad: unidades.
 * Salidas: número redondeado a colones, o null si basePrice es inválido.
 */
export function computeUnitPrice(basePrice, discounts, cantidad) {
  if (!isValidPrice(basePrice)) return null
  const discount = getApplicableDiscount(discounts, cantidad)
  return Math.round(basePrice * (1 - (discount?.discount_pct ?? 0)))
}

/**
 * Nombre: getUnitPrice
 * Descripción: Precio unitario que paga el rol al comprar cierta cantidad,
 *              ya con el descuento por volumen aplicado.
 * Entradas: producto: registro de Algolia; rol: rol del usuario;
 *           cantidad: unidades a comprar.
 * Salidas: número en colones, o null si el precio es inválido.
 * Excepciones: No lanza.
 */
export function getUnitPrice(producto, rol, cantidad = 1) {
  return computeUnitPrice(getBasePrice(producto, rol), getVolumeDiscounts(producto, rol), cantidad)
}

/**
 * Nombre: getProductPricing
 * Descripción: Resume en un objeto todo lo que la interfaz necesita para
 *              mostrar y vender un producto a un rol.
 * Entradas: producto: registro de Algolia; rol: rol del usuario;
 *           cantidad: unidades (por defecto, el mínimo del rol).
 * Salidas: { priceType, basePrice, unitPrice, minQuantity, discounts,
 *            discount, isValid }.
 */
export function getProductPricing(producto, rol, cantidad) {
  const minQuantity = getMinQuantity(producto, rol)
  const quantity = Number.isInteger(cantidad) && cantidad > 0 ? cantidad : minQuantity
  const basePrice = getBasePrice(producto, rol)
  const discounts = getVolumeDiscounts(producto, rol)
  return {
    priceType: getPriceType(rol),
    basePrice,
    unitPrice: computeUnitPrice(basePrice, discounts, quantity),
    minQuantity,
    discounts,
    discount: getApplicableDiscount(discounts, quantity),
    isValid: basePrice !== null,
  }
}

/**
 * Nombre: getProductPrices
 * Descripción: Copia los dos precios de un producto (B2C y B2B) en la forma
 *              que guarda el carrito. Con ellos el carrito puede recalcular
 *              el precio si cambia el rol sin volver a consultar Algolia.
 * Salidas: { b2c: number|null, b2b: { price, minQuantity, discounts } }.
 */
export function getProductPrices(producto) {
  return {
    b2c: getBasePrice(producto, PRICE_TYPES.B2C),
    b2b: {
      price: getBasePrice(producto, PRICE_TYPES.B2B),
      minQuantity: getMinQuantity(producto, PRICE_TYPES.B2B),
      discounts: getVolumeDiscounts(producto, PRICE_TYPES.B2B),
    },
  }
}

/**
 * Nombre: priceCartItem
 * Descripción: Recalcula los campos de precio de un producto del carrito
 *              para un rol y una cantidad. Se usa al agregar, al cambiar la
 *              cantidad (el descuento por volumen cambia) y al cambiar de
 *              usuario.
 * Entradas: item: producto del carrito con `prices` (ver getProductPrices);
 *           rol: rol del usuario; cantidad: unidades (por defecto, las del item).
 * Salidas: nuevo item con priceType, basePrice, unitPrice, discountPct,
 *          minQuantity, volumeDiscounts y price (= unitPrice, para el código
 *          que ya leía `price`).
 * Excepciones: No lanza; con precio inválido unitPrice y price quedan en null.
 */
export function priceCartItem(item, rol, cantidad = item.quantity) {
  const priceType = getPriceType(rol)
  const isB2B = priceType === PRICE_TYPES.B2B
  const prices = item.prices ?? {}
  const basePrice = isB2B ? prices.b2b?.price : prices.b2c
  const validBase = isValidPrice(basePrice) ? basePrice : null
  const discounts = isB2B ? normalizeDiscounts(prices.b2b?.discounts) : []
  const minQuantity = isB2B && Number.isInteger(prices.b2b?.minQuantity) && prices.b2b.minQuantity > 1
    ? prices.b2b.minQuantity
    : 1
  const unitPrice = computeUnitPrice(validBase, discounts, cantidad)
  const discount = getApplicableDiscount(discounts, cantidad)

  return {
    ...item,
    quantity: cantidad,
    priceType,
    basePrice: validBase,
    unitPrice,
    price: unitPrice,
    discountPct: discount?.discount_pct ?? 0,
    minQuantity,
    volumeDiscounts: discounts,
  }
}

/**
 * Nombre: validateMinQuantity
 * Descripción: Revisa que un producto del carrito cumpla la cantidad mínima
 *              de su tipo de precio.
 * Entradas: item: producto del carrito ({ name, quantity, minQuantity }).
 * Salidas: { valid, minQuantity, message } (message es null si es válido).
 * Excepciones: No lanza.
 */
export function validateMinQuantity(item) {
  const minQuantity = Number.isInteger(item?.minQuantity) && item.minQuantity > 1 ? item.minQuantity : 1
  const quantity = Number.isInteger(item?.quantity) ? item.quantity : 0
  if (quantity >= minQuantity) return { valid: true, minQuantity, message: null }
  return {
    valid: false,
    minQuantity,
    message: `El pedido mínimo B2B de "${item?.name ?? 'este producto'}" es de ${minQuantity} ${unitsWord(minQuantity)}.`,
  }
}

/**
 * Nombre: validateCartItem
 * Descripción: Validaciones de compra de una línea del carrito: precio
 *              válido y cantidad mínima. El carrito y el checkout las usan
 *              para impedir continuar.
 * Salidas: arreglo de mensajes (vacío si la línea se puede comprar).
 */
export function validateCartItem(item) {
  const errors = []
  if (!isValidPrice(item?.unitPrice)) errors.push(`"${item?.name ?? 'Producto'}": ${INVALID_PRICE_MESSAGE}`)
  const min = validateMinQuantity(item)
  if (!min.valid) errors.push(min.message)
  return errors
}

/**
 * Nombre: formatB2BConditions
 * Descripción: Texto corto con las condiciones B2B de un producto, por
 *              ejemplo "Pedido mínimo 3 · 5% desde 2 u. · 10% desde 4 u.".
 * Entradas: minQuantity: cantidad mínima; discounts: tramos de descuento.
 * Salidas: string (vacío si no hay condiciones especiales).
 */
export function formatB2BConditions(minQuantity, discounts) {
  const parts = []
  if (minQuantity > 1) parts.push(`Pedido mínimo ${minQuantity}`)
  for (const tier of normalizeDiscounts(discounts)) {
    parts.push(`${Math.round(tier.discount_pct * 100)}% desde ${tier.min_units} u.`)
  }
  return parts.join(' · ')
}

function unitsWord(count) {
  return count === 1 ? 'unidad' : 'unidades'
}
