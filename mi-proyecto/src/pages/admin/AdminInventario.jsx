import PendingPage from '../../components/PendingPage'

/**
 * Nombre: AdminInventario
 * Descripción: Inventario por sucursal. Página de relleno; la versión definitiva es parte de
 *              la Tarea 4 del proyecto 3. La ruta ya está protegida por rol en
 *              App.jsx.
 */
function AdminInventario() {
  return (
    <PendingPage
      title="Inventario por sucursal"
      description="Disponibilidad de cada producto en San José, Alajuela y Cartago Centro."
    />
  )
}

export default AdminInventario
