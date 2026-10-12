import { PAYMENT_RESULT } from '../payment/paymentContract'
import { ORDER_STATUS, PAYMENT_STATUS } from './orderStatus'
import { getOrder, updateOrder } from './orderStorage'


const STATUS_BY_RESULT = Object.freeze({
  [PAYMENT_RESULT.APPROVED]: { orderStatus: ORDER_STATUS.CONFIRMED, paymentStatus: PAYMENT_STATUS.APPROVED },
  [PAYMENT_RESULT.DECLINED]: { orderStatus: ORDER_STATUS.FAILED, paymentStatus: PAYMENT_STATUS.DECLINED },
  [PAYMENT_RESULT.ERROR]: { orderStatus: ORDER_STATUS.PENDING, paymentStatus: PAYMENT_STATUS.ERROR },
})

/**
 * Nombre: getStatusesForResult
 * Descripción: Devuelve los estados de orden y pago para un resultado.
 * Entradas: result: uno de PAYMENT_RESULT.
 * Salidas: { orderStatus, paymentStatus }. Un resultado desconocido se trata
 *          como PAYMENT_ERROR para nunca marcar la orden como confirmada.
 * Excepciones: No lanza.
 */
export function getStatusesForResult(result) {
  return STATUS_BY_RESULT[result] ?? STATUS_BY_RESULT[PAYMENT_RESULT.ERROR]
}

/**
 * Nombre: isOrderPayable
 * Descripción: Indica si se puede intentar (o reintentar) el cobro de una
 *              orden. Solo las órdenes ya confirmadas quedan bloqueadas.
 * Entradas: order: orden guardada.
 * Salidas: true si se puede enviar una solicitud de pago.
 * Excepciones: No lanza.
 */
export function isOrderPayable(order) {
  return Boolean(order) && order.orderStatus !== ORDER_STATUS.CONFIRMED
}

/**
 * Nombre: applyPaymentResult
 * Descripción: Actualiza la orden guardada con la respuesta del Sandbox:
 *              cambia ambos estados, guarda el último pago y agrega el
 *              intento al historial.
 * Entradas: orderNumber: número de la orden; response: PaymentResponse ya
 *           normalizada por paymentClient.
 * Salidas: la orden actualizada, o null si no existe o no se pudo guardar.
 * Excepciones: No lanza.
 */
export function applyPaymentResult(orderNumber, response) {
  const current = getOrder(orderNumber)
  if (!current) return null

  const payment = {
    result: response.result,
    transactionId: response.transactionId,
    reasonCode: response.reasonCode,
    message: response.message,
    processedAt: response.processedAt,
  }
  const previousAttempts = Array.isArray(current.paymentAttempts) ? current.paymentAttempts : []

  return updateOrder(orderNumber, {
    ...getStatusesForResult(response.result),
    payment,
    paymentAttempts: [...previousAttempts, payment],
  })
}
