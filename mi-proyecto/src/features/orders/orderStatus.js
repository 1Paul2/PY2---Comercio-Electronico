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

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  ERROR: 'ERROR',
})

export const ORDER_CURRENCY = 'CRC'