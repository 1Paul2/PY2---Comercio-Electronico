import { useEffect, useState } from 'react'
import { InstantSearch } from 'react-instantsearch'
import { Link, useSearchParams } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import { formatCRC } from '../features/catalog/format'
import SearchHeader from '../features/catalog/SearchHeader'
import Footer from '../components/Footer'
import RoleBadge from '../components/RoleBadge'
import { useSession } from '../context/useSession'
import { getOrder, listOrdersByUser } from '../features/orders/ordersIndex'
import { getOrderStatusDisplay, getPaymentStatusDisplay } from '../features/orders/orderStatus'
import '../styles/MisOrdenes.css'

const EMPTY = '—'

/**
 * Nombre: money
 * Descripción: Formatea un monto en colones; si falta (órdenes antiguas)
 *              devuelve "—".
 */
function money(value) {
  return Number.isFinite(value) ? formatCRC(value) : EMPTY
}

/**
 * Nombre: formatOrderDate
 * Descripción: Fecha legible en es-CR (ej. "18 de noviembre de 2026, 14:30").
 * Salidas: texto, o "—" si la fecha falta o es inválida.
 */
function formatOrderDate(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return EMPTY
  return date.toLocaleString('es-CR', { dateStyle: 'long', timeStyle: 'short' })
}

/**
 * Nombre: StatusBadge
 * Descripción: Insignia de color para un estado de orden o de pago.
 * Entradas: label: texto; tone: 'success' | 'warning' | 'danger'; title: ayuda.
 */
function StatusBadge({ prefix, display }) {
  return (
    <span className={`my-orders__badge my-orders__badge--${display.tone}`} title={display.description}>
      <span className="my-orders__badge-prefix">{prefix}:</span> {display.label}
    </span>
  )
}

/**
 * Nombre: OrderItemsTable
 * Descripción: Líneas de la orden. En celular cada línea es una tarjeta con
 *              etiquetas (data-label); desde tablet es una tabla.
 */
function OrderItemsTable({ items }) {
  return (
    <table className="my-orders__table">
      <thead>
        <tr>
          <th scope="col">Producto</th>
          <th scope="col">Cantidad</th>
          <th scope="col">Precio de lista</th>
          <th scope="col">Precio aplicado</th>
          <th scope="col">Descuento</th>
          <th scope="col">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={`${item.id}-${index}`}>
            <th scope="row" className="my-orders__product">
              {item.name ?? EMPTY}
            </th>
            <td data-label="Cantidad">{item.quantity ?? EMPTY}</td>
            <td data-label="Precio de lista">{money(item.listPrice)}</td>
            <td data-label="Precio aplicado">{money(item.unitPrice)}</td>
            <td data-label="Descuento">
              {item.discountPct > 0
                ? `−${Math.round(item.discountPct * 100)}%${Number.isFinite(item.discountAmount) ? ` (${formatCRC(item.discountAmount)})` : ''}`
                : EMPTY}
            </td>
            <td data-label="Subtotal">{money(item.lineSubtotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Nombre: OrderCard
 * Descripción: Tarjeta de una orden con resumen y detalle expandible.
 * Entradas: order: orden; open: si está expandida; onToggle: alterna.
 */
function OrderCard({ order, open, onToggle }) {
  const orderStatus = getOrderStatusDisplay(order.orderStatus)
  const paymentStatus = getPaymentStatusDisplay(order.paymentStatus)
  const detailId = `my-orders-detail-${order.orderNumber}`
  const delivery = order.delivery
  const deliveryText = delivery
    ? [delivery.address, delivery.canton, delivery.province].filter(Boolean).join(', ')
    : ''
  const rules = order.commercialConditions?.rules ?? []

  return (
    <li className="my-orders__card" id={`orden-${order.orderNumber}`}>
      <div className="my-orders__summary">
        <div className="my-orders__summary-main">
          <h2 className="my-orders__number">{order.orderNumber}</h2>
          <p className="my-orders__date">{formatOrderDate(order.createdAt)}</p>
        </div>
        <dl className="my-orders__facts">
          <div>
            <dt>Sucursal</dt>
            <dd>{order.branch?.name ?? EMPTY}</dd>
          </div>
          <div>
            <dt>Tipo de precio</dt>
            <dd>{order.priceType ?? EMPTY}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd className="my-orders__total">{money(order.total)}</dd>
          </div>
        </dl>
        <div className="my-orders__badges">
          <StatusBadge prefix="Orden" display={orderStatus} />
          <StatusBadge prefix="Pago" display={paymentStatus} />
        </div>
        <button
          type="button"
          className="my-orders__toggle"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={onToggle}
        >
          {open ? 'Ocultar detalle' : 'Ver detalle'}
          <span className="my-orders__chevron" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="my-orders__detail" id={detailId}>
          <h3>Productos</h3>
          <OrderItemsTable items={order.items ?? []} />

          <div className="my-orders__detail-grid">
            <section aria-label="Totales de la orden">
              <h3>Totales</h3>
              <dl className="my-orders__totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(order.subtotal)}</dd>
                </div>
                <div>
                  <dt>IVA</dt>
                  <dd>{money(order.iva)}</dd>
                </div>
                <div>
                  <dt>Envío</dt>
                  <dd>{money(order.shippingCost)}</dd>
                </div>
                <div className="my-orders__totals-final">
                  <dt>Total</dt>
                  <dd>{money(order.total)}</dd>
                </div>
              </dl>
            </section>

            <section aria-label="Condiciones comerciales">
              <h3>Condiciones comerciales</h3>
              <p>{order.commercialConditions?.label ?? EMPTY}</p>
              {rules.length > 0 && (
                <ul>
                  {rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              )}
              {order.customer?.company && (
                <p>
                  <strong>Empresa:</strong> {order.customer.company.name ?? '—'}
                  {order.customer.company.legalId ? ` · Cédula ${order.customer.company.legalId}` : ''}
                </p>
              )}
            </section>

            <section aria-label="Entrega">
              <h3>Dirección de entrega</h3>
              <p>{deliveryText || EMPTY}</p>
              {delivery?.extraInfo && <p>{delivery.extraInfo}</p>}
            </section>
          </div>
        </div>
      )}
    </li>
  )
}

function OrdersContent() {
  const { session } = useSession()
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('orden')
  const userId = session?.userId
  const key = `${userId}|${requested ?? ''}`

  // Resultado de la consulta; se descarta si cambia el usuario o la orden pedida.
  const [result, setResult] = useState(null)
  const [openIds, setOpenIds] = useState({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [{ orders, remoteError }, requestedOrder] = await Promise.all([
        listOrdersByUser(userId),
        requested ? getOrder(requested) : Promise.resolve(null),
      ])
      if (cancelled) return
      const found = requestedOrder && requestedOrder.customer?.userId === userId ? requestedOrder : null
      const list = found && !orders.some((o) => o.orderNumber === found.orderNumber) ? [found, ...orders] : orders
      setResult({ key, orders: list, remoteError, missing: requested && !found ? requested : null })
      if (found) setOpenIds((prev) => ({ ...prev, [found.orderNumber]: true }))
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId, requested, key])

  const ready = result?.key === key
  const foundNumber = ready && requested && !result.missing ? requested : null

  // Desplaza hasta la orden pedida por URL una vez dibujada.
  useEffect(() => {
    if (!foundNumber) return
    document.getElementById(`orden-${foundNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [foundNumber])

  function toggle(orderNumber) {
    setOpenIds((prev) => ({ ...prev, [orderNumber]: !prev[orderNumber] }))
  }

  return (
    <main className="my-orders">
      <header className="my-orders__heading">
        <p className="my-orders__eyebrow">Historial de compras</p>
        <h1>Mis órdenes</h1>
        <p className="my-orders__user">
          <span>{session?.name}</span>
          <RoleBadge role={session?.role} full />
          {session?.role === 'B2B' && session?.company && (
            <span className="my-orders__company">{session.company.name}</span>
          )}
        </p>
      </header>

      {!ready && (
        <p className="my-orders__status" role="status">
          Cargando tus órdenes…
        </p>
      )}

      {ready && result.missing && (
        <p className="my-orders__notice my-orders__notice--danger" role="alert">
          No encontramos la orden {result.missing}. Revisa el número o consulta la lista de tus órdenes.
        </p>
      )}

      {ready && result.remoteError && (
        <p className="my-orders__notice my-orders__notice--warning" role="status">
          No pudimos consultar todas tus órdenes; se muestran las guardadas en este navegador.
        </p>
      )}

      {ready && result.orders.length === 0 && (
        <div className="my-orders__empty">
          <h2>Todavía no tienes órdenes</h2>
          <p>Cuando completes una compra la verás aquí.</p>
          <Link className="my-orders__link-button" to="/productos">
            Ir al catálogo
          </Link>
        </div>
      )}

      {ready && result.orders.length > 0 && (
        <ul className="my-orders__list">
          {result.orders.map((order) => (
            <OrderCard
              key={order.orderNumber}
              order={order}
              open={Boolean(openIds[order.orderNumber])}
              onToggle={() => toggle(order.orderNumber)}
            />
          ))}
        </ul>
      )}
    </main>
  )
}

/**
 * Nombre: MisOrdenes
 * Descripción: Página "Mis órdenes": lista las órdenes del usuario activo
 *              (localStorage + índice grupo-07_orders de Algolia), con detalle
 *              expandible. Acepta ?orden=NÚMERO para abrir una orden concreta.
 *              La ruta ya está protegida por rol en App.jsx (solo B2C/B2B).
 * Entradas: Ninguna (usa la sesión y el parámetro de URL "orden").
 * Salidas: JSX de la página.
 * Excepciones: No lanza; los errores de Algolia se muestran como aviso.
 */
function MisOrdenes() {
  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      <SearchHeader redirectSearchTo="/productos" />
      <OrdersContent />
      <Footer />
    </InstantSearch>
  )
}

export default MisOrdenes
