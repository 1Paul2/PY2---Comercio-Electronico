const ORDER_PREFIX = 'MCR'
const RANDOM_PART_LENGTH = 8
const MAX_GENERATION_ATTEMPTS = 10
const ORDER_REGISTRY_KEY = 'maquinaria-cr-order-numbers-v1'
const ORDER_NUMBER_PATTERN = /^MCR-\d{8}-[0-9A-HJKMNP-TV-Z]{8}$/
const ORDER_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/**
 * Nombre: formatDatePart
 * Descripción: Convierte una fecha en AAAAMMDD usando la hora local.
 * Entradas: date: objeto Date.
 * Salidas: string de 8 dígitos.
 * Excepciones: No lanza.
 */
function formatDatePart(date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Nombre: generateRandomPart
 * Descripción: Genera la parte aleatoria del número de orden con el
 *              generador criptográfico del navegador.
 * Entradas: length: cantidad de caracteres (por defecto 8).
 * Salidas: string con caracteres del alfabeto Crockford base32.
 * Excepciones: No lanza; si crypto no existe usa Math.random como último
 *              recurso (el registro local sigue evitando repetidos).
 */
function generateRandomPart(length = RANDOM_PART_LENGTH) {
  const bytes = new Uint8Array(length)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (byte) => ORDER_ALPHABET[byte % ORDER_ALPHABET.length]).join('')
}

/**
 * Nombre: readRegistry
 * Descripción: Lee de localStorage el conjunto de números ya emitidos.
 * Entradas: No recibe parámetros.
 * Salidas: Set de strings (vacío si no hay registro o está corrupto).
 * Excepciones: No lanza; captura errores de almacenamiento y JSON inválido.
 */
function readRegistry() {
  try {
    const raw = localStorage.getItem(ORDER_REGISTRY_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [])
  } catch {
    return new Set()
  }
}

/**
 * Nombre: writeRegistry
 * Descripción: Guarda el conjunto de números emitidos en localStorage.
 * Entradas: registry: Set de strings.
 * Salidas: true si se guardó, false si el almacenamiento falló.
 * Excepciones: No lanza.
 */
function writeRegistry(registry) {
  try {
    localStorage.setItem(ORDER_REGISTRY_KEY, JSON.stringify([...registry]))
    return true
  } catch {
    return false
  }
}

/**
 * Nombre: isValidOrderNumber
 * Descripción: Verifica que un texto tenga el formato de número de orden.
 * Entradas: value: cualquier valor.
 * Salidas: true si cumple MCR-AAAAMMDD-XXXXXXXX.
 * Excepciones: No lanza.
 */
export function isValidOrderNumber(value) {
  return typeof value === 'string' && ORDER_NUMBER_PATTERN.test(value)
}

/**
 * Nombre: generateUniqueOrderNumber
 * Descripción: Genera un número de orden nuevo, comprueba que no exista en
 *              el registro local y lo registra antes de devolverlo, de modo
 *              que dos llamadas nunca entreguen el mismo valor.
 * Entradas: date (opcional): fecha de la orden, por defecto la actual.
 * Salidas: string con formato MCR-AAAAMMDD-XXXXXXXX.
 * Excepciones: Lanza Error si tras 10 intentos todos colisionan (algo
 *              anormal);
 */
export function generateUniqueOrderNumber(date = new Date()) {
  const datePart = formatDatePart(date)
  const registry = readRegistry()

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = `${ORDER_PREFIX}-${datePart}-${generateRandomPart()}`
    if (!registry.has(candidate)) {
      registry.add(candidate)
      writeRegistry(registry)
      return candidate
    }
  }

  throw new Error('No se pudo generar un número de orden único')
}