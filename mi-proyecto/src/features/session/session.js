import { isValidRole } from './roles'

/**
 * Nombre: session
 * Descripción: Sesión simulada del usuario activo, guardada en localStorage
 *              bajo la llave "ecom_session". No hay contraseñas ni servidor:
 *              el usuario se elige entre los del índice de usuarios de
 *              Algolia (ver usersIndex.js) y la sesión guarda su rol para
 *              que la tienda adapte precios, menús y accesos.
 *
 * Forma de la sesión guardada:
 *   {
 *     userId: "u-b2b-01",            // objectID del usuario en Algolia
 *     name: "Carlos Vargas Rojas",
 *     email: "compras@constructoratica.cr",
 *     role: "B2C" | "B2B" | "ADMIN",
 *     company: { name, legalId, sector, contact, phone } | null,
 *     loggedInAt: "2026-11-16T15:20:00.000Z"
 *   }
 *
 * El historial de cada usuario usa la llave "ecom_history_" + userId, así
 * la misma persona recupera su historial cada vez que inicia sesión.
 */

export const SESSION_STORAGE_KEY = 'ecom_session'

/**
 * Nombre: isValidSession
 * Descripción: Verifica que lo leído de localStorage tenga los datos mínimos
 *              y un rol válido. Una sesión vieja sin rol (laboratorio 5) o
 *              con un rol alterado se descarta y la persona queda como
 *              visitante.
 */
function isValidSession(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.userId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    isValidRole(value.role)
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
 * Entradas: user: usuario del índice (ver usersIndex.js) con rol válido.
 * Salidas: la sesión guardada.
 * Excepciones: Lanza Error si el usuario no tiene un rol válido. Sin
 *              localStorage la sesión vive solo en memoria.
 */
export function startSession(user) {
  if (!isValidRole(user?.role)) {
    throw new Error('El usuario no tiene un rol válido')
  }
  const session = {
    userId: user.userId,
    name: user.name.trim().replace(/\s+/g, ' '),
    email: user.email.trim().toLowerCase(),
    role: user.role,
    company: user.company ?? null,
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
