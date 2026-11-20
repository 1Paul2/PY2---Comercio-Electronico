import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { listAllOrders } from '../../features/orders/ordersIndex'
import { ORDER_STATUS, PAYMENT_STATUS } from '../../features/orders/orderStatus'
import { formatCRC } from '../../features/catalog/format'
import {
  ADMIN_CHANGES_EVENT,
  CHANGE_LABELS,
  CHANGE_TYPES,
  countChanges,
  getHistory,
  resetAll,
} from '../../features/admin/adminChanges'

/**
 * Nombre: formatFechaHora
 * Descripción: Fecha y hora legibles para el historial de cambios.
 */
function formatFechaHora(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * Nombre: describirCambio
 * Descripción: Convierte un movimiento del historial en una frase legible
 *              que deja claro qué se modificó y cuál era el valor anterior.
 */
function describirCambio(entrada) {
  if (entrada.type === 'reset_product') {
    return `${entrada.productName}: se restablecieron los valores originales`
  }
  const etiqueta = CHANGE_LABELS[entrada.type] ?? entrada.type
  const sucursal = entrada.branchName ? ` en ${entrada.branchName}` : ''
  const esPrecio = entrada.type !== CHANGE_TYPES.STOCK
  const antes = esPrecio ? formatCRC(entrada.previous) : `${entrada.previous} unid.`
  const despues = esPrecio ? formatCRC(entrada.next) : `${entrada.next} unid.`
  return `${entrada.productName} · ${etiqueta}${sucursal}: ${antes} → ${despues}`
}

/**
 * Nombre: AdminInicio
 * Descripción: Resumen del panel administrativo (proyecto 3). Reúne el
 *              estado de las órdenes, los accesos a las demás secciones y
 *              el historial de modificaciones simuladas, con la opción de
 *              restablecer todo el catálogo a los valores del índice.
 * Entradas: No recibe props.
 * Salidas: JSX con el resumen.
 * Excepciones: No hay.
 */
function AdminInicio() {
  const [datos, setDatos] = useState({ orders: [], remoteError: false })
  const [cargando, setCargando] = useState(true)
  const [historial, setHistorial] = useState(() => getHistory())
  const [cambios, setCambios] = useState(() => countChanges())
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    let cancelado = false
    listAllOrders()
      .then((r) => {
        if (!cancelado) setDatos(r)
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    const actualizar = () => {
      setHistorial(getHistory())
      setCambios(countChanges())
    }
    window.addEventListener(ADMIN_CHANGES_EVENT, actualizar)
    return () => window.removeEventListener(ADMIN_CHANGES_EVENT, actualizar)
  }, [])

  const confirmadas = datos.orders.filter((o) => o.orderStatus === ORDER_STATUS.CONFIRMED)
  const pendientes = datos.orders.filter((o) => o.paymentStatus === PAYMENT_STATUS.PENDING)
  const b2b = datos.orders.filter((o) => o.customer?.role === 'B2B')
  const facturado = confirmadas.reduce((suma, o) => suma + (Number(o.total) || 0), 0)

  const restablecerTodo = () => {
    const r = resetAll()
    setHistorial(getHistory())
    setCambios(countChanges())
    setMensaje(
      r.ok
        ? { tipo: 'ok', texto: 'Se restablecieron todos los valores del catálogo.' }
        : { tipo: 'error', texto: r.error }
    )
  }

  return (
    <AdminLayout
      title="Resumen"
      description="Estado general de la tienda: órdenes registradas y modificaciones administrativas vigentes."
      actions={
        <Link className="admin-button" to="/admin/ordenes">
          Ver todas las órdenes
        </Link>
      }
    >
      {datos.remoteError && (
        <p className="admin-message admin-message--error" role="alert">
          No pudimos consultar el índice de órdenes en Algolia. Las cifras incluyen únicamente
          las órdenes generadas en este navegador.
        </p>
      )}
      {mensaje && (
        <p className={`admin-message admin-message--${mensaje.tipo}`} role="status">
          {mensaje.texto}
        </p>
      )}

      <div className="admin-cards">
        <article className="admin-card">
          <p className="admin-card__value">{cargando ? '—' : datos.orders.length}</p>
          <p className="admin-card__label">Órdenes registradas</p>
          <p className="admin-card__hint">{b2b.length} de clientes B2B</p>
        </article>
        <article className="admin-card">
          <p className="admin-card__value">{cargando ? '—' : confirmadas.length}</p>
          <p className="admin-card__label">Órdenes confirmadas</p>
          <p className="admin-card__hint">{pendientes.length} con pago pendiente</p>
        </article>
        <article className="admin-card">
          <p className="admin-card__value">{cargando ? '—' : formatCRC(facturado)}</p>
          <p className="admin-card__label">Total confirmado</p>
        </article>
        <article className="admin-card">
          <p className="admin-card__value">{cambios.total}</p>
          <p className="admin-card__label">Productos modificados</p>
          <p className="admin-card__hint">
            {cambios.prices} con precio · {cambios.stock} con inventario
          </p>
        </article>
      </div>

      <div className="admin-columns">
        <section className="admin-panel">
          <h2 className="admin-panel__title">Secciones</h2>
          <p className="admin-panel__hint">
            Consultas disponibles únicamente para el rol Administrador.
          </p>
          <ul className="admin-history">
            <li>
              <Link className="admin-link" to="/admin/ordenes">Órdenes</Link>
              <span className="admin-history__time">
                Todas las órdenes, con filtros por tipo de cliente y estado.
              </span>
            </li>
            <li>
              <Link className="admin-link" to="/admin/productos">Productos</Link>
              <span className="admin-history__time">
                Precios B2C y B2B, cantidad mínima y descuentos por volumen.
              </span>
            </li>
            <li>
              <Link className="admin-link" to="/admin/inventario">Inventario</Link>
              <span className="admin-history__time">
                Existencias por sucursal, con los agotados resaltados.
              </span>
            </li>
            <li>
              <Link className="admin-link" to="/admin/metricas">Métricas</Link>
              <span className="admin-history__time">
                Uso de la tienda a partir de los eventos registrados.
              </span>
            </li>
          </ul>
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel__title">Modificaciones simuladas</h2>
          <p className="admin-panel__hint">
            Los cambios de precio e inventario se guardan en este navegador y se aplican a la
            tienda. El índice de Algolia no se modifica.
          </p>

          {historial.length === 0 ? (
            <p className="admin-empty">
              Todavía no se ha realizado ninguna modificación. Puedes hacer una desde Productos
              o Inventario.
            </p>
          ) : (
            <>
              <ul className="admin-history">
                {historial.slice(0, 8).map((entrada, i) => (
                  <li key={`${entrada.at}-${i}`}>
                    <span className="admin-history__change">{describirCambio(entrada)}</span>
                    <span className="admin-history__time">{formatFechaHora(entrada.at)}</span>
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: '1rem' }}>
                <button type="button" className="admin-button admin-button--danger" onClick={restablecerTodo}>
                  Restablecer todo el catálogo
                </button>
              </p>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}

export default AdminInicio
