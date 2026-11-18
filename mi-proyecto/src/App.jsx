/* App.jsx — Define el enrutado principal y envuelve la app con el tema. */

/* Imports: componentes de rutas, páginas y el proveedor de tema. */
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Productos from './pages/Productos'
import ProductoDetalle from './pages/ProductoDetalle'
import Confirmacion from './pages/confirmacion'
import Carrito from './pages/Carrito'
import Checkout from './pages/Checkout'
import NotFound from './pages/NotFound'
import Terminos from './pages/Terminos'
import Privacidad from './pages/Privacidad'
import Devoluciones from './pages/Devoluciones'
import Envios from './pages/Envios'
import PreguntasFrecuentes from './pages/PreguntasFrecuentes'
import Login from './pages/Login'
import AccesoDenegado from './pages/AccesoDenegado'
import MisOrdenes from './pages/MisOrdenes'
import AdminInicio from './pages/admin/AdminInicio'
import AdminOrdenes from './pages/admin/AdminOrdenes'
import AdminProductos from './pages/admin/AdminProductos'
import AdminInventario from './pages/admin/AdminInventario'
import AdminMetricas from './pages/admin/AdminMetricas'
import RequireRole from './components/RequireRole'
import { PERMISSIONS } from './features/session/roles'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import CartNotice from './components/CartNotice'

/* Componente App: envuelve las rutas con ThemeProvider y define las rutas
   de la aplicación, incluida la comodín que atiende las URL desconocidas. */
function App() {
  const { pathname } = useLocation()

  return (
    <ThemeProvider>
      {/* Si una pantalla falla, se muestra un mensaje comprensible en vez de
          una página en blanco. La key reinicia el control al cambiar de ruta. */}
      <ErrorBoundary key={pathname}>
        <Routes>
          {/* Ruta raíz: página de inicio. */}
          <Route path="/" element={<Home />} />

          {/* Ruta de listado de productos. */}
          <Route path="/productos" element={<Productos />} />

          {/* Ruta de detalle: recibe :id por URL. */}
          <Route path="/producto/:id" element={<ProductoDetalle />} />

          {/* Rutas protegidas por rol (RequireRole + roles.js). Sin sesión se
              pide iniciar sesión; con un rol sin permiso se muestra
              /acceso-denegado. El carrito también lo usan los visitantes. */}

          {/* Ruta del carrito de compras: visitantes, B2C y B2B. */}
          <Route
            path="/carrito"
            element={<RequireRole permission={PERMISSIONS.USE_CART}><Carrito /></RequireRole>}
          />

          {/* Ruta del checkout: solo clientes B2C y B2B con sesión. */}
          <Route
            path="/checkout"
            element={<RequireRole permission={PERMISSIONS.CHECKOUT}><Checkout /></RequireRole>}
          />

          {/* Ruta de confirmación de la compra. */}
          <Route
            path="/confirmacion"
            element={<RequireRole permission={PERMISSIONS.CHECKOUT}><Confirmacion /></RequireRole>}
          />

          {/* Órdenes del cliente que inició sesión. */}
          <Route
            path="/mis-ordenes"
            element={<RequireRole permission={PERMISSIONS.VIEW_OWN_ORDERS}><MisOrdenes /></RequireRole>}
          />

          {/* Panel administrativo: solo ADMIN. */}
          <Route
            path="/admin"
            element={<RequireRole permission={PERMISSIONS.VIEW_ADMIN_INFO}><AdminInicio /></RequireRole>}
          />
          <Route
            path="/admin/ordenes"
            element={<RequireRole permission={PERMISSIONS.VIEW_ALL_ORDERS}><AdminOrdenes /></RequireRole>}
          />
          <Route
            path="/admin/productos"
            element={<RequireRole permission={PERMISSIONS.VIEW_ADMIN_INFO}><AdminProductos /></RequireRole>}
          />
          <Route
            path="/admin/inventario"
            element={<RequireRole permission={PERMISSIONS.VIEW_ADMIN_INFO}><AdminInventario /></RequireRole>}
          />
          <Route
            path="/admin/metricas"
            element={<RequireRole permission={PERMISSIONS.VIEW_ADMIN_INFO}><AdminMetricas /></RequireRole>}
          />

          {/* Aviso cuando el rol actual no puede entrar a una sección. */}
          <Route path="/acceso-denegado" element={<AccesoDenegado />} />

          {/* Inicio de sesión simulado con los usuarios del índice de Algolia. */}
          <Route path="/login" element={<Login />} />

          {/* Páginas informativas: políticas de la tienda y preguntas
              frecuentes. Sus enlaces están en el footer (policyPages.js). */}
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/devoluciones" element={<Devoluciones />} />
          <Route path="/envios" element={<Envios />} />
          <Route path="/preguntas-frecuentes" element={<PreguntasFrecuentes />} />

          {/* Ruta comodín: cualquier URL no declarada cae aquí en vez de
              renderizar una página en blanco. Debe ir de última. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
      {/* Avisos del carrito (mínimo B2B, stock, cambio de usuario). */}
      <CartNotice />
    </ThemeProvider>
  )
}

/* Exporta App como componente por defecto. */
export default App