import { REASON_CODE } from './paymentContract'

/**
 * Módulo: paymentMessages
 * Descripción: Traduce los códigos de motivo que devuelve el servicio de
 *              pagos (reasonCode) a textos que entiende cualquier usuario:
 *              qué pasó y qué puede hacer. Nunca se muestra el código
 *              técnico en pantalla.
 */

const REASON_TEXT = Object.freeze({
  [REASON_CODE.DECLINED_BY_ISSUER]: {
    reason: 'El banco o emisor de la tarjeta no autorizó el cobro.',
    nextStep: 'Verifica que la tarjeta tenga fondos y esté habilitada, y vuelve a intentarlo.',
  },
  [REASON_CODE.SERVICE_UNAVAILABLE]: {
    reason: 'El servicio de pagos no respondió a tiempo. No se realizó ningún cobro.',
    nextStep: 'Espera unos segundos y vuelve a intentarlo.',
  },
  [REASON_CODE.INVALID_RESPONSE]: {
    reason: 'El servicio de pagos envió una respuesta que no pudimos interpretar. No se realizó ningún cobro.',
    nextStep: 'Vuelve a intentarlo; si el problema continúa, intenta más tarde.',
  },
  [REASON_CODE.INVALID_REQUEST]: {
    reason: 'No pudimos enviar la solicitud de pago porque faltan datos de la orden.',
    nextStep: 'Vuelve al checkout, revisa tus datos y confirma la compra de nuevo.',
  },
})

/**
 * Nombre: getPaymentReasonText
 * Descripción: Devuelve el motivo y la sugerencia para un código de motivo.
 * Entradas: reasonCode: valor de REASON_CODE (o null).
 * Salidas: { reason, nextStep } o null si no hay un texto para ese código.
 * Excepciones: No lanza.
 */
export function getPaymentReasonText(reasonCode) {
  return REASON_TEXT[reasonCode] ?? null
}
