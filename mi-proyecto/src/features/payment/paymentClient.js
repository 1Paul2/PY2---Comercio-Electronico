import {
  REASON_CODE,
  buildErrorResponse,
  normalizePaymentResponse,
  validatePaymentRequest,
} from './paymentContract'
import { processPayment } from './paymentSandbox'

const DEFAULT_TIMEOUT_MS = 8000
const inFlight = new Map()

/**
 * Nombre: withTimeout
 * Descripción: Rechaza si la promesa no termina en `ms` milisegundos.
 */
function withTimeout(promise, ms) {
  let timerId
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error('timeout')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId))
}

/**
 * Nombre: requestPayment
 * Descripción: Envía la solicitud de pago al servicio y devuelve el
 *              resultado. Se encarga de:
 *                - Validar el request antes de enviarlo (si es inválido,
 *                  devuelve PAYMENT_ERROR sin llamar al servicio).
 *                - Deducplicar solicitudes en vuelo por orderId.
 *                - Aplicar un timeout (por defecto 8 s).
 *                - Normalizar la respuesta: si el servicio lanza o
 *                  devuelve algo inválido, se transforma en PAYMENT_ERROR.
 * Entradas:
 *   - request: PaymentRequest.
 *   - options.service (opcional): función de servicio alterna (para tests).
 *   - options.timeoutMs (opcional): espera máxima, por defecto 8 s.
 * Salidas: Promesa con PaymentResponse válida (nunca se rechaza).
 * Excepciones: No lanza; los fallos se devuelven como PAYMENT_ERROR.
 */
export function requestPayment(request, options = {}) {
  const { service = processPayment, timeoutMs = DEFAULT_TIMEOUT_MS } = options

  if (validatePaymentRequest(request).length > 0) {
    return Promise.resolve(buildErrorResponse(request, REASON_CODE.INVALID_REQUEST))
  }

  const existing = inFlight.get(request.orderId)
  if (existing) return existing

  const pending = withTimeout(Promise.resolve().then(() => service(request)), timeoutMs)
    .then((response) => normalizePaymentResponse(response, request))
    .catch(() => buildErrorResponse(request, REASON_CODE.SERVICE_UNAVAILABLE))
    .finally(() => inFlight.delete(request.orderId))

  inFlight.set(request.orderId, pending)
  return pending
}