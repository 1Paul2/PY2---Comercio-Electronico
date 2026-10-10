import {
  PAYMENT_RESULT,
  REASON_CODE,
  SANDBOX_SCENARIO,
  buildErrorResponse,
  validatePaymentRequest,
} from './paymentcontract'

const MIN_LATENCY_MS = 800
const MAX_LATENCY_MS = 1500
const TRANSACTION_PREFIX = 'SBX'
const TRANSACTION_ID_LENGTH = 10
const TRANSACTION_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/**
 * Nombre: PaymentServiceError
 * Descripción: Error que lanza el Sandbox cuando simula que el servicio no
 *              responde correctamente.
 */
export class PaymentServiceError extends Error {
  constructor(message = 'Servicio de pago no disponible') {
    super(message)
    this.name = 'PaymentServiceError'
  }
}

/**
 * Nombre: wait
 * Descripción: Espera `ms` milisegundos (simula la latencia de la red).
 */
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Nombre: generateTransactionId
 * Descripción: Genera un id de transacción simulado, ej. SBX-7K2M9Q4XAB.
 */
function generateTransactionId() {
  const bytes = new Uint8Array(TRANSACTION_ID_LENGTH)
  globalThis.crypto.getRandomValues(bytes)
  const body = Array.from(bytes, (b) => TRANSACTION_ALPHABET[b % TRANSACTION_ALPHABET.length]).join('')
  return `${TRANSACTION_PREFIX}-${body}`
}

/**
 * Nombre: processPayment
 * Descripción: Procesa una solicitud de pago simulada.
 * Entradas: request: PaymentRequest; options.delayMs (opcional): latencia fija
 *           en ms (útil en pruebas); por defecto aleatoria entre 800 y 1500.
 * Salidas: Promesa con PaymentResponse (APPROVED o DECLINED, o ERROR si la
 *          solicitud es inválida).
 * Excepciones: La promesa se rechaza con PaymentServiceError en el
 *              escenario ERROR.
 */
export async function processPayment(request, options = {}) {
  const delayMs =
    options.delayMs ?? MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS)
  await wait(delayMs)

  if (validatePaymentRequest(request).length > 0) {
    return buildErrorResponse(request, REASON_CODE.INVALID_REQUEST)
  }

  const base = {
    orderId: request.orderId,
    amount: request.amount,
    currency: request.currency,
    processedAt: new Date().toISOString(),
  }

  switch (request.scenario) {
    case SANDBOX_SCENARIO.APPROVED:
      return {
        ...base,
        result: PAYMENT_RESULT.APPROVED,
        transactionId: generateTransactionId(),
        reasonCode: null,
        message: 'Pago aprobado.',
      }
    case SANDBOX_SCENARIO.DECLINED:
      return {
        ...base,
        result: PAYMENT_RESULT.DECLINED,
        transactionId: generateTransactionId(),
        reasonCode: REASON_CODE.DECLINED_BY_ISSUER,
        message: 'El pago no fue aprobado. Puedes intentarlo de nuevo.',
      }
    default:
      throw new PaymentServiceError()
  }
}