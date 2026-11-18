import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useSession } from '../context/useSession'
import { ROLE_INFO } from '../features/session/roles'
import { ADMIN_CHANGES_EVENT, countChanges } from '../features/admin/adminChanges'
import '../styles/Admin.css'

/**
 * Secciones del panel. Una sola lista: la barra lateral y la navegación
 * móvil se construyen desde aquí, así una sección nueva se agrega en un
 * solo lugar.
 */
const ADMIN_SECTIONS = [
  { path: '/admin', label: 'Resumen', end: true },
  { path: '/admin/ordenes', label: 'Órdenes' },
  { path: '/admin/productos', label: 'Productos' },
  { path: '/admin/inventario', label: 'Inventario' },
  { path: '/admin/metricas', label: 'Métricas' },
]

/**
 * Nombre: AdminLayout
 * Descripción: Marco común del panel administrativo. Se separa visualmente
 *              de la tienda a propósito: barra lateral oscura fija, sin el
 *              encabezado amarillo del catálogo y sin carrito, para que
 *              quede claro que el administrador no está comprando. Muestra
 *              siempre quién es el usuario y cuál es su rol.
 * Entradas: title: título de la sección; description: línea de contexto;
 *           actions (opcional): controles de la sección; children.
 * Salidas: JSX con la página del panel.
 * Excepciones: No hay.
 */
function AdminLayout({ title, description, actions, children }) {
  const { session, logout } = useSession()
  const [cambios, setCambios] = useState(() => countChanges().total)

  // El contador de la barra lateral se actualiza cuando otra pantalla del
  // panel guarda una modificación simulada.
  useEffect(() => {
    const actualizar = () => setCambios(countChanges().total)
    window.addEventListener(ADMIN_CHANGES_EVENT, actualizar)
    return () => window.removeEventListener(ADMIN_CHANGES_EVENT, actualizar)
  }, [])

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__brand">
          <span className="admin__brand-name">Maquinaria CR</span>
          <span className="admin__brand-tag">Panel administrativo</span>
        </div>

        <nav className="admin__nav" aria-label="Secciones del panel">
          {ADMIN_SECTIONS.map((section) => (
            <NavLink
              key={section.path}
              to={section.path}
              end={section.end}
              className={({ isActive }) => `admin__nav-link${isActive ? ' admin__nav-link--active' : ''}`}
            >
              {section.label}
              {section.path === '/admin/productos' && cambios > 0 && (
                <span className="admin__nav-badge" title="Modificaciones simuladas activas">
                  {cambios}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="admin__user">
          <p className="admin__user-name">{session?.name ?? 'Sin sesión'}</p>
          <p className="admin__user-role">{ROLE_INFO[session?.role]?.label ?? 'Sin rol'}</p>
          <p className="admin__user-mail">{session?.email}</p>
          <div className="admin__user-actions">
            <Link to="/productos" className="admin__link">
              Ir a la tienda
            </Link>
            <button type="button" className="admin__link admin__link--button" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="admin__main">
        <header className="admin__header">
          <div>
            <p className="admin__eyebrow">Administración</p>
            <h1>{title}</h1>
            {description && <p className="admin__description">{description}</p>}
          </div>
          {actions && <div className="admin__header-actions">{actions}</div>}
        </header>

        {children}
      </main>
    </div>
  )
}

export default AdminLayout
