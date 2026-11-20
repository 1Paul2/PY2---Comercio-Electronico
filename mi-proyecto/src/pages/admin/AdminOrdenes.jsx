import { Fragment, useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { listAllOrders } from '../../features/orders/ordersIndex'
import { listOrders as listLocalOrders } from '../../features/orders/orderStorage'
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  getOrderStatusDisplay,
  getPaymentStatusDisplay,
} from '../../features/orders/orderStatus'
import { formatCRC } from '../../features/catalog/format'

const TODOS = 'TODOS'

/**
 * Nombre: formatFecha
 * Descripción: Fecha y hora legibles; si el dato no sirve, un guion.
 */
function formatFecha(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' })
}

/**
 * Nombre: Tag
 * Descripción: Etiqueta de estado con el tono que define orderStatus.
 */
function Tag({ display }) {
  const tono = { success: 'ok', warning: 'warn', danger: 'danger' }[display.tone] ?? 'muted'
  return (
    <span className={`admin-tag admin-tag--${tono}`} title={display.description}>
      {display.label}
    </span>
  )
}

/**
 * Nombre: formatPorcentaje
 * Descripción: Convierte 0.05 en "5%"; sin descuento devuelve un guion.
 */
function formatPorcentaje(valor) {
  return valor > 0 ? `${Math.round(valor * 100)}%` : '—'
}

/**
 * Nombre: DetalleOrden
 * Descripción: Detalle completo de una orden para el administrador: líneas
 *              con cantidad, precio de lista, precio aplicado y descuento,
 *              condiciones comerciales con que se hizo, sucursal, datos del
 *              cliente y de la empresa, y desglose de montos.
 * Entradas: order: orden (local o del índice de Algolia).
 * Salidas: JSX con el detalle.
 */
function DetalleOrden({ order }) {
  const condiciones = order.commercialConditions
  const empresa = order.customer?.company

  return (
    <div className="admin-order-detail">
      <div className="admin-order-detail__grid">
        <section>
          <h3 className="admin-order-detail__title">Condiciones comerciales</h3>
          <p className="admin-order-detail__text">
            <strong>{condiciones?.label ?? `Precio ${order.priceType ?? '—'}`}</strong>
          </p>
          {condiciones?.rules?.length > 0 && (
            <ul className="admin-order-detail__list">
              {condiciones.rules.map((regla) => (
                <li key={regla}>{regla}</li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="admin-order-detail__title">Cliente</h3>
          <p className="admin-order-detail__text">
            {order.customer?.name ?? order.buyer?.fullName ?? '—'}
            <span className="admin-table__sub">
              {order.customer?.roleLabel ?? order.customer?.role ?? '—'} · {order.customer?.email ?? order.buyer?.email ?? '—'}
            </span>
          </p>
          {empresa && (
            <p className="admin-order-detail__text">
              {empresa.name}
              <span className="admin-table__sub">
                Cédula jurídica {empresa.legalId ?? '—'}
                {empresa.sector ? ` · ${empresa.sector}` : ''}
              </span>
            </p>
          )}
        </section>

        <section>
          <h3 className="admin-order-detail__title">Sucursal y entrega</h3>
          <p className="admin-order-detail__text">
            {order.branch?.name ?? '—'}
            {order.branch?.address && <span className="admin-table__sub">{order.branch.address}</span>}
          </p>
          {order.delivery && (
            <p className="admin-order-detail__text">
              <span className="admin-table__sub">
                {[order.delivery.province, order.delivery.canton].filter(Boolean).join(', ')}
                {order.delivery.address ? ` · ${order.delivery.address}` : ''}
              </span>
            </p>
          )}
        </section>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col" className="admin-table__num">Cantidad</th>
              <th scope="col" className="admin-table__num">Precio de lista</th>
              <th scope="col" className="admin-table__num">Descuento</th>
              <th scope="col" className="admin-table__num">Precio aplicado</th>
              <th scope="col" className="admin-table__num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item) => (
              <tr key={item.id}>
                <td className="admin-table__main">
                  {item.name}
                  <span className="admin-table__sub">
                    {item.id}
                    {item.minQuantity > 1 ? ` · mínimo B2B ${item.minQuantity}` : ''}
                  </span>
                </td>
                <td className="admin-table__num">{item.quantity}</td>
                <td className="admin-table__num">{formatCRC(item.listPrice ?? item.unitPrice)}</td>
                <td className="admin-table__num">{formatPorcentaje(item.discountPct)}</td>
                <td className="admin-table__num">{formatCRC(item.unitPrice)}</td>
                <td className="admin-table__num">{formatCRC(item.lineSubtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="admin-order-detail__totals">
        <div><dt>Subtotal</dt><dd>{formatCRC(order.subtotal)}</dd></div>
        <div><dt>IVA (13%)</dt><dd>{formatCRC(order.iva)}</dd></div>
        <div><dt>Envío</dt><dd>{order.shippingCost === 0 ? 'Gratis' : formatCRC(order.shippingCost)}</dd></div>
        <div className="admin-order-detail__grand"><dt>Total</dt><dd>{formatCRC(order.total)}</dd></div>
      </dl>
    </div>
  )
}

/**
 * Nombre: descargarOrdenesLocales
 * Descripción: Descarga en un archivo JSON las órdenes generadas en este
 *              navegador. Ese archivo se sube al índice de órdenes de Algolia
 *              con `npm run upload-orders -- <archivo>`, que usa la llave de
 *              administración del .env (la llave nunca llega al navegador).
 * Entradas: No recibe parámetros.
 * Salidas: cantidad de órdenes exportadas.
 */
function descargarOrdenesLocales() {
  const ordenes = listLocalOrders()
  if (ordenes.length === 0) return 0
  const fecha = new Date().toISOString().slice(0, 10)
  const archivo = new Blob([JSON.stringify(ordenes, null, 2)], { type: 'application/json' })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(archivo)
  enlace.download = `ordenes-${fecha}.json`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
  return ordenes.length
}

/**
 * Nombre: AdminOrdenes
 * Descripción: Consulta de todas las órdenes generadas (proyecto 3, panel
 *              administrativo). Junta las órdenes del índice de Algolia con
 *              las creadas en este navegador y permite filtrarlas por rol
 *              del cliente, estado de la orden, estado del pago y texto.
 * Entradas: No recibe props.
 * Salidas: JSX con la tabla de órdenes.
 * Excepciones: No hay; si Algolia falla se avisa y se muestran al menos las
 *              órdenes locales.
 */
function AdminOrdenes() {
  const [datos, setDatos] = useState({ orders: [], remoteError: false })
  const [cargando, setCargando] = useState(true)
  const [filtroRol, setFiltroRol] = useState(TODOS)
  const [filtroOrden, setFiltroOrden] = useState(TODOS)
  const [filtroPago, setFiltroPago] = useState(TODOS)
  const [texto, setTexto] = useState('')
  const [abierta, setAbierta] = useState(null)
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

  const ordenes = useMemo(() => {
    const buscado = texto.trim().toLowerCase()
    return datos.orders.filter((o) => {
      if (filtroRol !== TODOS && o.customer?.role !== filtroRol) return false
      if (filtroOrden !== TODOS && o.orderStatus !== filtroOrden) return false
      if (filtroPago !== TODOS && o.paymentStatus !== filtroPago) return false
      if (!buscado) return true
      return [o.orderNumber, o.customer?.name, o.customer?.company?.name, o.branch?.name]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(buscado))
    })
  }, [datos.orders, filtroRol, filtroOrden, filtroPago, texto])

  const totalFacturado = ordenes
    .filter((o) => o.orderStatus === ORDER_STATUS.CONFIRMED)
    .reduce((suma, o) => suma + (Number(o.total) || 0), 0)

  const limpiarFiltros = () => {
    setFiltroRol(TODOS)
    setFiltroOrden(TODOS)
    setFiltroPago(TODOS)
    setTexto('')
  }

  const hayFiltros = filtroRol !== TODOS || filtroOrden !== TODOS || filtroPago !== TODOS || texto !== ''
  const ordenesLocales = datos.orders.filter((o) => o.source === 'local').length

  const exportar = () => {
    const cantidad = descargarOrdenesLocales()
    setMensaje(
      cantidad > 0
        ? {
            tipo: 'ok',
            texto: `${cantidad === 1 ? 'Se descargó 1 orden' : `Se descargaron ${cantidad} órdenes`} de este navegador. Para subirlas al índice de órdenes de Algolia ejecuta: npm run upload-orders -- <ruta del archivo>.`,
          }
        : { tipo: 'info', texto: 'No hay órdenes generadas en este navegador para exportar.' }
    )
  }

  return (
    <AdminLayout
      title="Órdenes"
      description="Todas las órdenes generadas en la tienda, con las condiciones comerciales y la sucursal con que se hicieron."
    >
      {datos.remoteError && (
        <p className="admin-message admin-message--error" role="alert">
          No pudimos consultar el índice de órdenes en Algolia. Se muestran únicamente las
          órdenes generadas en este navegador.
        </p>
      )}
      {mensaje && (
        <p className={`admin-message admin-message--${mensaje.tipo}`} role="status">
          {mensaje.texto}
        </p>
      )}

      <div className="admin-cards">
        <article className="admin-card">
          <p className="admin-card__value">{datos.orders.length}</p>
          <p className="admin-card__label">Órdenes registradas</p>
          <p className="admin-card__hint">Algolia y este navegador</p>
        </article>
        <article className="admin-card">
          <p className="admin-card__value">
            {datos.orders.filter((o) => o.customer?.role === 'B2B').length}
          </p>
          <p className="admin-card__label">De clientes B2B</p>
        </article>
        <article className="admin-card">
          <p className="admin-card__value">
            {datos.orders.filter((o) => o.orderStatus === ORDER_STATUS.CONFIRMED).length}
          </p>
          <p className="admin-card__label">Confirmadas</p>
        </article>
        <article className="admin-card">
          <p className="admin-card__value">{formatCRC(totalFacturado)}</p>
          <p className="admin-card__label">Total confirmado</p>
          <p className="admin-card__hint">Según los filtros aplicados</p>
        </article>
      </div>

      <section className="admin-panel">
        <div className="admin-filters">
          <label className="admin-field admin-field--grow">
            <span className="admin-field__label">Buscar</span>
            <input
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Número de orden, cliente, empresa o sucursal"
            />
          </label>

          <label className="admin-field">
            <span className="admin-field__label">Tipo de cliente</span>
            <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
              <option value={TODOS}>Todos</option>
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-field__label">Estado de la orden</span>
            <select value={filtroOrden} onChange={(e) => setFiltroOrden(e.target.value)}>
              <option value={TODOS}>Todos</option>
              {Object.values(ORDER_STATUS).map((s) => (
                <option key={s} value={s}>
                  {getOrderStatusDisplay(s).label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-field__label">Estado del pago</span>
            <select value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)}>
              <option value={TODOS}>Todos</option>
              {Object.values(PAYMENT_STATUS).map((s) => (
                <option key={s} value={s}>
                  {getPaymentStatusDisplay(s).label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="admin-button"
            onClick={limpiarFiltros}
            disabled={!hayFiltros}
          >
            Limpiar filtros
          </button>

          <button
            type="button"
            className="admin-button"
            onClick={exportar}
            disabled={ordenesLocales === 0}
            title="Descarga las órdenes generadas en este navegador para subirlas al índice de Algolia"
          >
            Exportar órdenes de este navegador ({ordenesLocales})
          </button>
        </div>

        <p className="admin-panel__hint">
          {cargando
            ? 'Cargando órdenes...'
            : `${ordenes.length} de ${datos.orders.length} órdenes`}
        </p>

        {!cargando && ordenes.length === 0 ? (
          <p className="admin-empty">
            No hay órdenes que coincidan con los filtros seleccionados.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Número</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Empresa</th>
                  <th scope="col">Sucursal</th>
                  <th scope="col" className="admin-table__num">Total</th>
                  <th scope="col">Orden</th>
                  <th scope="col">Pago</th>
                  <th scope="col">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((o) => (
                  <Fragment key={o.orderNumber}>
                  <tr className={abierta === o.orderNumber ? 'is-open' : undefined}>
                    <td className="admin-table__main">
                      {o.orderNumber}
                      <span className="admin-table__sub">
                        {o.items?.length ?? 0} {o.items?.length === 1 ? 'línea' : 'líneas'}
                        {o.source === 'local' ? ' · este navegador' : ''}
                      </span>
                    </td>
                    <td>{formatFecha(o.createdAt)}</td>
                    <td>
                      {o.customer?.name ?? o.buyer?.fullName ?? '—'}
                      <span className="admin-table__sub">{o.customer?.email ?? o.buyer?.email}</span>
                    </td>
                    <td>
                      <span className="admin-tag admin-tag--accent">
                        {o.customer?.role ?? o.priceType ?? '—'}
                      </span>
                    </td>
                    <td>{o.customer?.company?.name ?? '—'}</td>
                    <td>{o.branch?.name ?? '—'}</td>
                    <td className="admin-table__num">{formatCRC(o.total)}</td>
                    <td><Tag display={getOrderStatusDisplay(o.orderStatus)} /></td>
                    <td><Tag display={getPaymentStatusDisplay(o.paymentStatus)} /></td>
                    <td>
                      <button
                        type="button"
                        className="admin-button admin-button--small"
                        aria-expanded={abierta === o.orderNumber}
                        onClick={() => setAbierta(abierta === o.orderNumber ? null : o.orderNumber)}
                      >
                        {abierta === o.orderNumber ? 'Ocultar' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>
                  {abierta === o.orderNumber && (
                    <tr className="admin-table__detail-row">
                      <td colSpan={10}>
                        <DetalleOrden order={o} />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  )
}

export default AdminOrdenes
