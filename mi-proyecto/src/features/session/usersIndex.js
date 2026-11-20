import { searchClient } from '../catalog/searchClient'

/**
 * Nombre: usersIndex
 * Descripción: Consulta de los usuarios de la tienda en el índice de Algolia
 *              grupo-07_users (se carga con npm run seed-users). Es la fuente
 *              del inicio de sesión simulado: solo pueden entrar los usuarios
 *              que estén en ese índice.
 *
 * Forma de un usuario:
 *   { userId, name, email, role, phone, province, description,
 *     company: { name, legalId, sector, contact, phone } | null }
 */

export const USERS_INDEX = 'grupo-07_users'

/**
 * Nombre: normalizeUser
 * Descripción: Convierte un registro del índice en el usuario que usa la app.
 *              Devuelve null si al registro le faltan datos básicos.
 */
function normalizeUser(hit) {
  if (!hit?.objectID || typeof hit.name !== 'string' || typeof hit.email !== 'string') {
    return null
  }
  return {
    userId: hit.objectID,
    name: hit.name,
    email: hit.email.trim().toLowerCase(),
    role: hit.role ?? null,
    phone: hit.phone ?? '',
    province: hit.province ?? '',
    description: hit.description ?? '',
    company: hit.company ?? null,
  }
}

/**
 * Nombre: fetchUsers
 * Descripción: Trae todos los usuarios del índice (son pocos).
 * Entradas: No recibe parámetros.
 * Salidas: Promise con el arreglo de usuarios.
 * Excepciones: Rechaza si no hay conexión con Algolia; quien llama debe
 *              mostrar un mensaje comprensible.
 */
export async function fetchUsers() {
  const { results } = await searchClient.search({
    requests: [{ indexName: USERS_INDEX, query: '', hitsPerPage: 100 }],
  })
  return (results[0]?.hits ?? []).map(normalizeUser).filter(Boolean)
}

/**
 * Nombre: findUserByEmail
 * Descripción: Busca un usuario por su correo (sin distinguir mayúsculas).
 * Entradas: email: correo escrito por la persona.
 * Salidas: Promise con el usuario o null si no existe.
 * Excepciones: Rechaza si no hay conexión con Algolia.
 */
export async function findUserByEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!normalized) return null
  const users = await fetchUsers()
  return users.find((user) => user.email === normalized) ?? null
}
