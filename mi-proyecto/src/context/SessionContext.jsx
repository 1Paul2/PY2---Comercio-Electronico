import { useCallback, useMemo, useState } from 'react'
import { SessionContext } from './useSession'
import { endSession, getSession, startSession } from '../features/session/session'
import { EVENT_TYPES, trackEvent } from '../features/analytics/events'

/**
 * Nombre: SessionProvider
 * Descripción: Estado global del usuario activo. Lee la sesión guardada al
 *              cargar la app y registra los eventos de inicio y cierre de
 *              sesión.
 * Entradas: children: la aplicación.
 * Salidas: JSX con el proveedor del contexto.
 * Excepciones: No hay.
 */
export function SessionProvider({ children }) {
  const [session, setSession] = useState(getSession)

  const login = useCallback(({ name, email }) => {
    const newSession = startSession({ name, email })
    setSession(newSession)
    // Se registra después de guardar la sesión para que el evento ya lleve
    // el id del usuario que acaba de entrar.
    trackEvent(EVENT_TYPES.LOGIN, { name: newSession.name, email: newSession.email })
    return newSession
  }, [])

  const logout = useCallback(() => {
    // Se registra antes de borrar la sesión para saber quién salió.
    trackEvent(EVENT_TYPES.LOGOUT, {})
    endSession()
    setSession(null)
  }, [])

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
