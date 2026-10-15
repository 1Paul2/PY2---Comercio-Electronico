import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSearchBox } from 'react-instantsearch'
import ThemeToggle from '../../components/ThemeToggle'
import LogoIcon from '../../components/LogoIcon'
import CartDrawer from '../../components/CartDrawer'
import NoticeToast from '../../components/NoticeToast'
import { useCart } from '../../context/useCart'
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
 * Descripción: Renderiza el encabezado con navegación, buscador, acceso al carrito
 *              (abre el mini carrito lateral, salvo en /carrito) y selector de tema.
 * Entradas: redirectSearchTo: ruta destino para la búsqueda.
 * Salidas: JSX con el encabezado principal de la vista de catálogo.
 * Excepciones: No hay.
 */
function SearchHeader({ redirectSearchTo }) {
  const navigate = useNavigate()
  const { refine } = useSearchBox()
  const { itemCount, lastAddId } = useCart()
  const { pathname } = useLocation()
  const cartDrawerRef = useRef(null)
  const [lastAddIdOnMount] = useState(lastAddId)
  const hasNewAdd = lastAddId !== lastAddIdOnMount
  const isCartPage = pathname === '/carrito'
  // En /carrito, tocar el ícono del carrito avisa que ya se está ahí en vez
  // de recargar la misma página. Es un contador (0 = oculto) para que cada
  // toque vuelva a mostrar el aviso con sus 2 segundos completos.
  const [cartNoticeId, setCartNoticeId] = useState(0)

  useEffect(() => {
    const dialog = cartDrawerRef.current
    if (!hasNewAdd || !dialog) return

    if (!dialog.open) {
      dialog.showModal()
    }

    const closeTimer = window.setTimeout(() => {
      if (dialog.open) {
        dialog.close()
      }
    }, 2200)

    return () => window.clearTimeout(closeTimer)
  }, [lastAddId, hasNewAdd])

  const handleQuery = (query) => {
    const trimmed = query.trim()
    if (!trimmed) return
    if (redirectSearchTo) {
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
          <Link to="/">Inicio</Link>
          <Link to="/productos">Productos</Link>
        </nav>
      </div>

      <div className="search-header__center">
        <SearchAutocomplete redirectSearchTo={redirectSearchTo} onQuery={handleQuery} />
      </div>

      <div className="search-header__right">
        {isCartPage ? (
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

      {!isCartPage && <CartDrawer ref={cartDrawerRef} />}

      {isCartPage && cartNoticeId > 0 && (
        <NoticeToast
          key={cartNoticeId}
          tone="info"
          icon={<CartNoticeIcon />}
          title="Ya estás en tu carrito"
          message="Aquí puedes revisar tus productos, elegir cuáles comprar y continuar con el pago."
          onAccept={() => setCartNoticeId(0)}
          autoCloseMs={2000}
        />
      )}
    </header>
  )
}

export default SearchHeader