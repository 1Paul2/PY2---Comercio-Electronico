import { Link, useNavigate } from 'react-router-dom'
import { useSearchBox } from 'react-instantsearch'
import ThemeToggle from '../../components/ThemeToggle'
import LogoIcon from '../../components/LogoIcon'
import { useCart } from '../../context/CartContext'
import SearchAutocomplete from './SearchAutocomplete'
import '../../styles/SearchHeader.css'

/**
 * Nombre: SearchHeader
 * Descripción: Renderiza el encabezado con navegación, buscador y selector de tema.
 * Entradas: redirectSearchTo: ruta destino para la búsqueda.
 * Salidas: JSX con el encabezado principal de la vista de catálogo.
 * Excepciones: No hay.
 */
function SearchHeader({ redirectSearchTo }) {
  const navigate = useNavigate()
  const { refine } = useSearchBox()
  const { itemCount } = useCart()

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
        <SearchAutocomplete onQuery={handleQuery} />
      </div>

      <div className="search-header__right">
        <Link to="/carrito" className="cart-link" aria-label={`Carrito, ${itemCount} unidades`}>
          <img
            className="cart-link__icon"
            src={`${import.meta.env.BASE_URL}icono_carrito.png`}
            alt=""
            aria-hidden="true"
          />
          <span className="cart-link__label">Carrito</span>
          <span className="cart-link__count">{itemCount}</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}

export default SearchHeader