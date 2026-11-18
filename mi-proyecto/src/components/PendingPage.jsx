import { InstantSearch } from 'react-instantsearch'
import { Link } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import SearchHeader from '../features/catalog/SearchHeader'
import Footer from './Footer'
import '../styles/NotFound.css'

/**
 * Nombre: PendingPage
 * Descripción: Página de relleno para las secciones del proyecto 3 que
 *              todavía se están construyendo (Mis órdenes y el panel
 *              administrativo). La ruta y su protección por rol ya existen;
 *              cada tarea reemplaza esta página por la definitiva.
 * Entradas: title: nombre de la sección; description: qué mostrará.
 * Salidas: JSX con el aviso.
 * Excepciones: No hay.
 */
function PendingPage({ title, description }) {
  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      <SearchHeader redirectSearchTo="/productos" />

      <main className="not-found">
        <div className="not-found__box">
          <h1>{title}</h1>
          <p className="not-found__text">{description}</p>
          <p className="not-found__text">Esta sección está en construcción.</p>
          <div className="not-found__actions">
            <Link className="not-found__button" to="/productos">
              Ver el catálogo
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </InstantSearch>
  )
}

export default PendingPage
