/* Productos.jsx — Página de catálogo: lee ?q y ?categoria de la URL
   y los usa como estado inicial de InstantSearch. */

/* Imports: hook de query params, InstantSearch, cliente, header, catálogo y footer. */
import { useSearchParams } from 'react-router-dom'
import { InstantSearch } from 'react-instantsearch'
import { searchClient } from '../features/catalog/searchClient'
import SearchHeader from '../features/catalog/SearchHeader'
import Catalog from '../features/catalog/Catalog'
import Footer from '../components/Footer'

/* Componente Productos: inicializa la búsqueda con los params de la URL. */
// Correccion - el catalogo ignoraba ?q y ?categoria si cambiaban estando ya en /productos.
function Productos() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialCategory = searchParams.get('categoria')

  /* Estado inicial: texto de búsqueda y filtro por categoría si viene en la URL.
     initialUiState solo se lee al montar InstantSearch. La key lo vuelve a
     montar cuando la URL trae otra búsqueda o categoría (enlaces de
     categoría del footer, búsquedas recientes, atrás/adelante del
     navegador). Escribir en el buscador no cambia la URL, así que no lo
     reinicia. */
  return (
    <InstantSearch
      key={`${initialQuery}|${initialCategory ?? ''}`}
      searchClient={searchClient}
      indexName="grupo-07_products"
      initialUiState={{
        'grupo-07_products': {
          query: initialQuery,
          ...(initialCategory ? { refinementList: { category_facet: [initialCategory] } } : {}),
        },
      }}
    >
      {/* Header con buscador. */}
      <SearchHeader />

      {/* Catálogo con grilla, filtros y paginación. */}
      <Catalog />

      {/* Footer del sitio. */}
      <Footer />
    </InstantSearch>
  )
}

export default Productos