import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { formatCRC } from '../features/catalog/format'
import { PROVINCES, CANTONS_BY_PROVINCE } from '../features/checkout/costaRicaLocations'
import {
  validateBuyerForm,
  validateDeliveryForm,
} from '../features/checkout/validation'
import { useCheckoutPersistence } from '../features/checkout/useCheckoutPersistence'
import { generateUniqueOrderNumber } from '../features/orders/orderNumber'
import { buildOrder } from '../features/orders/buildorder'
import '../styles/Checkout.css'

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
        const status =
          index < currentIndex ? 'complete' : index === currentIndex ? 'active' : 'pending'
        return (
          <div key={step.id} className={`checkout-stepper__step checkout-stepper__step--${status}`}>
            <span className="checkout-stepper__bullet" aria-hidden="true">
              {index < currentIndex ? '✓' : index + 1}
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
 *              input y mensaje de error con icono.
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
          <span aria-hidden="true">⚠</span> {error}
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
      <Field id="fullName" label="Nombre completo" error={touched.fullName && errors.fullName} required>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          value={values.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          onBlur={() => onBlur('fullName')}
          aria-invalid={Boolean(touched.fullName && errors.fullName)}
          aria-describedby={touched.fullName && errors.fullName ? 'fullName-error' : undefined}
          placeholder="Ej: María Rodríguez Solís"
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
 *              seguido de subtotal general, IVA, envío y total. Solo muestra
 *              los valores que ya calcula el carrito (no recalcula nada).
 */
function ReviewItems() {
  const { items, subtotal, iva, shippingCost, total } = useCart()

  return (
    <div className="checkout-review__group">
      <h3 className="checkout-review__group-title">
        <span className="checkout-review__icon" aria-hidden="true">✓</span>
        Productos
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
          <strong>{formatCRC(shippingCost)}</strong>
        </div>
        <div className="checkout-summary__row checkout-summary__row--total">
          <span>Total a pagar</span>
          <strong>{formatCRC(total)}</strong>
        </div>
      </div>
    </div>
  )
}

function ReviewBlock({ buyer, delivery }) {
  return (
    <div className="checkout-review">
      <ReviewItems />

      <div className="checkout-review__group">
        <h3 className="checkout-review__group-title">
          <span className="checkout-review__icon" aria-hidden="true">✓</span>
          Comprador
        </h3>
        <dl className="checkout-review__list">
          <div className="checkout-review__row">
            <dt>Nombre</dt>
            <dd>{buyer.fullName || '—'}</dd>
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
          <span className="checkout-review__icon" aria-hidden="true">✓</span>
          Entrega
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

/* ============================================================
   Panel de resumen lateral
   ============================================================ */
function CheckoutSummaryPanel({ canConfirm, onConfirm, errorMessage }) {
  const { items, subtotal, iva, shippingCost, total, itemCount } = useCart()

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
              <img className="checkout-summary__image" src={item.image} alt="" loading="lazy" />
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
            <strong>{formatCRC(shippingCost)}</strong>
          </div>
          <div className="checkout-summary__row checkout-summary__row--total">
            <span>Total</span>
            <strong>{formatCRC(total)}</strong>
          </div>
        </div>

        <button
          type="button"
          className="checkout-summary__confirm"
          onClick={onConfirm}
          disabled={!canConfirm}
          aria-disabled={!canConfirm}
        >
          Confirmar compra
        </button>

        {errorMessage && (
          <p className="checkout-field__error" role="alert">
            <span aria-hidden="true">⚠</span> {errorMessage}
          </p>
        )}

        <p className="checkout-summary__legal">
          Al confirmar aceptas nuestros términos y condiciones.
        </p>
      </div>
    </aside>
  )
}

/* ============================================================
   Página principal
   ============================================================ */

const INITIAL_BUYER = { fullName: '', email: '', phone: '' }
const INITIAL_DELIVERY = { province: '', canton: '', address: '', extraInfo: '' }

function Checkout() {
  const { items, subtotal, iva, shippingCost, total } = useCart()
  const navigate = useNavigate()

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
  const [submitError, setSubmitError] = useState('')

  const buyerErrors = useMemo(() => validateBuyerForm(buyer), [buyer])
  const deliveryErrors = useMemo(() => validateDeliveryForm(delivery), [delivery])

  const buyerIsValid = Object.keys(buyerErrors).length === 0
  const deliveryIsValid = Object.keys(deliveryErrors).length === 0
  const canConfirm = buyerIsValid && deliveryIsValid

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

  function handleConfirm() {
    setSubmitAttempted(true)
    if (!canConfirm) {
      setBuyerTouched({ fullName: true, email: true, phone: true })
      setDeliveryTouched({ province: true, canton: true, address: true, extraInfo: true })
      return
    }
    // Se genera el número único y se construye la orden (estado PENDING).
    // Las siguientes etapas (pago Sandbox) deben reutilizar esta orden.
    let order
    try {
      order = buildOrder({
        orderNumber: generateUniqueOrderNumber(),
        buyer,
        delivery,
        items,
        totals: { subtotal, iva, shippingCost, total },
      })
    } catch {
      setSubmitError('No pudimos preparar tu orden. Revisa tu carrito e intenta de nuevo.')
      return
    }
    setSubmitError('')
    clearDraft()
    navigate('/confirmacion', { state: { order } })
  }

  if (items.length === 0) {
    return (
      <main className="checkout-page checkout-page--empty">
        <div className="checkout-empty">
          <div className="checkout-empty__icon" aria-hidden="true">🛒</div>
          <h1>No hay productos para comprar</h1>
          <p>Agrega al menos un producto al carrito antes de iniciar el checkout.</p>
          <Link className="checkout-page__button" to="/productos">
            Explorar catálogo
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <header className="checkout-page__header">
        <div className="checkout-page__header-top">
          <div className="checkout-page__heading">
            <p className="checkout-page__eyebrow">Compra segura</p>
            <h1>Finalizar compra</h1>
          </div>
          <button
            type="button"
            className="checkout-page__back-button"
            onClick={() => navigate('/carrito')}
          >
            <span aria-hidden="true">←</span> Volver al carrito
          </button>
        </div>
        <CheckoutStepper currentStep="checkout" />
      </header>

      <div className="checkout-page__layout">
        <div className="checkout-page__main">
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
            description="Revisa los productos, los montos y tus datos antes de confirmar la compra."
          >
            <ReviewBlock buyer={buyer} delivery={delivery} />
          </CheckoutSection>
        </div>

        <CheckoutSummaryPanel canConfirm={canConfirm} onConfirm={handleConfirm} errorMessage={submitError} />
      </div>
    </main>
  )
}

export default Checkout