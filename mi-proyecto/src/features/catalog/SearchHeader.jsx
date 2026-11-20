import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSearchBox } from 'react-instantsearch'
import ThemeToggle from '../../components/ThemeToggle'
import LogoIcon from '../../components/LogoIcon'
import CartDrawer from '../../components/CartDrawer'
import NoticeToast from '../../components/NoticeToast'
import RoleBadge from '../../components/RoleBadge'
import { useCart } from '../../context/useCart'
import { useSession } from '../../context/useSession'
import { PERMISSIONS, hasPermission } from '../../features/session/roles'
import SearchAutocomplete from './SearchAutocomplete'
import '../../styles/SearchHeader.css'

/**
 * Nombre: CartNoticeIcon
 * Descripción: Ícono de carrito para el aviso "Ya estás en tu carrito".
 */
function CartNoticeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

/**
 * Nombre: CartLinkContent
 * Descripción: Ícono, texto y contador de unidades del acceso al carrito.
 * Entradas: itemCount: total de unidades en el carrito.
 *           pulseKey: identificador del último agregado; al cambiar, el
 *           contador se vuelve a montar y repite la animación.
 *           shouldPulse: indica si se debe animar el contador.
 * Salidas: JSX con el contenido del botón/enlace del carrito.
 * Excepciones: No hay.
 */
function CartLinkContent({ itemCount, pulseKey, shouldPulse }) {
  return (
    <>
      <img
        className="cart-link__icon"
        src={`${import.meta.env.BASE_URL}icono_carrito.png`}
        alt=""
        aria-hidden="true"
      />
      <span className="cart-link__label">Carrito</span>
      <span key={pulseKey} className={`cart-link__count${shouldPulse ? ' cart-link__count--pulse' : ''}`}>
        {itemCount}
      </span>
    </>
  )
}

/**
 * Nombre: SearchHeader
 * Descripción: Renderiza el encabezado con navegación, buscador, usuario
 *              activo con su rol, acceso al carrito (abre el mini carrito
 *              lateral, salvo en /carrito) y selector de tema. El menú y el
 *              carrito cambian según el rol: el administrador ve su panel y
 *              no tiene carrito; los clientes ven sus órdenes.
 * Entradas: redirectSearchTo: ruta destino para la búsqueda.
 * Salidas: JSX con el encabezado principal de la vista de catálogo.
 * Excepciones: No hay.
 */
function SearchHeader({ redirectSearchTo }) {
  const navigate = useNavigate()
  const { query, refine } = useSearchBox()
  const { itemCount, lastAddId } = useCart()
  const { session, logout } = useSession()
  const { pathname } = useLocation()
  const cartDrawerRef = useRef(null)
  const [lastAddIdOnMount] = useState(lastAddId)
  const hasNewAdd = lastAddId !== lastAddIdOnMount
  const isCartPage = pathname === '/carrito'
  const [cartNoticeId, setCartNoticeId] = useState(0)
  const canUseCart = hasPermission(session, PERMISSIONS.USE_CART)
  const canViewOwnOrders = hasPermission(session, PERMISSIONS.VIEW_OWN_ORDERS)
  const canViewAdmin = hasPermission(session, PERMISSIONS.VIEW_ADMIN_INFO)

  function handleLogout() {
    logout()
    navigate('/')
  }

  useEffect(() => {
    const dialog = cartDrawerRef.current
    if (!hasNewAdd || !dialog || !canUseCart) return

    if (!dialog.open) {
      dialog.showModal()
    }

    const closeTimer = window.setTimeout(() => {
      if (dialog.open) {
        dialog.close()
      }
    }, 2200)

    return () => window.clearTimeout(closeTimer)
  }, [lastAddId, hasNewAdd, canUseCart])

  const handleQuery = (text) => {
    const trimmed = text.trim()
    if (redirectSearchTo) {
      if (!trimmed) return
      navigate(`${redirectSearchTo}?q=${encodeURIComponent(trimmed)}`)
    } else {
      refine(trimmed)
    }
  }

  return (
    <header className="search-header">
      <div className="search-header__left">
        <Link to="/" className="site-header__logo">
          <LogoIcon className="logo-icon" />
          Maquinaria CR
        </Link>
        <nav className="site-header__nav">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/productos">Productos</NavLink>
          {canViewOwnOrders && <NavLink to="/mis-ordenes">Mis órdenes</NavLink>}
          {canViewAdmin && (
            <NavLink to="/admin" className="site-header__admin-link">
              Panel admin
            </NavLink>
          )}
        </nav>
      </div>

      <div className="search-header__center">
        <SearchAutocomplete
          redirectSearchTo={redirectSearchTo}
          onQuery={handleQuery}
          activeQuery={redirectSearchTo ? '' : query}
        />
      </div>

      <div className="search-header__right">
        <div className="session-box">
          <Link
            to="/login"
            state={{ from: pathname }}
            className="session-link"
            aria-label={
              session
                ? `Sesión de ${session.name}, rol ${session.role}${session.company ? `, empresa ${session.company.name}` : ''}`
                : 'Iniciar sesión'
            }
          >
            <span aria-hidden="true">👤</span>
            <span className="session-link__text">
              <span className="session-link__name">
                {session ? session.name.split(' ')[0] : 'Iniciar sesión'}
              </span>
              {session?.company && <span className="session-link__company">{session.company.name}</span>}
            </span>
            {session && <RoleBadge role={session.role} />}
          </Link>
          {session && (
            <button type="button" className="session-logout" onClick={handleLogout}>
              Salir
            </button>
          )}
        </div>
        {!canUseCart ? null : isCartPage ? (
          <Link
            to="/carrito"
            className="cart-link"
            aria-label={`Carrito, ${itemCount} unidades`}
            onClick={(event) => {
              event.preventDefault()
              setCartNoticeId((id) => id + 1)
            }}
          >
            <CartLinkContent itemCount={itemCount} pulseKey={lastAddId} shouldPulse={hasNewAdd} />
          </Link>
        ) : (
          <button
            type="button"
            className="cart-link"
            onClick={() => cartDrawerRef.current?.showModal()}
            aria-haspopup="dialog"
            aria-label={`Abrir carrito, ${itemCount} unidades`}
          >
            <CartLinkContent itemCount={itemCount} pulseKey={lastAddId} shouldPulse={hasNewAdd} />
          </button>
        )}
        <ThemeToggle />
      </div>

      {canUseCart && !isCartPage && <CartDrawer ref={cartDrawerRef} />}

      {isCartPage && cartNoticeId > 0 && (
        <NoticeToast
          key={cartNoticeId}
          tone="info"
          icon={<CartNoticeIcon />}
          title="Ya estás en tu carrito"
          message="Aquí puedes revisar tus productos, elegir cuáles comprar y continuar con el pago."
          onAccept={() => setCartNoticeId(0)}
          autoCloseMs={3000}
        />
      )}
    </header>
  )
}

export default SearchHeader