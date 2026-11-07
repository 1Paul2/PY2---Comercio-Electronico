/* Home.jsx — Página de inicio: hero, categorías destacadas y propuestas de valor. */

/* Imports: InstantSearch, cliente de búsqueda, header, showcase, footer y estilos. */
import { InstantSearch } from 'react-instantsearch'
import { searchClient } from '../features/catalog/searchClient'
import SearchHeader from '../features/catalog/SearchHeader'
import CategoryShowcase from '../features/catalog/CategoryShowcase'
import PersonalHome from '../features/personalization/PersonalHome'
import Footer from '../components/Footer'
import '../styles/Home.css'

/* Datos estáticos de las 4 propuestas de valor que se muestran en la home. */
const VALUE_PROPS = [
  {
    title: 'Stock en tiempo real',
    text: 'Disponibilidad actualizada por sede, sin sorpresas al momento de comprar.',
  },
  {
    title: 'Precios B2C y mayoristas',
    text: 'Precio al público y tarifas por volumen para compras B2B, con descuentos.',
  },
  {
    title: 'Cotización directa',
    text: 'Solicitá una cotización de cualquier producto en un clic, sin formularios largos.',
  },
  {
    title: 'Envíos a todo el país',
    text: 'Coordinación logística rápida y segura hasta tu obra o taller.',
  },
]

/* Componente Home: todo dentro de InstantSearch para habilitar la búsqueda. */
function Home() {
  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      {/* Header con buscador; al buscar redirige a /productos. */}
      <SearchHeader redirectSearchTo="/productos" />

      {/* Hero de bienvenida con título y subtítulo. */}
      <section className="home-hero">
        <h1>Encontrá la maquinaria y repuestos que tu proyecto necesita</h1>
        <p>Stock actualizado en tiempo real, precios transparentes y cotización en un clic.</p>
      </section>

      {/* Sección personalizada: con sesión muestra búsquedas recientes,
          productos vistos y recomendaciones; sin sesión invita a iniciarla. */}
      <PersonalHome />

      {/* Bloques de categorías con imagen rotativa. */}
      <CategoryShowcase />

      {/* Sección de propuestas de valor generada desde VALUE_PROPS. */}
      <section className="home-value-props">
        <div className="value-props">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className="value-prop">
              <h3>{prop.title}</h3>
              <p>{prop.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer del sitio. */}
      <Footer />
    </InstantSearch>
  )
}

export default Home