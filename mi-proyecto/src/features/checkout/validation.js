/**
 * Nombre: validation
 * Descripción: Funciones puras de validación para los campos del checkout.
 *              Cada función devuelve un string con el mensaje de error, o
 *              null si el valor es válido. Se mantienen puras (sin acceso
 *              a estado ni a DOM) para facilitar pruebas y reutilización.
 * Entradas: valor del campo (string) y, cuando aplica, el objeto completo
 *           del formulario.
 * Salidas: string | null
 * Excepciones: No hay.
 */

/**
 * Nombre: isNonEmpty
 * Descripción: Verifica que un string tenga contenido después de recortar
 *              espacios en blanco.
 */
function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Nombre: validateFullName
 * Descripción: Valida el nombre completo. Requiere al menos dos palabras
 *              separadas por espacio (nombre y apellido).
 */
export function validateFullName(value) {
  if (!isNonEmpty(value)) return 'El nombre completo es obligatorio.'
  const parts = value.trim().split(/\s+/)
  if (parts.length < 2) return 'Ingresa al menos un nombre y un apellido.'
  if (value.trim().length < 5) return 'El nombre es demasiado corto.'
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'.-]+$/.test(value)) {
    return 'El nombre solo puede contener letras y espacios.'
  }
  return null
}

/**
 * Nombre: validateEmail
 * Descripción: Valida el correo electrónico con una expresión razonable
 *              (no pretende cubrir el RFC completo, solo errores comunes).
 */
export function validateEmail(value) {
  if (!isNonEmpty(value)) return 'El correo electrónico es obligatorio.'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!emailRegex.test(value.trim())) return 'Ingresa un correo electrónico válido.'
  return null
}

/**
 * Nombre: validatePhone
 * Descripción: Valida el teléfono de Costa Rica. Acepta 8 dígitos
 *              (formato local) o 11 dígitos con el código de país 506.
 *              Ignora espacios, guiones y paréntesis.
 */
export function validatePhone(value) {
  if (!isNonEmpty(value)) return 'El teléfono es obligatorio.'
  const digits = value.replace(/[\s\-()]/g, '')
  if (!/^\d+$/.test(digits)) return 'El teléfono solo puede contener números.'
  if (digits.length === 8) return null
  if (digits.length === 11 && digits.startsWith('506')) return null
  return 'Ingresa un teléfono válido (8 dígitos, o 11 con el código 506).'
}

/**
 * Nombre: validateProvince
 * Descripción: Verifica que se haya seleccionado una provincia.
 */
export function validateProvince(value) {
  if (!isNonEmpty(value)) return 'Selecciona una provincia.'
  return null
}

/**
 * Nombre: validateCanton
 * Descripción: Verifica que se haya seleccionado un cantón.
 */
export function validateCanton(value) {
  if (!isNonEmpty(value)) return 'Selecciona un cantón.'
  return null
}

/**
 * Nombre: validateAddress
 * Descripción: Valida la dirección exacta. Requiere al menos 10 caracteres
 *              para asegurar que sea una dirección utilizable.
 */
export function validateAddress(value) {
  if (!isNonEmpty(value)) return 'La dirección es obligatoria.'
  if (value.trim().length < 10) return 'La dirección es demasiado corta.'
  return null
}

/**
 * Nombre: validateExtraInfo
 * Descripción: La información adicional es opcional. Si se ingresa, se
 *              limita a 300 caracteres.
 */
export function validateExtraInfo(value) {
  if (!isNonEmpty(value)) return null
  if (value.trim().length > 300) return 'La información adicional no puede superar los 300 caracteres.'
  return null
}

/**
 * Nombre: validateBuyerForm
 * Descripción: Valida el formulario completo del comprador. Devuelve un
 *              objeto con los errores por campo. Si el objeto está vacío,
 *              el formulario es válido.
 */
export function validateBuyerForm(values) {
  const errors = {}
  const nameError = validateFullName(values.fullName)
  if (nameError) errors.fullName = nameError
  const emailError = validateEmail(values.email)
  if (emailError) errors.email = emailError
  const phoneError = validatePhone(values.phone)
  if (phoneError) errors.phone = phoneError
  return errors
}

/**
 * Nombre: validateDeliveryForm
 * Descripción: Valida el formulario completo de entrega. Devuelve un
 *              objeto con los errores por campo. Si el objeto está vacío,
 *              el formulario es válido.
 */
export function validateDeliveryForm(values) {
  const errors = {}
  const provinceError = validateProvince(values.province)
  if (provinceError) errors.province = provinceError
  const cantonError = validateCanton(values.canton)
  if (cantonError) errors.canton = cantonError
  const addressError = validateAddress(values.address)
  if (addressError) errors.address = addressError
  const extraError = validateExtraInfo(values.extraInfo)
  if (extraError) errors.extraInfo = extraError
  return errors
}