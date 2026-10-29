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

import { CANTONS_BY_PROVINCE, PROVINCES } from './costaRicaLocations'

/**
 * Nombre: isNonEmpty
 * Descripción: Verifica que un string tenga contenido después de recortar
 *              espacios en blanco.
 */
function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'.-]+$/

/**
 * Nombre: validateFirstName
 * Descripción: Valida el nombre del comprador (puede ser compuesto, por
 *              ejemplo "María José"). Solo letras, espacios y . ' -
 */
export function validateFirstName(value) {
  if (!isNonEmpty(value)) return 'El nombre es obligatorio.'
  if (value.trim().length < 2) return 'El nombre es demasiado corto.'
  if (!NAME_PATTERN.test(value)) return 'El nombre solo puede contener letras y espacios.'
  return null
}

/**
 * Nombre: validateLastName
 * Descripción: Valida los apellidos del comprador. Mismas reglas que el
 *              nombre; acepta uno o dos apellidos.
 */
export function validateLastName(value) {
  if (!isNonEmpty(value)) return 'El apellido es obligatorio.'
  if (value.trim().length < 2) return 'El apellido es demasiado corto.'
  if (!NAME_PATTERN.test(value)) return 'El apellido solo puede contener letras y espacios.'
  return null
}

/**
 * Nombre: buildFullName
 * Descripción: Une nombre y apellidos en el nombre completo que se guarda en
 *              la orden, normalizando los espacios.
 * Entradas: buyer: { firstName, lastName }.
 * Salidas: string con el nombre completo (vacío si no hay datos).
 * Excepciones: No lanza.
 */
export function buildFullName(buyer) {
  return [buyer?.firstName, buyer?.lastName]
    .map((part) => (typeof part === 'string' ? part.trim().replace(/\s+/g, ' ') : ''))
    .filter(Boolean)
    .join(' ')
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
  const local = digits.length === 11 && digits.startsWith('506') ? digits.slice(3) : digits
  if (local.length !== 8) return 'Ingresa un teléfono válido (8 dígitos, o 11 con el código 506).'
  // Los números de Costa Rica empiezan con 2 (fijos), 4, 5, 6, 7 u 8.
  if (!/^[245678]/.test(local)) return 'El teléfono debe empezar con 2, 4, 5, 6, 7 u 8.'
  return null
}

/**
 * Nombre: validateProvince
 * Descripción: Verifica que se haya seleccionado una provincia.
 */
export function validateProvince(value) {
  if (!isNonEmpty(value)) return 'Selecciona una provincia.'
  if (!PROVINCES.includes(value)) return 'Selecciona una provincia de la lista.'
  return null
}

/**
 * Nombre: validateCanton
 * Descripción: Verifica que se haya seleccionado un cantón y que pertenezca
 *              a la provincia elegida (un borrador viejo podría traer una
 *              combinación inválida).
 */
export function validateCanton(value, province) {
  if (!isNonEmpty(value)) return 'Selecciona un cantón.'
  if (province && !(CANTONS_BY_PROVINCE[province] ?? []).includes(value)) {
    return 'El cantón no pertenece a la provincia seleccionada.'
  }
  return null
}

/**
 * Nombre: validateAddress
 * Descripción: Valida la dirección exacta. Requiere al menos 10 caracteres
 *              para asegurar que sea una dirección utilizable.
 */
export function validateAddress(value) {
  if (!isNonEmpty(value)) return 'La dirección es obligatoria.'
  if (value.trim().length < 10) return 'La dirección es demasiado corta (mínimo 10 caracteres).'
  if (value.trim().length > 250) return 'La dirección no puede superar los 250 caracteres.'
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
  const firstNameError = validateFirstName(values.firstName)
  if (firstNameError) errors.firstName = firstNameError
  const lastNameError = validateLastName(values.lastName)
  if (lastNameError) errors.lastName = lastNameError
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
  const cantonError = validateCanton(values.canton, values.province)
  if (cantonError) errors.canton = cantonError
  const addressError = validateAddress(values.address)
  if (addressError) errors.address = addressError
  const extraError = validateExtraInfo(values.extraInfo)
  if (extraError) errors.extraInfo = extraError
  return errors
}

/* ============================================================
   Pago con tarjeta (simulado: no se envía a ningún banco)
   ============================================================ */

/**
 * Nombre: onlyDigits
 * Descripción: Quita todo lo que no sea número (espacios, guiones, barras).
 */
function onlyDigits(value) {
  return typeof value === 'string' ? value.replace(/\D/g, '') : ''
}

/**
 * Nombre: detectCardBrand
 * Descripción: Identifica la marca de la tarjeta por sus primeros dígitos.
 * Entradas: value: número de tarjeta (puede traer espacios).
 * Salidas: 'Visa' | 'Mastercard' | 'American Express' | null.
 * Excepciones: No lanza.
 */
export function detectCardBrand(value) {
  const digits = onlyDigits(value)
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'American Express'
  return null
}

/**
 * Nombre: formatCardNumber
 * Descripción: Agrupa el número de la tarjeta mientras se escribe
 *              (4-4-4-4, o 4-6-5 para American Express).
 * Entradas: value: texto escrito por el usuario.
 * Salidas: string formateado, con un máximo de 19 dígitos.
 * Excepciones: No lanza.
 */
export function formatCardNumber(value) {
  const digits = onlyDigits(value).slice(0, 19)
  if (detectCardBrand(digits) === 'American Express') {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(' ')
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/**
 * Nombre: formatCardExpiry
 * Descripción: Escribe la fecha de vencimiento como MM/AA mientras se teclea.
 */
export function formatCardExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

/**
 * Nombre: passesLuhn
 * Descripción: Algoritmo de Luhn: detecta errores de digitación en el número
 *              de la tarjeta (un dígito mal escrito o dos invertidos).
 */
function passesLuhn(digits) {
  let sum = 0
  for (let i = 0; i < digits.length; i += 1) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

/**
 * Nombre: validateCardName
 * Descripción: Valida el nombre tal como aparece impreso en la tarjeta.
 */
export function validateCardName(value) {
  if (!isNonEmpty(value)) return 'El nombre del titular es obligatorio.'
  if (value.trim().length < 3) return 'El nombre del titular es demasiado corto.'
  if (!NAME_PATTERN.test(value)) return 'El nombre del titular solo puede contener letras y espacios.'
  return null
}

/**
 * Nombre: validateCardNumber
 * Descripción: Valida el número de la tarjeta: largo según la marca y
 *              dígito verificador (Luhn).
 */
export function validateCardNumber(value) {
  const digits = onlyDigits(value)
  if (!digits) return 'El número de la tarjeta es obligatorio.'
  const brand = detectCardBrand(digits)
  if (!brand) return 'Solo aceptamos tarjetas Visa, Mastercard o American Express.'
  const expectedLength = brand === 'American Express' ? 15 : 16
  if (digits.length !== expectedLength) return `El número debe tener ${expectedLength} dígitos.`
  if (!passesLuhn(digits)) return 'El número de la tarjeta no es válido. Revisa que esté bien escrito.'
  return null
}

/**
 * Nombre: validateCardExpiry
 * Descripción: Valida la fecha de vencimiento (MM/AA): mes real y que la
 *              tarjeta no esté vencida. Una tarjeta vence al final del mes.
 * Entradas: value: 'MM/AA'; today (opcional): fecha de referencia.
 */
export function validateCardExpiry(value, today = new Date()) {
  if (!isNonEmpty(value)) return 'La fecha de vencimiento es obligatoria.'
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim())
  if (!match) return 'Usa el formato MM/AA.'
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return 'El mes debe estar entre 01 y 12.'
  const currentMonth = today.getFullYear() * 12 + today.getMonth()
  const expiryMonth = year * 12 + (month - 1)
  if (expiryMonth < currentMonth) return 'La tarjeta está vencida.'
  if (expiryMonth > currentMonth + 20 * 12) return 'La fecha de vencimiento no es válida.'
  return null
}

/**
 * Nombre: validateCardCvv
 * Descripción: Valida el código de seguridad: 4 dígitos en American Express
 *              y 3 en las demás marcas.
 */
export function validateCardCvv(value, cardNumber) {
  const digits = onlyDigits(value)
  if (!digits) return 'El código de seguridad es obligatorio.'
  const expectedLength = detectCardBrand(cardNumber) === 'American Express' ? 4 : 3
  if (digits.length !== expectedLength || digits !== value.trim()) {
    return `El código de seguridad debe tener ${expectedLength} dígitos.`
  }
  return null
}

/**
 * Nombre: validatePaymentForm
 * Descripción: Valida el formulario completo de pago. Devuelve un objeto
 *              con los errores por campo; si está vacío, es válido.
 */
export function validatePaymentForm(values) {
  const errors = {}
  const nameError = validateCardName(values.cardName)
  if (nameError) errors.cardName = nameError
  const numberError = validateCardNumber(values.cardNumber)
  if (numberError) errors.cardNumber = numberError
  const expiryError = validateCardExpiry(values.cardExpiry)
  if (expiryError) errors.cardExpiry = expiryError
  const cvvError = validateCardCvv(values.cardCvv, values.cardNumber)
  if (cvvError) errors.cardCvv = cvvError
  return errors
}

/**
 * Nombre: maskCard
 * Descripción: Resumen seguro de la tarjeta para mostrar y guardar en la
 *              orden: solo la marca y los últimos 4 dígitos.
 * Salidas: { brand, last4 }.
 */
export function maskCard(cardNumber) {
  return { brand: detectCardBrand(cardNumber), last4: onlyDigits(cardNumber).slice(-4) }
}