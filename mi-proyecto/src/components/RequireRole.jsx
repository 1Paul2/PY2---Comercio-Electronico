import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../context/useSession'
import { hasPermission } from '../features/session/roles'

/**
 * Nombre: RequireRole
 * Descripción: Protege una ruta según los permisos del rol (ver roles.js).
 *                - Con permiso: muestra la página.
 *                - Sin sesión: lleva al inicio de sesión y, al entrar,
 *                  regresa a la página que se quería abrir.
 *                - Con sesión pero sin permiso: lleva a /acceso-denegado,
 *                  que explica por qué no se puede entrar.
 * Entradas: permission: permiso necesario (PERMISSIONS de roles.js);
 *           children: la página protegida.
 * Salidas: la página o una redirección.
 * Excepciones: No hay.
 */
function RequireRole({ permission, children }) {
  const { session } = useSession()
  const { pathname } = useLocation()

  if (hasPermission(session, permission)) return children

  if (!session) {
    return <Navigate to="/login" replace state={{ from: pathname, reason: 'login-required' }} />
  }

  return <Navigate to="/acceso-denegado" replace state={{ from: pathname }} />
}

export default RequireRole
