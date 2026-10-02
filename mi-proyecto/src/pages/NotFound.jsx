import { InstantSearch } from 'react-instantsearch'
import { Link, useLocation } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import SearchHeader from '../features/catalog/SearchHeader'
import Footer from '../components/Footer'
import '../styles/NotFound.css'

/**
 * Nombre: NotFound
 * Descripción: Página que atiende la ruta comodín. Sin ella, cualquier URL que
 *              no coincida con una ruta declarada renderizaba una página
 *              completamente en blanco, sin header ni forma de volver.
 *              Mantiene el header y el footer para que el usuario pueda buscar
 *              o navegar sin usar el botón de atrás del navegador.
 * Entradas: No recibe props; lee la ruta fallida con useLocation.
 * Salidas: JSX con el aviso de ruta inexistente y accesos al catálogo e inicio.
 * Excepciones: No hay.
 */
function NotFound() {
  const { pathname } = useLocation()

  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      <SearchHeader redirectSearchTo="/productos" />

      <main className="not-found">
        <div className="not-found__box">
          <p className="not-found__code">404</p>
          <h1>Esta página no existe</h1>
          <p className="not-found__text">
            No encontramos nada en <code>{pathname}</code>. Puede que el enlace esté
            incompleto o que la página haya cambiado de dirección.
          </p>

          <div className="not-found__actions">
            <Link className="not-found__button" to="/productos">
              Ver el catálogo
            </Link>
            <Link className="not-found__link" to="/">
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </InstantSearch>
  )
}

export default NotFound
