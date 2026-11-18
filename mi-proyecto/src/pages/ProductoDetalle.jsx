/* ProductoDetalle.jsx — Página de detalle: lee el :id de la URL y monta la ficha. */

/* Imports: hook de params, InstantSearch, cliente, header, ficha y footer. */
import { useParams } from 'react-router-dom'
import { InstantSearch } from 'react-instantsearch'
import { searchClient } from '../features/catalog/searchClient'
import SearchHeader from '../features/catalog/SearchHeader'
import ProductDetail from '../features/catalog/ProductDetail'
import Footer from '../components/Footer'

/* Componente ProductoDetalle: obtiene el id de la ruta y renderiza la ficha. */
function ProductoDetalle() {
  const { id } = useParams()

  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      {/* Header con buscador; al buscar redirige a /productos. */}
      <SearchHeader redirectSearchTo="/productos" />

      {/* Ficha de producto; recibe el id desde la URL. */}
      <ProductDetail key={id} id={id} />

      {/* Footer del sitio. */}
      <Footer />
    </InstantSearch>
  )
}

export default ProductoDetalle