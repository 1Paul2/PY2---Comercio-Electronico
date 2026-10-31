import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { getOrder, getLastOrder } from '../features/orders/orderStorage'
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  getOrderStatusDisplay,
  getPaymentStatusDisplay,
} from '../features/orders/orderStatus'
import { applyPaymentResult, isOrderPayable } from '../features/orders/applyPaymentResult'
import { clearCheckoutDraft } from '../features/checkout/useCheckoutPersistence'
import { PAYMENT_RESULT, buildPaymentRequest } from '../features/payment/paymentContract'
import { requestPayment } from '../features/payment/paymentClient'
import { useWarnBeforeLeave } from '../features/payment/useWarnBeforeLeave'
import { getPaymentReasonText } from '../features/payment/paymentMessages'
import { resolveScenario } from '../features/payment/scenarioSelector'
import { formatCRC } from '../features/catalog/format'
import DevScenarioPanel from '../components/DevScenarioPanel'
import PurchaseReceipt from '../components/PurchaseReceipt'
import NoticeToast from '../components/NoticeToast'
import '../styles/Checkout.css'

/* ============================================================
   Iconos SVG en línea (estilo consistente y accesible)
   ============================================================ */

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

function IconUser({ size = 18, className = '', strokeWidth = 2 }) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconMapPin({ size = 18, className = '', strokeWidth = 2 }) {
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
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function IconTruck({ size = 22, className = '', strokeWidth = 2 }) {
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
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z" />
      <circle cx="17" cy="18.5" r="2.5" />
      <circle cx="7" cy="18.5" r="2.5" />
    </svg>
  )
}

function IconPrinter({ size = 18, className = '', strokeWidth = 2 }) {
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
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" />
    </svg>
  )
}

function IconCopy({ size = 14, className = '', strokeWidth = 2 }) {
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
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function IconShoppingBag({ size = 18, className = '', strokeWidth = 2 }) {
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
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

/* ============================================================
   Stepper de progreso del checkout
   ============================================================ */

function CheckoutStepper({ currentStep = 'confirmation', isComplete = false }) {
  const steps = [
    { id: 'cart', label: 'Carrito' },
    { id: 'checkout', label: 'Checkout' },
    { id: 'confirmation', label: 'Confirmación' },
  ]
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <nav className="checkout-stepper" aria-label="Progreso de la compra">
      {steps.map((step, index) => {
        const isDone = index < currentIndex || (index === currentIndex && isComplete)
        const status = isDone ? 'complete' : index === currentIndex ? 'active' : 'pending'
        return (
          <div key={step.id} className={`checkout-stepper__step checkout-stepper__step--${status}`}>
            <span className="checkout-stepper__bullet" aria-hidden="true">
              {isDone ? <IconCheck size={14} strokeWidth={3} /> : index + 1}
            </span>
            <span className="checkout-stepper__label">{step.label}</span>
            {index < steps.length - 1 && <span className="checkout-stepper__line" aria-hidden="true" />}
          </div>
        )
      })}
    </nav>
  )
}

/* ============================================================
   Lógica del banner de resultado
   ============================================================ */

function getOutcome(order) {
  if (order.orderStatus === ORDER_STATUS.CONFIRMED && order.paymentStatus === PAYMENT_STATUS.APPROVED) {
    return {
      tone: 'success',
      icon: <IconCheck size={26} strokeWidth={3} />,
      title: '¡Compra confirmada con éxito!',
      message: `Hemos procesado tu pago correctamente. Enviamos el comprobante y los detalles a ${order.buyer?.email || 'tu correo'}.`,
    }
  }
  if (order.paymentStatus === PAYMENT_STATUS.DECLINED) {
    return {
      tone: 'danger',
      icon: <IconClose size={26} strokeWidth={3} />,
      title: 'Pago rechazado por el emisor',
      message: 'La transacción no pudo ser autorizada. Puedes reintentar con otro método o verificar los datos.',
    }
  }
  if (order.paymentStatus === PAYMENT_STATUS.ERROR) {
    return {
      tone: 'warning',
      icon: <IconAlertTriangle size={26} strokeWidth={2.2} />,
      title: 'No pudimos procesar el pago',
      message: 'El servicio de pago no respondió a tiempo. Tus artículos siguen reservados, puedes reintentar el pago.',
    }
  }
  return {
    tone: 'warning',
    icon: <IconHourglass size={26} strokeWidth={2.2} />,
    title: 'Pago en proceso de verificación',
    message: 'Tu orden quedó registrada en nuestro sistema y está pendiente de confirmación bancaria.',
  }
}

/* ============================================================
   Componente Principal: Confirmacion
   ============================================================ */

function Confirmacion() {
  const { state } = useLocation()
  const { removeItems, items: cartItems } = useCart()

  // La orden se lee una sola vez al montar; luego vive en el estado para que
  // los reintentos actualicen la pantalla sin recargar la página.
  const [order, setOrder] = useState(
    () => (state?.orderNumber && getOrder(state.orderNumber)) || getLastOrder()
  )
  const [retrying, setRetrying] = useState(false)
  const [scenario, setScenario] = useState(() => resolveScenario(state?.scenario))
  const [retryError, setRetryError] = useState(null)
  const [copyStatus, setCopyStatus] = useState(null)
  const retryingRef = useRef(false)
  // El mensaje del resultado se muestra como un aviso en la esquina superior
  // izquierda que no tapa la página; se cierra con "Aceptar" o solo a los 5
  // segundos. Vuelve a aparecer con cada resultado nuevo (p. ej. tras un reintento).
  const [showResult, setShowResult] = useState(true)

  // Mientras se reintenta el pago, se advierte antes de recargar o cerrar.
  useWarnBeforeLeave(retrying)

  // Cada vez que se muestra un resultado (al llegar o tras un reintento), la
  // pestaña del navegador lo indica en su título. El aviso usa role="alert",
  // así los lectores de pantalla lo anuncian sin mover el foco.
  useEffect(() => {
    if (!order) return undefined
    const previousTitle = document.title
    document.title = `${getOutcome(order).title} | Maquinaria CR`
    return () => {
      document.title = previousTitle
    }
  }, [order])

  async function handleCopyOrderNumber() {
    if (!order?.orderNumber) return
    try {
      await navigator.clipboard.writeText(order.orderNumber)
      setCopyStatus('copied')
    } catch {
      // Sin permiso de portapapeles (o contexto no seguro): se avisa en vez
      // de fallar en silencio.
      setCopyStatus('failed')
    }
    setTimeout(() => setCopyStatus(null), 2000)
  }

  /**
   * Nombre: handlePrint
   * Descripción: Imprime el comprobante (PurchaseReceipt). Cambia el título
   *              del documento mientras dura la impresión para que, al
   *              guardar como PDF, el archivo se llame con el número de orden.
   */
  function handlePrint() {
    const previousTitle = document.title
    document.title = `Comprobante-${order.orderNumber}`
    window.addEventListener('afterprint', () => { document.title = previousTitle }, { once: true })
    window.print()
  }

  /**
   * Nombre: handleRetry
   * Descripción: Reintenta el cobro de la MISMA orden (mismo número y monto).
   *              Relee la orden del almacenamiento antes de enviar para no
   *              cobrar dos veces una orden que ya quedó confirmada (por
   *              ejemplo, desde otra pestaña). El resultado se aplica con las
   *              mismas reglas que el checkout (applyPaymentResult).
   */
  async function handleRetry() {
    if (!order || retryingRef.current) return
    retryingRef.current = true
    setRetrying(true)
    setRetryError(null)

    try {
      const latest = getOrder(order.orderNumber) ?? order
      if (!isOrderPayable(latest)) {
        setOrder(latest)
        setShowResult(true)
        return
      }

      const response = await requestPayment(buildPaymentRequest(latest, scenario))
      const updated = applyPaymentResult(latest.orderNumber, response)
      if (!updated) {
        setRetryError('No pudimos actualizar el estado de tu orden. Inténtalo de nuevo en unos segundos.')
        return
      }

      // Al aprobarse el reintento se quitan del carrito solo los productos
      // de esta orden; lo demás que haya en el carrito se conserva.
      if (response.result === PAYMENT_RESULT.APPROVED) {
        removeItems(latest.items.map((item) => item.id))
        clearCheckoutDraft()
      }
      setOrder(updated)
      setShowResult(true)
    } catch {
      setRetryError('No pudimos reintentar el pago. Inténtalo de nuevo en unos segundos.')
    } finally {
      retryingRef.current = false
      setRetrying(false)
    }
  }

  if (!order) {
    return (
      <main className="checkout-page checkout-page--empty">
        <div className="checkout-empty">
          <div className="checkout-empty__icon" aria-hidden="true">
            <IconEmptyBox size={60} />
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
  const isApproved = order.paymentStatus === PAYMENT_STATUS.APPROVED
  const canRetry =
    isOrderPayable(order) &&
    (order.paymentStatus === PAYMENT_STATUS.DECLINED || order.paymentStatus === PAYMENT_STATUS.ERROR)
  const attemptCount = Array.isArray(order.paymentAttempts) ? order.paymentAttempts.length : 0
  // Motivo legible del último intento fallido (rechazo o error del servicio).
  const reasonText = isApproved ? null : getPaymentReasonText(order.payment?.reasonCode)

  const orderStatusBadge = getOrderStatusDisplay(order.orderStatus)

  const paymentStatusBadge = getPaymentStatusDisplay(order.paymentStatus)

  const formatDate = (isoDate) =>
    isoDate
      ? new Date(isoDate).toLocaleDateString('es-CR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : ''
  const formattedDate = formatDate(order.createdAt)
  const formattedUpdate = formatDate(order.updatedAt)

  return (
    <main className="checkout-page confirmation-page">
      <header className="checkout-page__header">
        <div className="checkout-page__header-top">
          <div className="checkout-page__heading">
            <p className="checkout-page__eyebrow">
              {isApproved ? 'Paso 3 de 3 · Pedido completado' : 'Paso 3 de 3 · Revisión de pago'}
            </p>
            <h1>Confirmación</h1>
          </div>
          <Link className="checkout-page__back-button" to="/productos">
            <IconArrowLeft size={16} /> Volver al catálogo
          </Link>
        </div>

        <CheckoutStepper currentStep="confirmation" isComplete={isApproved} />
      </header>

      {/* Aviso del resultado: entra desde la izquierda en la esquina superior,
          deja ver y usar la página, y se cierra con "Aceptar" o a los 5 segundos. */}
      {showResult && (
        <NoticeToast
          // La key reinicia el aviso (y su temporizador) con cada resultado nuevo.
          key={`${order.paymentStatus}-${order.updatedAt ?? ''}`}
          autoCloseMs={5000}
          tone={outcome.tone}
          icon={outcome.icon}
          title={outcome.title}
          message={outcome.message}
          onAccept={() => setShowResult(false)}
        >
          {reasonText && (
            <p className="notice-toast__reason">
              <strong>Motivo:</strong> {reasonText.reason} {reasonText.nextStep}
            </p>
          )}
        </NoticeToast>
      )}

      {/* Banner de error al reintentar */}
      {retryError && (
        <div className="checkout-page__error-banner" role="alert">
          <IconAlertTriangle size={18} /> {retryError}
        </div>
      )}

      {/* Tarjeta de entrega estimada cuando el pago es exitoso */}
      {isApproved && (
        <div className="confirmation-delivery-card">
          <div className="confirmation-delivery-card__icon">
            <IconTruck size={22} />
          </div>
          <div>
            <h3 className="confirmation-delivery-card__title">Entrega estimada</h3>
            <p className="confirmation-delivery-card__desc">
              Tu paquete será entregado en un plazo de <strong>1 a 3 días hábiles</strong> en{' '}
              <strong>{order.delivery.address}, {order.delivery.canton}, {order.delivery.province}</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="checkout-page__layout">
        <div className="checkout-page__main">
          {/* Sección 1: Datos de la orden */}
          <section className="checkout-section" aria-labelledby="section-order-data">
            <header className="checkout-section__header">
              <span className="checkout-section__number" aria-hidden="true">1</span>
              <div className="checkout-section__header-text">
                <h2 id="section-order-data" className="checkout-section__title">Detalles de la orden</h2>
                <p className="checkout-section__description">
                  Identificador y estado del registro en la plataforma
                </p>
              </div>
            </header>
            <div className="checkout-section__body">
              <dl className="confirmation-details">
                <div className="confirmation-details__row">
                  <dt>Número de orden</dt>
                  <dd>
                    <strong>{order.orderNumber}</strong>
                    <button
                      type="button"
                      className="confirmation-copy-btn"
                      onClick={handleCopyOrderNumber}
                      title="Copiar número de orden al portapapeles"
                      aria-live="polite"
                    >
                      {copyStatus === 'copied' ? (
                        <>
                          <IconCheck size={12} strokeWidth={3} /> ¡Copiado!
                        </>
                      ) : copyStatus === 'failed' ? (
                        'No se pudo copiar'
                      ) : (
                        <>
                          <IconCopy size={12} /> Copiar
                        </>
                      )}
                    </button>
                  </dd>
                </div>
                <div className="confirmation-details__row">
                  <dt>Fecha de compra</dt>
                  <dd>{formattedDate}</dd>
                </div>
                <div className="confirmation-details__row">
                  <dt>Estado de la orden</dt>
                  <dd>
                    <span
                      className={`confirmation-badge confirmation-badge--${orderStatusBadge.tone}`}
                      title={orderStatusBadge.description}
                    >
                      {orderStatusBadge.label}
                    </span>
                  </dd>
                </div>
                <div className="confirmation-details__row">
                  <dt>Estado del pago</dt>
                  <dd>
                    <span
                      className={`confirmation-badge confirmation-badge--${paymentStatusBadge.tone}`}
                      title={paymentStatusBadge.description}
                    >
                      {paymentStatusBadge.label}
                    </span>
                  </dd>
                </div>
                <div className="confirmation-details__row">
                  <dt>Método de pago</dt>
                  <dd>
                    {order.paymentMethod
                      ? `${order.paymentMethod.brand} •••• ${order.paymentMethod.last4} (Pasarela Sandbox)`
                      : 'Tarjeta de crédito / débito (Pasarela Sandbox)'}
                  </dd>
                </div>
                {formattedUpdate && (
                  <div className="confirmation-details__row">
                    <dt>Última actualización</dt>
                    <dd>{formattedUpdate}</dd>
                  </div>
                )}
                {attemptCount > 1 && (
                  <div className="confirmation-details__row">
                    <dt>Intentos de pago</dt>
                    <dd>{attemptCount}</dd>
                  </div>
                )}
                {order.payment?.transactionId && (
                  <div className="confirmation-details__row">
                    <dt>ID de transacción</dt>
                    <dd><code>{order.payment.transactionId}</code></dd>
                  </div>
                )}
              </dl>
            </div>
          </section>

          {/* Sección 2: Comprador y entrega */}
          <section className="checkout-section" aria-labelledby="section-shipping-data">
            <header className="checkout-section__header">
              <span className="checkout-section__number" aria-hidden="true">2</span>
              <div className="checkout-section__header-text">
                <h2 id="section-shipping-data" className="checkout-section__title">Comprador y entrega</h2>
                <p className="checkout-section__description">
                  Información para contacto y coordinación del envío
                </p>
              </div>
            </header>
            <div className="checkout-section__body">
              <div className="checkout-review">
                <div className="checkout-review__group">
                  <h3 className="checkout-review__group-title">
                    <span className="checkout-review__icon" aria-hidden="true">
                      <IconUser size={12} strokeWidth={2.5} />
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
                      <IconMapPin size={12} strokeWidth={2.5} />
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

        {/* Panel lateral: Resumen de la orden */}
        <aside className="checkout-summary" aria-label="Resumen de la orden">
          <div className="checkout-summary__card">
            <header className="checkout-summary__header">
              <h2 className="checkout-summary__title">Resumen del pedido</h2>
              <span className="checkout-summary__count">
                {order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'}
              </span>
            </header>

            <ul className="checkout-summary__items">
              {order.items.map((item) => (
                <li key={item.id} className="checkout-summary__item">
                  <img
                    className="checkout-summary__image"
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                  />
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
                <strong>
                  {order.shippingCost === 0 ? 'Gratis' : formatCRC(order.shippingCost)}
                </strong>
              </div>
              <div className="checkout-summary__row checkout-summary__row--total">
                <span>{isApproved ? 'Total pagado' : 'Total a pagar'}</span>
                <strong>{formatCRC(order.total)}</strong>
              </div>
            </div>

            {/* Acciones principales y secundarias */}
            <div className="checkout-summary__actions">
              {isApproved && (
                <>
                  <Link
                    className="checkout-summary__confirm checkout-summary__confirm--link"
                    to="/productos"
                  >
                    <IconShoppingBag size={18} /> Seguir comprando
                  </Link>
                  <button
                    type="button"
                    className="checkout-summary__secondary-btn"
                    onClick={handlePrint}
                  >
                    <IconPrinter size={18} /> Imprimir comprobante
                  </button>
                </>
              )}

              {canRetry && (
                <>
                  <button
                    type="button"
                    className="checkout-summary__confirm"
                    onClick={handleRetry}
                    disabled={retrying}
                    aria-busy={retrying}
                  >
                    {retrying ? (
                      <>
                        <span className="checkout-summary__spinner" aria-hidden="true" />
                        Reintentando pago...
                      </>
                    ) : (
                      'Reintentar pago'
                    )}
                  </button>
                  {/* Si el carrito sigue con productos, el checkout conserva los
                      datos ya ingresados (borrador en sessionStorage). */}
                  {cartItems.length > 0 ? (
                    <Link className="checkout-summary__secondary-btn" to="/checkout">
                      <IconArrowLeft size={16} /> Revisar datos en el checkout
                    </Link>
                  ) : (
                    <Link className="checkout-summary__secondary-btn" to="/productos">
                      <IconArrowLeft size={16} /> Volver al catálogo
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Comprobante: oculto en pantalla, es lo único que se imprime. */}
      {isApproved && <PurchaseReceipt order={order} />}

      {/* El simulador solo tiene sentido mientras la orden admite reintentos. */}
      {canRetry && (
        <DevScenarioPanel currentScenario={scenario} onChange={setScenario} disabled={retrying} />
      )}
    </main>
  )
}

export default Confirmacion