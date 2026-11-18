import { ROLE_INFO, isValidRole } from '../features/session/roles'
import '../styles/RoleBadge.css'

/**
 * Nombre: RoleBadge
 * Descripción: Etiqueta de color con el rol del usuario (B2C, B2B o Admin).
 *              Un rol que no existe se muestra en gris como "Sin rol válido".
 * Entradas: role: rol del usuario; full: true para mostrar el nombre largo
 *           ("Cliente B2B") en vez del corto ("B2B").
 * Salidas: JSX con la etiqueta.
 * Excepciones: No hay.
 */
function RoleBadge({ role, full = false }) {
  if (!isValidRole(role)) {
    return <span className="role-badge role-badge--invalid">Sin rol válido</span>
  }
  const info = ROLE_INFO[role]
  return (
    <span className={`role-badge role-badge--${role.toLowerCase()}`} title={info.label}>
      {full ? info.label : info.badge}
    </span>
  )
}

export default RoleBadge
