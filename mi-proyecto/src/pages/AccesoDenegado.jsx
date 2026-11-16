import { InstantSearch } from 'react-instantsearch'
import { Link, useLocation } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import SearchHeader from '../features/catalog/SearchHeader'
import Footer from '../components/Footer'
import RoleBadge from '../components/RoleBadge'
import { useSession } from '../context/useSession'
import { ROLES, ROLE_INFO } from '../features/session/roles'
import '../styles/NotFound.css'

/**
 * Nombre: getDeniedReason
 * Descripción: Explicación de por qué el rol actual no puede entrar a la
 *              página que intentó abrir.
 */
function getDeniedReason(role, from = '') {
  if (role === ROLES.ADMIN) {
    return 'El administrador consulta órdenes, productos e inventario, pero no realiza compras, por eso no tiene carrito, checkout ni órdenes propias.'
  }
  if (from.startsWith('/admin')) {
    return 'El panel administrativo es solo para el administrador de la tienda.'
  }
  return 'Tu rol no tiene permiso para usar esta sección.'
}

/**
 * Nombre: AccesoDenegado
 * Descripción: Página que se muestra cuando un usuario con sesión intenta
 *              abrir una sección que su rol no permite (por ejemplo, un
 *              cliente que entra a /admin). Indica el rol actual, el motivo
 *              y ofrece volver a una página permitida o cambiar de usuario.
 * Entradas: No recibe props; lee de location.state la ruta que se intentó abrir.
 * Salidas: JSX con el aviso.
 * Excepciones: No hay.
 */
function AccesoDenegado() {
  const { session } = useSession()
  const { state } = useLocation()
  const from = state?.from ?? ''
  const isAdmin = session?.role === ROLES.ADMIN

  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      <SearchHeader redirectSearchTo="/productos" />

      <main className="not-found">
        <div className="not-found__box">
          <p className="not-found__code" aria-hidden="true">🔒</p>
          <h1>No tienes acceso a esta sección</h1>
          {session ? (
            <p className="not-found__text">
              Entraste como <strong>{session.name}</strong> <RoleBadge role={session.role} full />.{' '}
              {getDeniedReason(session.role, from)}
            </p>
          ) : (
            <p className="not-found__text">Inicia sesión con un usuario que tenga permiso para entrar.</p>
          )}
          {from && (
            <p className="not-found__text">
              Página solicitada: <code>{from}</code>
            </p>
          )}

          <div className="not-found__actions">
            <Link className="not-found__button" to={isAdmin ? '/admin' : '/productos'}>
              {isAdmin ? 'Ir al panel administrativo' : 'Ver el catálogo'}
            </Link>
            <Link className="not-found__link" to="/login">
              {session ? `Cambiar de usuario (${ROLE_INFO[session.role].label})` : 'Iniciar sesión'}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </InstantSearch>
  )
}

export default AccesoDenegado
