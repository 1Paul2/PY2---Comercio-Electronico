import { ORDER_CURRENCY, ORDER_STATUS, PAYMENT_STATUS } from './orderStatus'
import { isValidOrderNumber } from './orderNumber'

/**
 * Nombre: isMoney
 * Descripción: Indica si un valor es un monto válido (número finito ≥ 0).
 */
function isMoney(value) {
  return Number.isFinite(value) && value >= 0
}

/**
 * Nombre: buildOrderItems
 * Descripción: Convierte los items del carrito en líneas de la orden.
 * Entradas: cartItems: arreglo de { id, name, image, price, quantity }.
 * Salidas: arreglo de líneas con unitPrice y lineSubtotal.
 * Excepciones: Lanza Error si no hay productos o algún item es inválido.
 */
function buildOrderItems(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('La orden debe tener al menos un producto')
  }

  return cartItems.map((item) => {
    if (!isMoney(item?.price) || !Number.isInteger(item?.quantity) || item.quantity < 1) {
      throw new Error('La orden tiene un producto con precio o cantidad inválidos')
    }
    return {
      id: item.id,
      name: item.name,
      image: item.image ?? null,
      unitPrice: item.price,
      quantity: item.quantity,
      lineSubtotal: item.price * item.quantity,
    }
  })
}

/**
 * Nombre: buildOrder
 * Descripción: Arma la orden con estado de orden y de pago en PENDING.
 * Entradas: objeto con
 *   - orderNumber: número único (ver orderNumber.js).
 *   - buyer: { fullName, email, phone }.
 *   - delivery: { province, canton, address, extraInfo }.
 *   - items: items del carrito.
 *   - totals: { subtotal, iva, shippingCost, total } del carrito.
 *   - createdAt (opcional): Date; por defecto la fecha actual.
 * Salidas: objeto orden (ver forma arriba).
 * Excepciones: Lanza Error si falta el número de orden, hay datos del
 *              comprador o la entrega incompletos, no hay productos o los
 *              montos no cuadran. El llamador debe mostrar un mensaje
 *              comprensible al usuario.
 */
export function buildOrder({ orderNumber, buyer, delivery, items, totals, createdAt = new Date() }) {
  if (!isValidOrderNumber(orderNumber)) {
    throw new Error('Número de orden inválido')
  }
  if (!buyer?.fullName || !buyer?.email || !buyer?.phone) {
    throw new Error('Faltan datos del comprador')
  }
  if (!delivery?.province || !delivery?.canton || !delivery?.address) {
    throw new Error('Faltan datos de entrega')
  }

  const orderItems = buildOrderItems(items)
  const { subtotal, iva, shippingCost, total } = totals ?? {}
  if (![subtotal, iva, shippingCost, total].every(isMoney)) {
    throw new Error('Los montos de la orden son inválidos')
  }

  const linesSum = orderItems.reduce((sum, line) => sum + line.lineSubtotal, 0)
  if (linesSum !== subtotal || subtotal + iva + shippingCost !== total) {
    throw new Error('Los montos de la orden no cuadran')
  }

  return {
    orderNumber,
    createdAt: createdAt.toISOString(),
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
    items: orderItems,
    currency: ORDER_CURRENCY,
    subtotal,
    iva,
    shippingCost,
    total,
    orderStatus: ORDER_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
  }
}