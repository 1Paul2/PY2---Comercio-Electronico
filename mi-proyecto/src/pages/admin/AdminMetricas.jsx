import AdminLayout from '../../components/AdminLayout'
import { AnalyticsPanel } from '../Analytics'

/**
 * Nombre: AdminMetricas
 * Descripción: Métricas de uso dentro del panel administrativo (proyecto 3).
 *              Reutiliza el panel de analítica del laboratorio 5 sin
 *              duplicar su lógica: lo único que cambia es el marco, que
 *              ahora es el del panel y queda restringido al rol
 *              Administrador.
 * Entradas: No recibe props.
 * Salidas: JSX con las métricas dentro del panel.
 * Excepciones: No hay.
 */
function AdminMetricas() {
  return (
    <AdminLayout
      title="Métricas de uso"
      description="Actividad registrada en la tienda: búsquedas, productos vistos, carritos y compras."
    >
      <AnalyticsPanel />
    </AdminLayout>
  )
}

export default AdminMetricas
