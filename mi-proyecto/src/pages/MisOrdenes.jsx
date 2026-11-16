import PendingPage from '../components/PendingPage'

/**
 * Nombre: MisOrdenes
 * Descripción: Mis órdenes. Página de relleno; la versión definitiva es parte de
 *              la Tarea 3 del proyecto 3. La ruta ya está protegida por rol en
 *              App.jsx.
 */
function MisOrdenes() {
  return (
    <PendingPage
      title="Mis órdenes"
      description="Aquí verás las órdenes que has realizado, con su sucursal, precios aplicados y estado."
    />
  )
}

export default MisOrdenes
