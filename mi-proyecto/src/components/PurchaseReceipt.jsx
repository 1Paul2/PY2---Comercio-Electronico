import LogoIcon from './LogoIcon'
import { formatCRC } from '../features/catalog/format'
import '../styles/PurchaseReceipt.css'

const STORE = {
  name: 'Maquinaria CR',
  tagline: 'Maquinaria pesada y repuestos',
  email: 'info@maquinariacr.com',
  country: 'Costa Rica',
}

const DATE_TIME_FORMAT = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

/**
 * Nombre: formatDateTime
 * Descripción: Formatea una fecha ISO en español de Costa Rica. Devuelve
 *              un guion si la fecha no existe o no es válida.
 */
function formatDateTime(isoDate) {
  const date = isoDate ? new Date(isoDate) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('es-CR', DATE_TIME_FORMAT)
    : '—'
}

/**
 * Nombre: PurchaseReceipt
 * Descripción: Comprobante de compra imprimible. Sigue la estructura de los
 *              recibos de comercio electrónico profesionales:
 *                1. Encabezado con la marca y el tipo/número de documento.
 *                2. Datos del documento (fechas, método y transacción).
 *                3. Bloques "Cliente" y "Enviar a".
 *                4. Detalle de productos con cantidad, precio unitario y total.
 *                5. Totales alineados a la derecha (subtotal, IVA, envío).
 *                6. Pie con notas y contacto.
 *              En pantalla está oculto; solo aparece al imprimir (o guardar
 *              como PDF) desde la página de confirmación. Usa colores fijos
 *              claros para que el papel se vea igual con tema claro u oscuro.
 * Entradas: order: orden confirmada (ver buildOrder y applyPaymentResult).
 * Salidas: JSX del comprobante.
 * Excepciones: No hay.
 */
function PurchaseReceipt({ order }) {
  const { buyer, delivery, payment } = order
  const deliveryLines = [delivery.address, `${delivery.canton}, ${delivery.province}`, STORE.country]

  return (
    <article className="receipt" aria-label={`Comprobante de la orden ${order.orderNumber}`}>
      <header className="receipt__header">
        <div className="receipt__brand">
          <LogoIcon className="receipt__logo" />
          <div>
            <p className="receipt__store-name">{STORE.name}</p>
            <p className="receipt__store-meta">{STORE.tagline}</p>
            <p className="receipt__store-meta">
              {STORE.email} · {STORE.country}
            </p>
          </div>
        </div>

        <div className="receipt__doc">
          <p className="receipt__doc-type">Comprobante de pago</p>
          <p className="receipt__doc-number">{order.orderNumber}</p>
          <span className="receipt__stamp">Pagado</span>
        </div>
      </header>

      <dl className="receipt__meta">
        <div>
          <dt>Fecha de la orden</dt>
          <dd>{formatDateTime(order.createdAt)}</dd>
        </div>
        <div>
          <dt>Fecha de pago</dt>
          <dd>{formatDateTime(payment?.processedAt)}</dd>
        </div>
        <div>
          <dt>Método de pago</dt>
          <dd>Tarjeta (Pasarela Sandbox)</dd>
        </div>
        <div>
          <dt>ID de transacción</dt>
          <dd className="receipt__mono">{payment?.transactionId ?? '—'}</dd>
        </div>
      </dl>

      <section className="receipt__parties">
        <div>
          <h2 className="receipt__label">Cliente</h2>
          <p className="receipt__strong">{buyer.fullName}</p>
          <p>{buyer.email}</p>
          <p>{buyer.phone}</p>
        </div>
        <div>
          <h2 className="receipt__label">Enviar a</h2>
          <p className="receipt__strong">{buyer.fullName}</p>
          {deliveryLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {delivery.extraInfo && <p className="receipt__note">Indicaciones: {delivery.extraInfo}</p>}
        </div>
      </section>

      <table className="receipt__table">
        <thead>
          <tr>
            <th scope="col" className="receipt__col-index">#</th>
            <th scope="col">Descripción</th>
            <th scope="col" className="receipt__num">Cant.</th>
            <th scope="col" className="receipt__num">Precio unitario</th>
            <th scope="col" className="receipt__num">Importe</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={item.id}>
              <td className="receipt__col-index">{index + 1}</td>
              <td>
                <span className="receipt__strong">{item.name}</span>
                <span className="receipt__sku">Código: {item.id}</span>
              </td>
              <td className="receipt__num">{item.quantity}</td>
              <td className="receipt__num">{formatCRC(item.unitPrice)}</td>
              <td className="receipt__num">{formatCRC(item.lineSubtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt__summary">
        <p className="receipt__thanks">
          ¡Gracias por tu compra! Conserva este comprobante como respaldo de tu pago.
        </p>
        <dl className="receipt__totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatCRC(order.subtotal)}</dd>
          </div>
          <div>
            <dt>IVA (13%)</dt>
            <dd>{formatCRC(order.iva)}</dd>
          </div>
          <div>
            <dt>Envío</dt>
            <dd>{order.shippingCost === 0 ? 'Gratis' : formatCRC(order.shippingCost)}</dd>
          </div>
          <div className="receipt__grand-total">
            <dt>Total ({order.currency})</dt>
            <dd>{formatCRC(order.total)}</dd>
          </div>
          <div>
            <dt>Monto pagado</dt>
            <dd>{formatCRC(order.total)}</dd>
          </div>
          <div>
            <dt>Saldo pendiente</dt>
            <dd>{formatCRC(0)}</dd>
          </div>
        </dl>
      </div>

      <footer className="receipt__footer">
        <p>
          Entrega estimada: 1 a 3 días hábiles. Para consultas sobre este pedido escribe a{' '}
          {STORE.email} indicando el número de orden {order.orderNumber}.
        </p>
        <p>
          Este comprobante respalda el pago de la orden y no sustituye a la factura electrónica.
          Transacción procesada en ambiente Sandbox.
        </p>
      </footer>
    </article>
  )
}

export default PurchaseReceipt
