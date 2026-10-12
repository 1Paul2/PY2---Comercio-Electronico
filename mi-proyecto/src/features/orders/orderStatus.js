/**
 * Módulo: orderStatus
 * Descripción: Constantes de estado de la orden y del pago. Se manejan por
 *              separado porque describen cosas distintas: la orden es el
 *              resultado del negocio (¿se concretó la compra?) y el pago es
 *              lo que respondió el proveedor de pagos Sandbox.
 */

export const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
})

/**
 * Cómo se muestra cada estado de la orden al usuario: etiqueta en español,
 * tono de color de la insignia y una explicación corta.
 */
export const ORDER_STATUS_DISPLAY = Object.freeze({
  [ORDER_STATUS.PENDING]: {
    label: 'Pendiente',
    tone: 'warning',
    description: 'La orden está registrada y espera un pago aprobado.',
  },
  [ORDER_STATUS.CONFIRMED]: {
    label: 'Confirmada',
    tone: 'success',
    description: 'El pago fue aprobado y la compra quedó confirmada.',
  },
  [ORDER_STATUS.FAILED]: {
    label: 'Cancelada',
    tone: 'danger',
    description: 'El último intento de pago fue rechazado; la orden no se confirmó.',
  },
})

/**
 * Nombre: getOrderStatusDisplay
 * Descripción: Devuelve cómo mostrar un estado de la orden. Un estado
 *              desconocido se muestra como pendiente para no presentar
 *              nunca como confirmada una orden dudosa.
 * Entradas: status: valor de ORDER_STATUS.
 * Salidas: { label, tone, description }.
 * Excepciones: No lanza.
 */
export function getOrderStatusDisplay(status) {
  return ORDER_STATUS_DISPLAY[status] ?? ORDER_STATUS_DISPLAY[ORDER_STATUS.PENDING]
}

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  ERROR: 'ERROR',
})

/**
 * Cómo se muestra cada estado del pago al usuario. Es independiente del
 * estado de la orden: describe lo que respondió el servicio de pagos.
 */
export const PAYMENT_STATUS_DISPLAY = Object.freeze({
  [PAYMENT_STATUS.PENDING]: {
    label: 'Pendiente',
    tone: 'warning',
    description: 'El pago todavía no se ha procesado.',
  },
  [PAYMENT_STATUS.APPROVED]: {
    label: 'Aprobado',
    tone: 'success',
    description: 'El servicio de pagos aprobó el cobro.',
  },
  [PAYMENT_STATUS.DECLINED]: {
    label: 'Rechazado',
    tone: 'danger',
    description: 'El emisor de la tarjeta no autorizó el cobro.',
  },
  [PAYMENT_STATUS.ERROR]: {
    label: 'Error del servicio',
    tone: 'warning',
    description: 'El servicio de pagos no respondió correctamente; no se realizó el cobro.',
  },
})

/**
 * Nombre: getPaymentStatusDisplay
 * Descripción: Devuelve cómo mostrar un estado del pago. Un estado
 *              desconocido se muestra como pendiente.
 * Entradas: status: valor de PAYMENT_STATUS.
 * Salidas: { label, tone, description }.
 * Excepciones: No lanza.
 */
export function getPaymentStatusDisplay(status) {
  return PAYMENT_STATUS_DISPLAY[status] ?? PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PENDING]
}

export const ORDER_CURRENCY = 'CRC'