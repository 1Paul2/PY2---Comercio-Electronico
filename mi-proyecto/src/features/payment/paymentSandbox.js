import {
  PAYMENT_RESULT,
  REASON_CODE,
  SANDBOX_SCENARIO,
  buildErrorResponse,
  validatePaymentRequest,
} from './paymentContract'

const MIN_LATENCY_MS = 800
const MAX_LATENCY_MS = 1500
const TRANSACTION_PREFIX = 'SBX'
const TRANSACTION_ID_LENGTH = 10
const TRANSACTION_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/**
 * Nombre: PaymentServiceError
 * Descripción: Error que lanza el Sandbox cuando simula que el servicio no
 *              responde correctamente. El cliente de pago (paymentClient)
 *              lo captura y lo convierte en una respuesta PAYMENT_ERROR.
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
 * Nombre: computeDelay
 * Descripción: Calcula la latencia a simular. Si el llamador pasa un
 *              `delayMs` fijo (útil en pruebas o demos), se usa ese valor.
 *              Si no, se devuelve un valor aleatorio entre MIN y MAX.
 */
function computeDelay(delayMs) {
  if (Number.isFinite(delayMs) && delayMs >= 0) return delayMs
  return MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS)
}

/**
 * Nombre: generateTransactionId
 * Descripción: Genera un id de transacción simulado, ej. SBX-7K2M9Q4XAB.
 */
function generateTransactionId() {
  const bytes = new Uint8Array(TRANSACTION_ID_LENGTH)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < TRANSACTION_ID_LENGTH; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  const body = Array.from(bytes, (b) => TRANSACTION_ALPHABET[b % TRANSACTION_ALPHABET.length]).join('')
  return `${TRANSACTION_PREFIX}-${body}`
}

/**
 * Nombre: logSandbox
 * Descripción: Imprime en consola información del Sandbox solo en modo
 *              desarrollo. En producción es un no-op.
 */
function logSandbox(...args) {
  if (import.meta.env?.DEV) {
    console.info('[PaymentSandbox]', ...args)
  }
}

/**
 * Nombre: buildApprovedResponse
 * Descripción: Construye la respuesta de un pago aprobado.
 */
function buildApprovedResponse(request) {
  return {
    result: PAYMENT_RESULT.APPROVED,
    orderId: request.orderId,
    amount: request.amount,
    currency: request.currency,
    transactionId: generateTransactionId(),
    reasonCode: null,
    processedAt: new Date().toISOString(),
    message: 'Pago aprobado.',
  }
}

/**
 * Nombre: buildDeclinedResponse
 * Descripción: Construye la respuesta de un pago rechazado por el emisor.
 */
function buildDeclinedResponse(request) {
  return {
    result: PAYMENT_RESULT.DECLINED,
    orderId: request.orderId,
    amount: request.amount,
    currency: request.currency,
    transactionId: generateTransactionId(),
    reasonCode: REASON_CODE.DECLINED_BY_ISSUER,
    processedAt: new Date().toISOString(),
    message: 'El pago no fue aprobado. Puedes intentarlo de nuevo.',
  }
}

/**
 * Nombre: processPayment
 * Descripción: Procesa una solicitud de pago simulada. Reproduce los tres
 *              escenarios que exige el enunciado:
 *                - APPROVED → respuesta válida con PAYMENT_APPROVED.
 *                - DECLINED → respuesta válida con PAYMENT_DECLINED.
 *                - ERROR    → lanza PaymentServiceError (servicio caído).
 *              El cliente de pago (paymentClient) se encarga de convertir
 *              el error en una respuesta PAYMENT_ERROR para la app.
 *
 * Entradas:
 *   - request: PaymentRequest (orderId, amount, currency, scenario).
 *   - options.delayMs (opcional): latencia fija en ms. Por defecto aleatoria
 *     entre 800 y 1500 ms para simular red real.
 * Salidas: Promesa con PaymentResponse (APPROVED, DECLINED o ERROR por
 *          request inválido).
 * Excepciones: La promesa se rechaza con PaymentServiceError cuando el
 *              escenario es ERROR (simula servicio caído).
 */
export async function processPayment(request, options = {}) {
  const delayMs = computeDelay(options.delayMs)
  logSandbox(`Procesando pago para orden ${request?.orderId} con escenario ${request?.scenario}`, {
    delayMs,
  })

  await wait(delayMs)

  const problems = validatePaymentRequest(request)
  if (problems.length > 0) {
    logSandbox('Solicitud inválida:', problems)
    return buildErrorResponse(request, REASON_CODE.INVALID_REQUEST)
  }

  switch (request.scenario) {
    case SANDBOX_SCENARIO.APPROVED: {
      const response = buildApprovedResponse(request)
      logSandbox('Pago aprobado:', response.transactionId)
      return response
    }

    case SANDBOX_SCENARIO.DECLINED: {
      const response = buildDeclinedResponse(request)
      logSandbox('Pago rechazado:', response.reasonCode)
      return response
    }

    case SANDBOX_SCENARIO.ERROR:
    default: {
      logSandbox('Servicio caído: lanzando PaymentServiceError')
      throw new PaymentServiceError()
    }
  }
}