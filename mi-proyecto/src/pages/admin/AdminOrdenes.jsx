import PendingPage from '../../components/PendingPage'

/**
 * Nombre: AdminOrdenes
 * Descripción: Órdenes de la tienda. Página de relleno; la versión definitiva es parte de
 *              la Tarea 4 del proyecto 3. La ruta ya está protegida por rol en
 *              App.jsx.
 */
function AdminOrdenes() {
  return (
    <PendingPage
      title="Órdenes de la tienda"
      description="Todas las órdenes generadas, con cliente, tipo de cliente, empresa, sucursal, total y estados."
    />
  )
}

export default AdminOrdenes
