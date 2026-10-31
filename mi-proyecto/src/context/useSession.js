import { createContext, useContext } from 'react'

/**
 * Contexto de la sesión. Vive en este archivo (y no en SessionContext.jsx)
 * para que SessionContext.jsx exporte solo componentes y el Fast Refresh de
 * Vite funcione al editarlo.
 */
export const SessionContext = createContext(null)

/**
 * Nombre: useSession
 * Descripción: Da acceso al usuario activo y a las acciones de iniciar y
 *              cerrar sesión desde cualquier componente.
 * Entradas: No recibe parámetros.
 * Salidas: Objeto { session, login, logout }.
 * Excepciones: Lanza un error si se usa fuera de un <SessionProvider>.
 */
export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession debe usarse dentro de un <SessionProvider>')
  }
  return context
}
