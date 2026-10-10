import { isValidOrderNumber } from '../orders/orderNumber'
import { ORDER_CURRENCY } from '../orders/orderStatus'

export const PAYMENT_RESULT = Object.freeze({
  APPROVED: 'PAYMENT_APPROVED',
  DECLINED: 'PAYMENT_DECLINED',
  ERROR: 'PAYMENT_ERROR',
})

// Escenarios que el Sandbox puede simular
export const SANDBOX_SCENARIO = Object.freeze({
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  ERROR: 'ERROR',
})

export const REASON_CODE = Object.freeze({
  DECLINED_BY_ISSUER: 'DECLINED_BY_ISSUER',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
})

const RESULTS = Object.values(PAYMENT_RESULT)
const SCENARIOS = Object.values(SANDBOX_SCENARIO)

/**
 * Nombre: buildPaymentRequest
 * Descripción: Arma la solicitud de pago a partir de una orden. Toma solo lo
 *              que el servicio necesita (no se filtran datos del comprador).
 * Entradas: order: orden (ver buildOrder); scenario: escenario Sandbox.
 * Salidas: PaymentRequest.
 * Excepciones: No lanza; usar validatePaymentRequest antes de enviarla.
 */
export function buildPaymentRequest(order, scenario = SANDBOX_SCENARIO.APPROVED) {
  return {
    orderId: order?.orderNumber,
    amount: order?.total,
    currency: order?.currency,
    scenario,
  }
}

/**
 * Nombre: validatePaymentRequest
 * Descripción: Comprueba que una solicitud cumpla el contrato.
 * Entradas: request: cualquier valor.
 * Salidas: arreglo de problemas encontrados (vacío si es válida).
 * Excepciones: No lanza.
 */
export function validatePaymentRequest(request) {
  const problems = []
  if (request === null || typeof request !== 'object') return ['La solicitud no es un objeto']
  if (!isValidOrderNumber(request.orderId)) problems.push('orderId inválido')
  if (!Number.isInteger(request.amount) || request.amount <= 0) problems.push('amount debe ser un entero mayor que 0')
  if (request.currency !== ORDER_CURRENCY) problems.push(`currency debe ser ${ORDER_CURRENCY}`)
  if (!SCENARIOS.includes(request.scenario)) problems.push('scenario inválido')
  return problems
}

/**
 * Nombre: isValidPaymentResponse
 * Descripción: Comprueba que una respuesta cumpla el contrato y corresponda
 *              a la solicitud enviada (mismo orderId, monto y moneda).
 * Entradas: response: valor devuelto por el servicio; request: solicitud.
 * Salidas: true si es válida y coherente con la solicitud.
 * Excepciones: No lanza.
 */
export function isValidPaymentResponse(response, request) {
  if (response === null || typeof response !== 'object') return false
  const approved = response.result === PAYMENT_RESULT.APPROVED
  const error = response.result === PAYMENT_RESULT.ERROR
  return (
    RESULTS.includes(response.result) &&
    response.orderId === request.orderId &&
    response.amount === request.amount &&
    response.currency === request.currency &&
    (approved ? typeof response.transactionId === 'string' && response.reasonCode === null : true) &&
    (error ? response.transactionId === null : true) &&
    (!approved ? typeof response.reasonCode === 'string' : true) &&
    typeof response.processedAt === 'string' &&
    !Number.isNaN(Date.parse(response.processedAt)) &&
    typeof response.message === 'string' &&
    response.message.length > 0
  )
}

/**
 * Nombre: buildErrorResponse
 * Descripción: Crea una respuesta PAYMENT_ERROR válida para cuando el
 *              servicio falla, no responde o responde fuera del contrato.
 * Entradas: request: solicitud; reasonCode: motivo (REASON_CODE).
 * Salidas: PaymentResponse con result PAYMENT_ERROR.
 * Excepciones: No lanza.
 */
export function buildErrorResponse(request, reasonCode = REASON_CODE.SERVICE_UNAVAILABLE) {
  return {
    result: PAYMENT_RESULT.ERROR,
    orderId: request?.orderId,
    amount: request?.amount,
    currency: request?.currency,
    transactionId: null,
    processedAt: new Date().toISOString(),
    reasonCode,
    message: 'No pudimos procesar el pago en este momento. Puedes intentarlo de nuevo.',
  }
}

/**
 * Nombre: normalizePaymentResponse
 * Descripción: Garantiza que la app siempre trabaje con una respuesta válida:
 *              si la recibida cumple el contrato la devuelve; si no, la
 *              convierte en PAYMENT_ERROR (regla 3 del contrato).
 * Entradas: response: lo que devolvió el servicio; request: la solicitud.
 * Salidas: PaymentResponse válida.
 * Excepciones: No lanza.
 */
export function normalizePaymentResponse(response, request) {
  return isValidPaymentResponse(response, request)
    ? response
    : buildErrorResponse(request, REASON_CODE.INVALID_RESPONSE)
}