import { ORDER_CURRENCY, ORDER_STATUS, PAYMENT_STATUS } from './orderStatus'
import { isValidOrderNumber } from './orderNumber'
import { ROLE_INFO, ROLES } from '../session/roles'
import { formatB2BConditions, getPriceType, isValidPrice, PRICE_TYPES, validateMinQuantity } from '../pricing/pricing'
import { getBranch, getBranchStock } from '../inventory/branches'

/*
 * Forma de la orden (proyecto 3). Se guarda igual en localStorage y en el
 * índice grupo-07_orders de Algolia (objectID = orderNumber):
 *   {
 *     orderNumber, createdAt, updatedAt?,
 *     customer: { userId, name, email, role, roleLabel, company | null },
 *     priceType: 'B2C' | 'B2B',
 *     branch: { id, name, address },
 *     buyer: { fullName, email, phone },
 *     delivery: { province, canton, address, extraInfo },
 *     items: [{ id, name, image, quantity, priceType,
 *               listPrice,        // precio de lista del rol (sin descuento)
 *               unitPrice,        // precio aplicado (con descuento por volumen)
 *               discountPct,      // 0 a 1
 *               discountAmount,   // ahorro de la línea en colones
 *               lineSubtotal, minQuantity, branchStock, conditions }],
 *     commercialConditions: { priceType, label, rules: [texto] },
 *     termsAcceptance, paymentMethod, currency,
 *     subtotal, iva, shippingCost, total,
 *     orderStatus, paymentStatus
 *   }
 */

/**
 * Nombre: isMoney
 * Descripción: Indica si un valor es un monto válido (número finito ≥ 0).
 */
function isMoney(value) {
  return Number.isFinite(value) && value >= 0
}

/**
 * Nombre: buildOrderItems
 * Descripción: Convierte los productos del carrito en líneas de la orden y
 *              repite las validaciones de compra: precio válido, tipo de
 *              precio del rol, pedido mínimo B2B y stock de la sucursal.
 * Entradas: cartItems: productos del carrito (ver cartProduct.js);
 *           priceType: tipo de precio del cliente; branchId: sucursal.
 * Salidas: arreglo de líneas.
 * Excepciones: Lanza Error con un mensaje comprensible si algo no cumple.
 */
function buildOrderItems(cartItems, priceType, branchId) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('La orden debe tener al menos un producto')
  }

  return cartItems.map((item) => {
    if (!Number.isInteger(item?.quantity) || item.quantity < 1) {
      throw new Error(`La cantidad de "${item?.name ?? 'un producto'}" no es válida`)
    }
    if (!isValidPrice(item.unitPrice) || !isValidPrice(item.basePrice)) {
      throw new Error(`El precio de "${item.name}" no está disponible`)
    }
    if (item.priceType !== priceType) {
      throw new Error(`El precio de "${item.name}" no corresponde a tu tipo de cliente`)
    }
    const min = validateMinQuantity(item)
    if (!min.valid) throw new Error(min.message)

    const branchStock = getBranchStock(item, branchId)
    if (!branchStock || item.quantity > branchStock) {
      throw new Error(`No hay suficientes unidades de "${item.name}" en la sucursal elegida`)
    }

    const lineSubtotal = item.unitPrice * item.quantity
    return {
      id: item.id,
      name: item.name,
      image: item.image ?? null,
      quantity: item.quantity,
      priceType: item.priceType,
      listPrice: item.basePrice,
      unitPrice: item.unitPrice,
      discountPct: item.discountPct ?? 0,
      discountAmount: (item.basePrice - item.unitPrice) * item.quantity,
      lineSubtotal,
      minQuantity: min.minQuantity,
      branchStock,
      conditions: priceType === PRICE_TYPES.B2B ? formatB2BConditions(min.minQuantity, item.volumeDiscounts) : '',
    }
  })
}

/**
 * Nombre: buildCommercialConditions
 * Descripción: Resume las condiciones comerciales con las que se hizo la
 *              compra, para que la orden permita identificarlas.
 */
function buildCommercialConditions(priceType, items) {
  if (priceType === PRICE_TYPES.B2B) {
    const discounted = items.filter((line) => line.discountPct > 0)
    return {
      priceType,
      label: 'Condiciones B2B (mayorista)',
      rules: [
        'Precio mayorista B2B de cada producto.',
        'Pedido mínimo por producto según su ficha; validado antes de pagar.',
        discounted.length > 0
          ? `Descuento por volumen aplicado en ${discounted.length} ${discounted.length === 1 ? 'producto' : 'productos'}.`
          : 'Ningún producto alcanzó un descuento por volumen.',
      ],
    }
  }
  return {
    priceType,
    label: 'Condiciones B2C (público)',
    rules: ['Precio al público.', 'Cantidad mínima: 1 unidad por producto.', 'Sin descuentos por volumen.'],
  }
}

/**
 * Nombre: buildCustomer
 * Descripción: Datos del usuario que compra, tomados de la sesión.
 * Excepciones: Lanza Error si no hay sesión de cliente.
 */
function buildCustomer(session) {
  if (!session?.userId || (session.role !== ROLES.B2C && session.role !== ROLES.B2B)) {
    throw new Error('Debes iniciar sesión como cliente para comprar')
  }
  return {
    userId: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
    roleLabel: ROLE_INFO[session.role]?.label ?? session.role,
    company: session.role === ROLES.B2B ? session.company ?? null : null,
  }
}

/**
 * Nombre: buildOrder
 * Descripción: Arma la orden con estado de orden y de pago en PENDING.
 * Entradas: objeto con
 *   - orderNumber: número único (ver orderNumber.js).
 *   - buyer: { fullName, email, phone }.
 *   - delivery: { province, canton, address, extraInfo }.
 *   - session: sesión del usuario (usuario, rol y empresa).
 *   - branchId: sucursal elegida (ver inventory/branches.js).
 *   - items: productos del carrito (con priceType, basePrice, unitPrice...).
 *   - totals: { subtotal, iva, shippingCost, total } del carrito.
 *   - termsAcceptance: { accepted, version } con la aceptación de los
 *     términos y condiciones que el cliente marcó en el checkout.
 *   - paymentMethod (opcional): { brand, last4 } de la tarjeta. Nunca se
 *     guarda el número completo ni el código de seguridad.
 *   - createdAt (opcional): Date; por defecto la fecha actual. También es
 *     la fecha en que quedan aceptados los términos.
 * Salidas: objeto orden (ver forma arriba).
 * Excepciones: Lanza Error si falta el número de orden, hay datos del
 *              comprador o la entrega incompletos, no se aceptaron los
 *              términos, no hay productos o los montos no cuadran. También
 *              si no hay sesión de cliente, falta la sucursal o una línea no
 *              cumple el precio, el mínimo B2B o el stock de la sucursal; en
 *              esos casos el mensaje del Error ya está escrito para el
 *              usuario y el checkout lo puede mostrar tal cual.
 */
export function buildOrder({
  orderNumber,
  session,
  branchId,
  buyer,
  delivery,
  items,
  totals,
  termsAcceptance,
  paymentMethod = null,
  createdAt = new Date(),
}) {
  if (!isValidOrderNumber(orderNumber)) {
    throw new Error('Número de orden inválido')
  }
  if (!buyer?.fullName || !buyer?.email || !buyer?.phone) {
    throw new Error('Faltan datos del comprador')
  }
  if (!delivery?.province || !delivery?.canton || !delivery?.address) {
    throw new Error('Faltan datos de entrega')
  }
  // Ninguna compra se registra sin la aceptación de los términos.
  if (termsAcceptance?.accepted !== true || !termsAcceptance?.version) {
    throw new Error('El cliente no aceptó los términos y condiciones')
  }

  const customer = buildCustomer(session)
  const priceType = getPriceType(customer.role)
  const branch = getBranch(branchId)
  if (!branch) {
    throw new Error('Elige la sucursal de retiro o despacho')
  }

  const orderItems = buildOrderItems(items, priceType, branch.id)
  const { subtotal, iva, shippingCost, total } = totals ?? {}
  if (![subtotal, iva, shippingCost, total].every(isMoney)) {
    throw new Error('Los montos de la orden son inválidos')
  }

  const linesSum = orderItems.reduce((sum, line) => sum + line.lineSubtotal, 0)
  if (linesSum !== subtotal || subtotal + iva + shippingCost !== total) {
    throw new Error('Los montos de la orden no cuadran')
  }

  const createdAtIso = createdAt.toISOString()

  return {
    orderNumber,
    createdAt: createdAtIso,
    customer,
    priceType,
    branch: { id: branch.id, name: branch.name, address: branch.address },
    buyer: {
      fullName: buyer.fullName.trim(),
      email: buyer.email.trim(),
      phone: buyer.phone.trim(),
    },
    delivery: {
      province: delivery.province,
      canton: delivery.canton,
      address: delivery.address.trim(),
      extraInfo: (delivery.extraInfo ?? '').trim(),
    },
    termsAcceptance: {
      accepted: true,
      version: termsAcceptance.version,
      acceptedAt: createdAtIso,
    },
    paymentMethod:
      paymentMethod?.brand && /^\d{4}$/.test(paymentMethod.last4 ?? '')
        ? { brand: paymentMethod.brand, last4: paymentMethod.last4 }
        : null,
    items: orderItems,
    commercialConditions: buildCommercialConditions(priceType, orderItems),
    currency: ORDER_CURRENCY,
    subtotal,
    iva,
    shippingCost,
    total,
    orderStatus: ORDER_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
  }
}