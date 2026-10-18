import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { formatCRC } from '../features/catalog/format'
import { PROVINCES, CANTONS_BY_PROVINCE } from '../features/checkout/costaRicaLocations'
import {
  buildFullName,
  validateBuyerForm,
  validateDeliveryForm,
} from '../features/checkout/validation'
import { useCheckoutPersistence } from '../features/checkout/useCheckoutPersistence'
import { resolveScenario, setScenario as persistScenario } from '../features/payment/scenarioSelector'
import { buildPaymentRequest } from '../features/payment/paymentContract'
import { requestPayment } from '../features/payment/paymentClient'
import { useWarnBeforeLeave } from '../features/payment/useWarnBeforeLeave'
import { generateUniqueOrderNumber } from '../features/orders/orderNumber'
import { buildOrder } from '../features/orders/buildOrder'
import { saveOrder } from '../features/orders/orderStorage'
import { applyPaymentResult } from '../features/orders/applyPaymentResult'
import { PAYMENT_RESULT } from '../features/payment/paymentContract'
import DevScenarioPanel from '../components/DevScenarioPanel'
import '../styles/Checkout.css'

/* ============================================================
   Iconos SVG en línea (estilo consistente y accesible)
   ============================================================ */

function IconCheck({ size = 18, className = '', strokeWidth = 2.5 }) {
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

function IconAlertTriangle({ size = 16, className = '', strokeWidth = 2 }) {
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

function IconUser({ size = 16, className = '', strokeWidth = 2 }) {
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

function IconMapPin({ size = 16, className = '', strokeWidth = 2 }) {
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

function IconPackage({ size = 16, className = '', strokeWidth = 2 }) {
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
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function IconCartEmpty({ size = 56, className = '' }) {
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
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}

function IconLock({ size = 14, className = '', strokeWidth = 2 }) {
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

/* ============================================================
   Subcomponentes de presentación
   ============================================================ */

/**
 * Nombre: CheckoutStepper
 * Descripción: Indicador de progreso tipo stepper horizontal con línea
 *              conectora, integrado visualmente al header del checkout.
 */
function CheckoutStepper({ currentStep = 'checkout' }) {
  const steps = [
    { id: 'cart', label: 'Carrito' },
    { id: 'checkout', label: 'Checkout' },
    { id: 'confirmation', label: 'Confirmación' },
  ]
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <nav className="checkout-stepper" aria-label="Progreso de la compra">
      {steps.map((step, index) => {
        const isDone = index < currentIndex
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

/**
 * Nombre: CheckoutSection
 * Descripción: Contenedor semántico con estilo card, header alineado a la
 *              izquierda y línea divisoria.
 */
function CheckoutSection({ number, title, description, children }) {
  return (
    <section className="checkout-section" aria-labelledby={`checkout-section-${number}`}>
      <header className="checkout-section__header">
        <span className="checkout-section__number" aria-hidden="true">
          {number}
        </span>
        <div className="checkout-section__header-text">
          <h2 id={`checkout-section-${number}`} className="checkout-section__title">
            {title}
          </h2>
          {description && <p className="checkout-section__description">{description}</p>}
        </div>
      </header>
      <div className="checkout-section__body">{children}</div>
    </section>
  )
}

/**
 * Nombre: Field
 * Descripción: Campo de formulario con label alineado a la izquierda,
 *              input y mensaje de error con icono SVG accesible.
 */
function Field({ id, label, error, required = false, children }) {
  return (
    <div className={`checkout-field${error ? ' checkout-field--error' : ''}`}>
      <label htmlFor={id} className="checkout-field__label">
        {label}
        {required && <span className="checkout-field__required" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="checkout-field__error" role="alert">
          <IconAlertTriangle size={14} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  )
}

/* ============================================================
   Formulario del comprador
   ============================================================ */

function BuyerForm({ values, errors, touched, onChange, onBlur }) {
  return (
    <div className="checkout-form">
      <Field id="firstName" label="Nombre" error={touched.firstName && errors.firstName} required>
        <input
          id="firstName"
          name="firstName"
          type="text"
          autoComplete="given-name"
          maxLength={60}
          value={values.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          onBlur={() => onBlur('firstName')}
          aria-invalid={Boolean(touched.firstName && errors.firstName)}
          aria-describedby={touched.firstName && errors.firstName ? 'firstName-error' : undefined}
          placeholder="Ej: María"
          className="checkout-field__input"
        />
      </Field>

      <Field id="lastName" label="Apellidos" error={touched.lastName && errors.lastName} required>
        <input
          id="lastName"
          name="lastName"
          type="text"
          autoComplete="family-name"
          maxLength={60}
          value={values.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          onBlur={() => onBlur('lastName')}
          aria-invalid={Boolean(touched.lastName && errors.lastName)}
          aria-describedby={touched.lastName && errors.lastName ? 'lastName-error' : undefined}
          placeholder="Ej: Rodríguez Solís"
          className="checkout-field__input"
        />
      </Field>

      <Field id="email" label="Correo electrónico" error={touched.email && errors.email} required>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => onChange('email', e.target.value)}
          onBlur={() => onBlur('email')}
          aria-invalid={Boolean(touched.email && errors.email)}
          aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
          placeholder="correo@ejemplo.com"
          className="checkout-field__input"
        />
      </Field>

      <Field id="phone" label="Teléfono" error={touched.phone && errors.phone} required>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          onBlur={() => onBlur('phone')}
          aria-invalid={Boolean(touched.phone && errors.phone)}
          aria-describedby={touched.phone && errors.phone ? 'phone-error' : undefined}
          placeholder="8888-8888"
          className="checkout-field__input"
        />
      </Field>
    </div>
  )
}

/* ============================================================
   Formulario de entrega
   ============================================================ */

function DeliveryForm({ values, errors, touched, onChange, onBlur }) {
  const cantons = values.province ? CANTONS_BY_PROVINCE[values.province] || [] : []

  return (
    <div className="checkout-form">
      <Field id="province" label="Provincia" error={touched.province && errors.province} required>
        <select
          id="province"
          name="province"
          value={values.province}
          onChange={(e) => onChange('province', e.target.value)}
          onBlur={() => onBlur('province')}
          aria-invalid={Boolean(touched.province && errors.province)}
          aria-describedby={touched.province && errors.province ? 'province-error' : undefined}
          className="checkout-field__input checkout-field__select"
        >
          <option value="">Selecciona una provincia</option>
          {PROVINCES.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </Field>

      <Field id="canton" label="Cantón" error={touched.canton && errors.canton} required>
        <select
          id="canton"
          name="canton"
          value={values.canton}
          onChange={(e) => onChange('canton', e.target.value)}
          onBlur={() => onBlur('canton')}
          disabled={!values.province}
          aria-invalid={Boolean(touched.canton && errors.canton)}
          aria-describedby={touched.canton && errors.canton ? 'canton-error' : undefined}
          className="checkout-field__input checkout-field__select"
        >
          <option value="">
            {values.province ? 'Selecciona un cantón' : 'Primero selecciona una provincia'}
          </option>
          {cantons.map((canton) => (
            <option key={canton} value={canton}>
              {canton}
            </option>
          ))}
        </select>
      </Field>

      <Field id="address" label="Dirección exacta" error={touched.address && errors.address} required>
        <textarea
          id="address"
          name="address"
          maxLength={250}
          rows={3}
          value={values.address}
          onChange={(e) => onChange('address', e.target.value)}
          onBlur={() => onBlur('address')}
          aria-invalid={Boolean(touched.address && errors.address)}
          aria-describedby={touched.address && errors.address ? 'address-error' : undefined}
          placeholder="Ej: 200 metros norte de la iglesia, casa esquinera color blanco"
          className="checkout-field__input checkout-field__textarea"
        />
      </Field>

      <Field
        id="extraInfo"
        label="Información adicional (opcional)"
        error={touched.extraInfo && errors.extraInfo}
      >
        <textarea
          id="extraInfo"
          name="extraInfo"
          maxLength={300}
          rows={2}
          value={values.extraInfo}
          onChange={(e) => onChange('extraInfo', e.target.value)}
          onBlur={() => onBlur('extraInfo')}
          aria-invalid={Boolean(touched.extraInfo && errors.extraInfo)}
          aria-describedby={touched.extraInfo && errors.extraInfo ? 'extraInfo-error' : undefined}
          placeholder="Instrucciones para el repartidor, horario preferido, etc."
          className="checkout-field__input checkout-field__textarea"
        />
      </Field>
    </div>
  )
}

/* ============================================================
   Revisión final
   ============================================================ */

/**
 * Nombre: ReviewItems
 * Descripción: Detalle de productos de la compra para la revisión final:
 *              producto, cantidad, precio unitario y subtotal por producto,
 *              seguido de subtotal general, IVA, envío y total.
 */
function ReviewItems() {
  // Solo los productos seleccionados en el carrito forman parte de la compra.
  const { selectedItems: items, subtotal, iva, shippingCost, total } = useCart()

  return (
    <div className="checkout-review__group">
      <h3 className="checkout-review__group-title">
        <span className="checkout-review__icon" aria-hidden="true">
          <IconPackage size={12} strokeWidth={2.5} />
        </span>
        Productos ({items.length})
      </h3>

      <table className="checkout-review__table">
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col">Cantidad</th>
            <th scope="col">Precio unitario</th>
            <th scope="col">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <th scope="row" data-label="Producto">{item.name}</th>
              <td data-label="Cantidad">{item.quantity}</td>
              <td data-label="Precio unitario">{formatCRC(item.price)}</td>
              <td data-label="Subtotal">{formatCRC(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="checkout-review__totals">
        <div className="checkout-summary__row">
          <span>Subtotal</span>
          <strong>{formatCRC(subtotal)}</strong>
        </div>
        <div className="checkout-summary__row">
          <span>IVA (13%)</span>
          <strong>{formatCRC(iva)}</strong>
        </div>
        <div className="checkout-summary__row">
          <span>Costo de envío</span>
          <strong>{shippingCost === 0 ? 'Gratis' : formatCRC(shippingCost)}</strong>
        </div>
        <div className="checkout-summary__row checkout-summary__row--total">
          <span>Total a pagar</span>
          <strong>{formatCRC(total)}</strong>
        </div>
      </div>
    </div>
  )
}

function ReviewBlock({ buyer, delivery, buyerIsValid, deliveryIsValid }) {
  return (
    <div className="checkout-review">
      <ReviewItems />

      <div className="checkout-review__group">
        <h3 className="checkout-review__group-title">
          <span className="checkout-review__icon" aria-hidden="true">
            <IconUser size={12} strokeWidth={2.5} />
          </span>
          Comprador
          {buyerIsValid && (
            <span
              className="confirmation-badge confirmation-badge--success"
              style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '0.1rem 0.5rem' }}
            >
              Completado
            </span>
          )}
        </h3>
        <dl className="checkout-review__list">
          <div className="checkout-review__row">
            <dt>Nombre</dt>
            <dd>{buildFullName(buyer) || '—'}</dd>
          </div>
          <div className="checkout-review__row">
            <dt>Correo</dt>
            <dd>{buyer.email || '—'}</dd>
          </div>
          <div className="checkout-review__row">
            <dt>Teléfono</dt>
            <dd>{buyer.phone || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="checkout-review__group">
        <h3 className="checkout-review__group-title">
          <span className="checkout-review__icon" aria-hidden="true">
            <IconMapPin size={12} strokeWidth={2.5} />
          </span>
          Entrega
          {deliveryIsValid && (
            <span
              className="confirmation-badge confirmation-badge--success"
              style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '0.1rem 0.5rem' }}
            >
              Completado
            </span>
          )}
        </h3>
        <dl className="checkout-review__list">
          <div className="checkout-review__row">
            <dt>Provincia</dt>
            <dd>{delivery.province || '—'}</dd>
          </div>
          <div className="checkout-review__row">
            <dt>Cantón</dt>
            <dd>{delivery.canton || '—'}</dd>
          </div>
          <div className="checkout-review__row">
            <dt>Dirección</dt>
            <dd>{delivery.address || '—'}</dd>
          </div>
          {delivery.extraInfo && (
            <div className="checkout-review__row">
              <dt>Info. adicional</dt>
              <dd>{delivery.extraInfo}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}

function CheckoutSummaryPanel({
  canConfirm,
  onConfirm,
  processing,
  processingStage,
  submitAttempted,
  missingCount,
}) {
  const { selectedItems: items, subtotal, iva, shippingCost, total, selectedItemCount: itemCount } = useCart()

  return (
    <aside className="checkout-summary" aria-label="Resumen de la orden">
      <div className="checkout-summary__card">
        <header className="checkout-summary__header">
          <h2 className="checkout-summary__title">Resumen de la orden</h2>
          <span className="checkout-summary__count">
            {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
          </span>
        </header>

        <ul className="checkout-summary__items">
          {items.map((item) => (
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
                  Cant: {item.quantity} × {formatCRC(item.price)}
                </p>
              </div>
              <strong className="checkout-summary__item-subtotal">
                {formatCRC(item.price * item.quantity)}
              </strong>
            </li>
          ))}
        </ul>

        <div className="checkout-summary__totals">
          <div className="checkout-summary__row">
            <span>Subtotal</span>
            <strong>{formatCRC(subtotal)}</strong>
          </div>
          <div className="checkout-summary__row">
            <span>IVA (13%)</span>
            <strong>{formatCRC(iva)}</strong>
          </div>
          <div className="checkout-summary__row">
            <span>Envío</span>
            <strong>{shippingCost === 0 ? 'Gratis' : formatCRC(shippingCost)}</strong>
          </div>
          <div className="checkout-summary__row checkout-summary__row--total">
            <span>Total a pagar</span>
            <strong>{formatCRC(total)}</strong>
          </div>
        </div>

        {submitAttempted && !canConfirm && missingCount > 0 && (
          <p className="checkout-summary__notice" role="alert">
            <IconAlertTriangle size={14} /> {missingCount === 1 ? 'Hay 1 campo' : `Hay ${missingCount} campos`}{' '}
            por completar o corregir
          </p>
        )}

        <button
          type="button"
          className="checkout-summary__confirm"
          onClick={onConfirm}
          disabled={processing}
          aria-busy={processing}
        >
          {processing ? (
            <>
              <span className="checkout-summary__spinner" aria-hidden="true" />
              {processingStage === 'building'
                ? 'Preparando orden...'
                : processingStage === 'paying'
                  ? 'Procesando pago seguro...'
                  : 'Procesando...'}
            </>
          ) : (
            'Confirmar compra'
          )}
        </button>

        <div className="checkout-summary__trust">
          <IconLock size={14} />
          <span>Pago 100% cifrado y seguro (Sandbox)</span>
        </div>

        <p className="checkout-summary__legal">
          Al confirmar aceptas nuestros términos y condiciones de compra.
        </p>
      </div>
    </aside>
  )
}

/* ============================================================
   Página principal
   ============================================================ */

const INITIAL_BUYER = { firstName: '', lastName: '', email: '', phone: '' }
const INITIAL_DELIVERY = { province: '', canton: '', address: '', extraInfo: '' }
// Orden visual de los campos; se usa para enfocar el primer error.
const FIELD_ORDER = ['firstName', 'lastName', 'email', 'phone', 'province', 'canton', 'address', 'extraInfo']

function Checkout() {
  // `items` son solo los productos seleccionados para esta compra; `cartItems`
  // es el carrito completo (para distinguir "carrito vacío" de "nada elegido").
  const { selectedItems: items, items: cartItems, subtotal, iva, shippingCost, total, removeItems } = useCart()
  const submittingRef = useRef(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [scenario, setScenarioState] = useState(() => {
    const resolved = resolveScenario(searchParams.get('scenario'))
    if (searchParams.get('scenario')) {
      persistScenario(resolved)
    }
    return resolved
  })

  function handleScenarioChange(newScenario) {
    setScenarioState(newScenario)
  }

  const { buyerInitial, deliveryInitial, saveDraft, clearDraft } = useCheckoutPersistence(
    INITIAL_BUYER,
    INITIAL_DELIVERY,
    { enabled: items.length > 0 }
  )

  const [buyer, setBuyer] = useState(buyerInitial)
  const [delivery, setDelivery] = useState(deliveryInitial)
  const [buyerTouched, setBuyerTouched] = useState({})
  const [deliveryTouched, setDeliveryTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  // Si el usuario intenta recargar o cerrar mientras se paga, se le advierte.
  useWarnBeforeLeave(processing)

  const buyerErrors = useMemo(() => validateBuyerForm(buyer), [buyer])
  const deliveryErrors = useMemo(() => validateDeliveryForm(delivery), [delivery])

  const buyerIsValid = Object.keys(buyerErrors).length === 0
  const deliveryIsValid = Object.keys(deliveryErrors).length === 0
  const canConfirm = buyerIsValid && deliveryIsValid && !processing

  const missingCount = Object.keys(buyerErrors).length + Object.keys(deliveryErrors).length

  useEffect(() => {
    if (items.length === 0) return
    saveDraft(buyer, delivery)
  }, [buyer, delivery, items.length, saveDraft])

  useEffect(() => {
    if (items.length === 0) {
      clearDraft()
    }
  }, [items.length, clearDraft])

  function handleBuyerChange(field, value) {
    setBuyer((prev) => ({ ...prev, [field]: value }))
  }

  function handleDeliveryChange(field, value) {
    setDelivery((prev) => {
      if (field === 'province') {
        return { ...prev, province: value, canton: '' }
      }
      return { ...prev, [field]: value }
    })
  }

  function handleBuyerBlur(field) {
    setBuyerTouched((prev) => ({ ...prev, [field]: true }))
  }

  function handleDeliveryBlur(field) {
    setDeliveryTouched((prev) => ({ ...prev, [field]: true }))
  }

  /**
   * Nombre: focusFirstInvalidField
   * Descripción: Lleva al usuario al primer campo con error (en el orden en
   *              que aparecen en pantalla) para que sepa qué corregir.
   */
  function focusFirstInvalidField() {
    const firstInvalid = FIELD_ORDER.find((field) => buyerErrors[field] || deliveryErrors[field])
    const element = firstInvalid ? document.getElementById(firstInvalid) : null
    if (element) {
      element.focus({ preventScroll: true })
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  /**
   * Nombre: finishWithError
   * Descripción: Libera el bloqueo de envío y muestra un mensaje comprensible.
   */
  function finishWithError(message) {
    submittingRef.current = false
    setProcessing(false)
    setProcessingStage(null)
    setSubmitError(message)
  }

  /**
   * Nombre: handleConfirm
   * Descripción: Flujo completo al confirmar la compra:
   *                1. Valida los formularios (si hay errores, no avanza).
   *                2. Construye y guarda la orden en estado PENDING.
   *                3. Envía la solicitud de pago al Sandbox.
   *                4. Aplica el resultado a la orden (applyPaymentResult).
   *                5. Si el pago fue aprobado, vacía el carrito.
   *                6. Navega a la confirmación, que muestra el resultado.
   *              submittingRef evita que un doble clic rápido (antes de que
   *              React vuelva a renderizar el botón deshabilitado) cree dos
   *              órdenes o dos cobros.
   */
  async function handleConfirm() {
    if (submittingRef.current) return

    setSubmitAttempted(true)
    setSubmitError(null)

    if (!buyerIsValid || !deliveryIsValid) {
      setBuyerTouched({ firstName: true, lastName: true, email: true, phone: true })
      setDeliveryTouched({ province: true, canton: true, address: true, extraInfo: true })
      focusFirstInvalidField()
      return
    }

    submittingRef.current = true
    setProcessing(true)
    setProcessingStage('building')

    let order
    try {
      const orderNumber = generateUniqueOrderNumber()
      order = buildOrder({
        orderNumber,
        // La orden guarda el nombre completo (nombre + apellidos) como pide
        // el enunciado; el formulario los pide por separado.
        buyer: { fullName: buildFullName(buyer), email: buyer.email, phone: buyer.phone },
        delivery,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
        })),
        totals: { subtotal, iva, shippingCost, total },
      })
    } catch {
      finishWithError('Hubo un problema al preparar tu compra. Revisa los datos e inténtalo de nuevo.')
      return
    }

    if (!saveOrder(order)) {
      finishWithError('No pudimos registrar tu orden. Inténtalo de nuevo en unos segundos.')
      return
    }

    setProcessingStage('paying')
    // requestPayment nunca rechaza: cualquier falla llega como PAYMENT_ERROR.
    const paymentResponse = await requestPayment(buildPaymentRequest(order, scenario))

    if (!applyPaymentResult(order.orderNumber, paymentResponse)) {
      finishWithError(
        'No pudimos actualizar el estado de tu orden. Revisa tu conexión e inténtalo de nuevo.'
      )
      return
    }

    // Solo una compra aprobada quita del carrito los productos comprados y
    // descarta el borrador; los no seleccionados siguen en el carrito. Si el
    // pago fue rechazado o falló, el usuario conserva todo para reintentar.
    if (paymentResponse.result === PAYMENT_RESULT.APPROVED) {
      clearDraft()
      removeItems(order.items.map((item) => item.id))
    }

    submittingRef.current = false
    setProcessing(false)
    setProcessingStage(null)
    navigate('/confirmacion', {
      state: { orderNumber: order.orderNumber, scenario },
    })
  }

  if (items.length === 0) {
    return (
      <main className="checkout-page checkout-page--empty">
        <div className="checkout-empty">
          <div className="checkout-empty__icon" aria-hidden="true">
            <IconCartEmpty size={60} />
          </div>
          <h1>No hay productos para comprar</h1>
          {cartItems.length === 0 ? (
            <p>
              Tu carrito está vacío, por eso no puedes continuar con la compra. Agrega al
              menos un producto al carrito antes de iniciar el checkout.
            </p>
          ) : (
            <p>
              Tienes productos en el carrito, pero ninguno está seleccionado para comprar.
              Vuelve al carrito y marca los productos que quieres incluir.
            </p>
          )}
          <div className="checkout-empty__actions">
            <Link className="checkout-page__button" to="/productos">
              Explorar catálogo
            </Link>
            <Link className="checkout-empty__link" to="/carrito">
              Ver mi carrito
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <header className="checkout-page__header">
        <div className="checkout-page__header-top">
          <div className="checkout-page__heading">
            <p className="checkout-page__eyebrow">Paso 2 de 3 · Compra segura</p>
            <h1>Finalizar compra</h1>
          </div>
          <button
            type="button"
            className="checkout-page__back-button"
            onClick={() => navigate('/carrito')}
            disabled={processing}
          >
            <IconArrowLeft size={16} aria-hidden="true" /> Volver al carrito
          </button>
        </div>
        <CheckoutStepper currentStep="checkout" />
      </header>

      {submitError && (
        <div className="checkout-page__error-banner" role="alert">
          <IconAlertTriangle size={18} aria-hidden="true" /> {submitError}
        </div>
      )}

      <div className="checkout-page__layout">
        {/* Mientras se procesa el pago los datos quedan bloqueados para que la
            orden enviada coincida con lo que el usuario ve en pantalla. */}
        <fieldset className="checkout-page__main checkout-page__fieldset" disabled={processing}>
          <legend className="visually-hidden">Datos de la compra</legend>
          <CheckoutSection
            number={1}
            title="Información del comprador"
            description="Usaremos estos datos para contactarte sobre tu pedido."
          >
            <BuyerForm
              values={buyer}
              errors={buyerErrors}
              touched={buyerTouched}
              onChange={handleBuyerChange}
              onBlur={handleBuyerBlur}
            />
          </CheckoutSection>

          <CheckoutSection
            number={2}
            title="Información de entrega"
            description="Indícanos dónde quieres recibir tu pedido."
          >
            <DeliveryForm
              values={delivery}
              errors={deliveryErrors}
              touched={deliveryTouched}
              onChange={handleDeliveryChange}
              onBlur={handleDeliveryBlur}
            />
          </CheckoutSection>

          <CheckoutSection
            number={3}
            title="Revisión final"
            description="Revisa que todo esté correcto antes de confirmar el pago."
          >
            <ReviewBlock
              buyer={buyer}
              delivery={delivery}
              buyerIsValid={buyerIsValid}
              deliveryIsValid={deliveryIsValid}
            />
          </CheckoutSection>
        </fieldset>

        <CheckoutSummaryPanel
          canConfirm={canConfirm}
          onConfirm={handleConfirm}
          processing={processing}
          processingStage={processingStage}
          submitAttempted={submitAttempted}
          missingCount={missingCount}
        />
      </div>

      <DevScenarioPanel currentScenario={scenario} onChange={handleScenarioChange} disabled={processing} />
    </main>
  )
}

export default Checkout