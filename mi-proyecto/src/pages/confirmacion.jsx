import { useCallback, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getOrder, getLastOrder, updateOrder } from '../features/orders/orderStorage'
import { ORDER_STATUS, PAYMENT_STATUS } from '../features/orders/orderStatus'
import { buildPaymentRequest } from '../features/payment/paymentContract'
import { requestPayment } from '../features/payment/paymentClient'
import { resolveScenario } from '../features/payment/scenarioSelector'
import { formatCRC } from '../features/catalog/format'
import DevScenarioPanel from '../components/DevScenarioPanel'
import '../styles/Checkout.css'

// SVG icons
function IconCheck({ size = 20, className = '', strokeWidth = 2.5 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconClose({ size = 20, className = '', strokeWidth = 2.5 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconAlertTriangle({ size = 20, className = '', strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={3} />
    </svg>
  )
}

function IconHourglass({ size = 20, className = '', strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  )
}

function IconEmptyBox({ size = 56, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

function IconArrowLeft({ size = 16, className = '', strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

/**
 * Nombre: getOutcome
 * Descripción: Determina el tipo de resultado a mostrar según los estados
 *              de la orden y del pago. Devuelve un objeto con:
 *                - tone: 'success' | 'danger' | 'warning'
 *                - icon: ReactNode (SVG)
 *                - title: string
 *                - message: string
 */
function getOutcome(order) {
  if (order.orderStatus === ORDER_STATUS.CONFIRMED && order.paymentStatus === PAYMENT_STATUS.APPROVED) {
    return {
      tone: 'success',
      icon: <IconCheck size={24} strokeWidth={3} />,
      title: '¡Pago aprobado!',
      message: 'Tu compra se completó correctamente. Te contactaremos pronto para coordinar la entrega.',
    }
  }
  if (order.paymentStatus === PAYMENT_STATUS.DECLINED) {
    return {
      tone: 'danger',
      icon: <IconClose size={24} strokeWidth={3} />,
      title: 'Pago rechazado',
      message: 'El pago no fue aprobado. Puedes intentarlo de nuevo con otro método o verificar los datos.',
    }
  }
  if (order.paymentStatus === PAYMENT_STATUS.ERROR) {
    return {
      tone: 'warning',
      icon: <IconAlertTriangle size={24} strokeWidth={2.2} />,
      title: 'No pudimos procesar el pago',
      message: 'El servicio de pago no está disponible en este momento. Inténtalo de nuevo en unos minutos.',
    }
  }
  return {
    tone: 'warning',
    icon: <IconHourglass size={24} strokeWidth={2.2} />,
    title: 'Pago pendiente',
    message: 'Tu orden quedó registrada pero el pago aún no se ha completado.',
  }
}

function Confirmacion() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const order = (state?.orderNumber && getOrder(state.orderNumber)) || getLastOrder()

  const [retrying, setRetrying] = useState(false)
  const [scenario, setScenario] = useState(() => resolveScenario(state?.scenario))
  const [retryError, setRetryError] = useState(null)

  const handleRetry = useCallback(async () => {
    if (!order) return
    setRetrying(true)
    setRetryError(null)

    try {
      const request = buildPaymentRequest(order, scenario)
      const response = await requestPayment(request)

      const orderStatus =
        response.result === 'PAYMENT_APPROVED'
          ? ORDER_STATUS.CONFIRMED
          : response.result === 'PAYMENT_DECLINED'
            ? ORDER_STATUS.FAILED
            : ORDER_STATUS.PENDING

      const paymentStatus =
        response.result === 'PAYMENT_APPROVED'
          ? PAYMENT_STATUS.APPROVED
          : response.result === 'PAYMENT_DECLINED'
            ? PAYMENT_STATUS.DECLINED
            : PAYMENT_STATUS.ERROR

      updateOrder(order.orderNumber, {
        orderStatus,
        paymentStatus,
        payment: {
          transactionId: response.transactionId,
          reasonCode: response.reasonCode,
          message: response.message,
          processedAt: response.processedAt,
        },
      })

      navigate('/confirmacion', {
        state: { orderNumber: order.orderNumber, scenario },
        replace: true,
      })
      window.location.reload()
    } catch {
      setRetryError('No pudimos reintentar el pago. Inténtalo de nuevo en unos segundos.')
    } finally {
      setRetrying(false)
    }
  }, [order, scenario, navigate])

  if (!order) {
    return (
      <main className="checkout-page checkout-page--empty">
        <div className="checkout-empty">
          <div className="checkout-empty__icon" aria-hidden="true">
            <IconEmptyBox size={56} />
          </div>
          <h1>No encontramos ninguna orden</h1>
          <p>Parece que no tienes compras recientes o la orden fue eliminada.</p>
          <Link className="checkout-page__button" to="/productos">
            Explorar catálogo
          </Link>
        </div>
      </main>
    )
  }

  const outcome = getOutcome(order)
  const canRetry =
    order.paymentStatus === PAYMENT_STATUS.DECLINED ||
    order.paymentStatus === PAYMENT_STATUS.ERROR

  return (
    <main className="checkout-page confirmation-page">
      <header className="checkout-page__header">
        <div className="checkout-page__header-top">
          <div className="checkout-page__heading">
            <p className="checkout-page__eyebrow">Resultado de la compra</p>
            <h1>Confirmación</h1>
          </div>
          <Link className="checkout-page__back-button" to="/productos">
            <IconArrowLeft size={16} /> Volver al catálogo
          </Link>
        </div>
      </header>

      <section className={`confirmation-banner confirmation-banner--${outcome.tone}`} role="status">
        <span className="confirmation-banner__icon" aria-hidden="true">{outcome.icon}</span>
        <div className="confirmation-banner__text">
          <h2 className="confirmation-banner__title">{outcome.title}</h2>
          <p className="confirmation-banner__message">{outcome.message}</p>
        </div>
      </section>

      {retryError && (
        <div className="checkout-page__error-banner" role="alert">
          <IconAlertTriangle size={18} /> {retryError}
        </div>
      )}

      <div className="checkout-page__layout">
        <div className="checkout-page__main">
          <section className="checkout-section">
            <header className="checkout-section__header">
              <div className="checkout-section__header-text">
                <h2 className="checkout-section__title">Datos de la orden</h2>
              </div>
            </header>
            <div className="checkout-section__body">
              <dl className="confirmation-details">
                <div className="confirmation-details__row">
                  <dt>Número de orden</dt>
                  <dd><strong>{order.orderNumber}</strong></dd>
                </div>
                <div className="confirmation-details__row">
                  <dt>Fecha</dt>
                  <dd>{new Date(order.createdAt).toLocaleString('es-CR')}</dd>
                </div>
                <div className="confirmation-details__row">
                  <dt>Estado de la orden</dt>
                  <dd>{order.orderStatus}</dd>
                </div>
                <div className="confirmation-details__row">
                  <dt>Estado del pago</dt>
                  <dd>{order.paymentStatus}</dd>
                </div>
                {order.payment?.transactionId && (
                  <div className="confirmation-details__row">
                    <dt>ID de transacción</dt>
                    <dd>{order.payment.transactionId}</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>

          <section className="checkout-section">
            <header className="checkout-section__header">
              <div className="checkout-section__header-text">
                <h2 className="checkout-section__title">Comprador y entrega</h2>
              </div>
            </header>
            <div className="checkout-section__body">
              <div className="checkout-review">
                <div className="checkout-review__group">
                  <h3 className="checkout-review__group-title">
                    <span className="checkout-review__icon" aria-hidden="true">
                      <IconCheck size={11} strokeWidth={3} />
                    </span>
                    Comprador
                  </h3>
                  <dl className="checkout-review__list">
                    <div className="checkout-review__row">
                      <dt>Nombre</dt>
                      <dd>{order.buyer.fullName}</dd>
                    </div>
                    <div className="checkout-review__row">
                      <dt>Correo</dt>
                      <dd>{order.buyer.email}</dd>
                    </div>
                    <div className="checkout-review__row">
                      <dt>Teléfono</dt>
                      <dd>{order.buyer.phone}</dd>
                    </div>
                  </dl>
                </div>
                <div className="checkout-review__group">
                  <h3 className="checkout-review__group-title">
                    <span className="checkout-review__icon" aria-hidden="true">
                      <IconCheck size={11} strokeWidth={3} />
                    </span>
                    Entrega
                  </h3>
                  <dl className="checkout-review__list">
                    <div className="checkout-review__row">
                      <dt>Provincia</dt>
                      <dd>{order.delivery.province}</dd>
                    </div>
                    <div className="checkout-review__row">
                      <dt>Cantón</dt>
                      <dd>{order.delivery.canton}</dd>
                    </div>
                    <div className="checkout-review__row">
                      <dt>Dirección</dt>
                      <dd>{order.delivery.address}</dd>
                    </div>
                    {order.delivery.extraInfo && (
                      <div className="checkout-review__row">
                        <dt>Info. adicional</dt>
                        <dd>{order.delivery.extraInfo}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="checkout-summary" aria-label="Resumen de la orden">
          <div className="checkout-summary__card">
            <header className="checkout-summary__header">
              <h2 className="checkout-summary__title">Resumen</h2>
              <span className="checkout-summary__count">
                {order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'}
              </span>
            </header>

            <ul className="checkout-summary__items">
              {order.items.map((item) => (
                <li key={item.id} className="checkout-summary__item">
                  <img className="checkout-summary__image" src={item.image} alt="" loading="lazy" />
                  <div className="checkout-summary__item-info">
                    <p className="checkout-summary__item-name">{item.name}</p>
                    <p className="checkout-summary__item-meta">
                      Cant: {item.quantity} × {formatCRC(item.unitPrice)}
                    </p>
                  </div>
                  <strong className="checkout-summary__item-subtotal">
                    {formatCRC(item.lineSubtotal)}
                  </strong>
                </li>
              ))}
            </ul>

            <div className="checkout-summary__totals">
              <div className="checkout-summary__row">
                <span>Subtotal</span>
                <strong>{formatCRC(order.subtotal)}</strong>
              </div>
              <div className="checkout-summary__row">
                <span>IVA (13%)</span>
                <strong>{formatCRC(order.iva)}</strong>
              </div>
              <div className="checkout-summary__row">
                <span>Envío</span>
                <strong>{formatCRC(order.shippingCost)}</strong>
              </div>
              <div className="checkout-summary__row checkout-summary__row--total">
                <span>Total</span>
                <strong>{formatCRC(order.total)}</strong>
              </div>
            </div>

            {canRetry && (
              <button
                type="button"
                className="checkout-summary__confirm"
                onClick={handleRetry}
                disabled={retrying}
              >
                {retrying ? 'Reintentando...' : 'Reintentar pago'}
              </button>
            )}

            {order.paymentStatus === PAYMENT_STATUS.APPROVED && (
              <Link className="checkout-summary__confirm checkout-summary__confirm--link" to="/productos">
                Seguir comprando
              </Link>
            )}
          </div>
        </aside>
      </div>
      <DevScenarioPanel currentScenario={scenario} onChange={setScenario} />
    </main>
  )
}

export default Confirmacion