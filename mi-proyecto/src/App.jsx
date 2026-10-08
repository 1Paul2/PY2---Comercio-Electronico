/* App.jsx — Define el enrutado principal y envuelve la app con el tema. */

/* Imports: componentes de rutas, páginas y el proveedor de tema. */
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Productos from './pages/Productos'
import ProductoDetalle from './pages/ProductoDetalle'
import Carrito from './pages/Carrito'
import Checkout from './pages/Checkout'
import NotFound from './pages/NotFound'
import { ThemeProvider } from './context/ThemeContext'

/* Componente App: envuelve las rutas con ThemeProvider y define las rutas
   de la aplicación, incluida la comodín que atiende las URL desconocidas. */
function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Ruta raíz: página de inicio. */}
        <Route path="/" element={<Home />} />

        {/* Ruta de listado de productos. */}
        <Route path="/productos" element={<Productos />} />

        {/* Ruta de detalle: recibe :id por URL. */}
        <Route path="/producto/:id" element={<ProductoDetalle />} />

        {/* Ruta del carrito de compras. */}
        <Route path="/carrito" element={<Carrito />} />

        {/* Ruta del checkout (se completa en la Rama 2). */}
        <Route path="/checkout" element={<Checkout />} />

        {/* Ruta comodín: cualquier URL no declarada cae aquí en vez de
            renderizar una página en blanco. Debe ir de última. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  )
}

/* Exporta App como componente por defecto. */
export default App