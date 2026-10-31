/**
 * Nombre: session
 * Descripción: Sesión simulada del usuario activo, guardada en localStorage
 *              bajo la llave "ecom_session". No hay contraseñas ni servidor:
 *              solo sirve para saber quién usa la tienda y asociarle sus
 *              eventos e historial (laboratorio 5).
 *
 * Forma de la sesión guardada:
 *   {
 *     userId: "u-1a2b3c4d",          // id estable derivado del correo
 *     name: "María Rodríguez",
 *     email: "maria@correo.com",
 *     loggedInAt: "2026-10-31T15:20:00.000Z"
 *   }
 *
 * El historial de cada usuario (persona 2) usa la llave
 * "ecom_history_" + userId, por eso el id se deriva del correo: la misma
 * persona recupera su historial cada vez que inicia sesión.
 */

export const SESSION_STORAGE_KEY = 'ecom_session'

/**
 * Nombre: createUserId
 * Descripción: Genera un id corto y estable a partir del correo (hash
 *              FNV-1a). El mismo correo siempre produce el mismo id y el
 *              correo no queda expuesto en el nombre de las llaves.
 * Entradas: email: correo del usuario.
 * Salidas: string con forma "u-xxxxxxxx".
 * Excepciones: No lanza.
 */
export function createUserId(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  let hash = 0x811c9dc5
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `u-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

/**
 * Nombre: isValidSession
 * Descripción: Verifica que lo leído de localStorage tenga los datos mínimos.
 */
function isValidSession(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.userId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string'
  )
}

/**
 * Nombre: getSession
 * Descripción: Devuelve la sesión activa o null si no hay usuario.
 * Entradas: No recibe parámetros.
 * Salidas: objeto sesión | null.
 * Excepciones: No lanza; si localStorage falla o el dato está dañado,
 *              se comporta como si no hubiera sesión.
 */
export function getSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY))
    return isValidSession(stored) ? stored : null
  } catch {
    return null
  }
}

/**
 * Nombre: startSession
 * Descripción: Crea y guarda la sesión del usuario que inicia sesión.
 * Entradas: { name, email } ya validados.
 * Salidas: la sesión guardada.
 * Excepciones: No lanza; sin localStorage la sesión vive solo en memoria.
 */
export function startSession({ name, email }) {
  const session = {
    userId: createUserId(email),
    name: name.trim().replace(/\s+/g, ' '),
    email: email.trim().toLowerCase(),
    loggedInAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Sin localStorage la sesión dura mientras la página esté abierta.
  }
  return session
}

/**
 * Nombre: endSession
 * Descripción: Borra la sesión activa (cerrar sesión). No borra el
 *              historial ni los eventos del usuario.
 */
export function endSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Nada que limpiar si localStorage no está disponible.
  }
}
