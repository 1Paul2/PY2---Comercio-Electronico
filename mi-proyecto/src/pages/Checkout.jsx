import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { useSession } from '../context/useSession'
import { formatCRC } from '../features/catalog/format'
import { PROVINCES, CANTONS_BY_PROVINCE } from '../features/checkout/costaRicaLocations'
import {
  buildFullName,
  detectCardBrand,
  formatCardExpiry,
  formatCardNumber,
  maskCard,
  validateBuyerForm,
  validateDeliveryForm,
  validatePaymentForm,
} from '../features/checkout/validation'
import { useCheckoutPersistence } from '../features/checkout/useCheckoutPersistence'
import { resolveScenario, setScenario as persistScenario } from '../features/payment/scenarioSelector'
import { buildPaymentRequest } from '../features/payment/paymentContract'
import { requestPayment } from '../features/payment/paymentClient'
import { useWarnBeforeLeave } from '../features/payment/useWarnBeforeLeave'
import { generateUniqueOrderNumber } from '../features/orders/orderNumber'
import { buildOrder } from '../features/orders/buildOrder'
import { TERMS_VERSION } from '../features/policies/policyPages'
import { saveOrder } from '../features/orders/orderStorage'
import { applyPaymentResult } from '../features/orders/applyPaymentResult'
import { PAYMENT_RESULT } from '../features/payment/paymentContract'
import DevScenarioPanel from '../components/DevScenarioPanel'
import { EVENT_TYPES, trackEvent } from '../features/activity/activityLog'
import { AVAILABILITY_STATUS, BRANCHES, checkBranchAvailability, getBranch } from '../features/inventory/branches'
import { formatB2BConditions, PRICE_TYPES } from '../features/pricing/pricing'
import { ROLE_INFO } from '../features/session/roles'
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
   Sucursal y disponibilidad (proyecto 3)
   ============================================================ */

const BRANCH_STORAGE_KEY = 'maquinaria-cr-checkout-branch'

/**
 * Nombre: readSavedBranch
 * Descripción: Recupera la última sucursal elegida en este navegador.
 * Salidas: id de sucursal válido o '' si no hay.
 */
function readSavedBranch() {
  try {
    const saved = localStorage.getItem(BRANCH_STORAGE_KEY)
    return getBranch(saved) ? saved : ''
  } catch {
    return ''
  }
}

const AVAILABILITY_LABELS = {
  [AVAILABILITY_STATUS.OK]: 'Disponible',
  [AVAILABILITY_STATUS.INSUFFICIENT]: 'Stock insuficiente',
  [AVAILABILITY_STATUS.UNAVAILABLE]: 'No disponible en esta sucursal',
}

/**
 * Nombre: BranchSelector
 * Descripción: Permite elegir la sucursal de retiro o despacho y muestra,
 *              para la sucursal elegida, cuántas unidades hay de cada
 *              producto frente a las que se piden. Si se pide más de lo que
 *              hay o la sucursal no tiene el producto, lo explica.
 * Entradas: items: productos seleccionados; branchId: sucursal elegida;
 *           onChange(id): cambia la sucursal; error: mensaje si falta elegir.
 * Salidas: JSX.
 * Excepciones: No hay.
 */
function BranchSelector({ items, branchId, onChange, error }) {
  const availability = branchId ? checkBranchAvailability(items, branchId) : null

  return (
    <div className="checkout-branch">
      <div className="checkout-branch__options" role="radiogroup" aria-label="Sucursal" aria-invalid={Boolean(error)}>
        {BRANCHES.map((branch) => {
          const summary = checkBranchAvailability(items, branch.id)
          const isSelected = branch.id === branchId
          return (
            <label
              key={branch.id}
              className={`checkout-branch__option${isSelected ? ' is-selected' : ''}${summary.allAvailable ? '' : ' has-issues'}`}
            >
              <input
                type="radio"
                name="branch"
                id={`branch-${branch.id}`}
                aria-label={`${branch.name}: ${summary.availableCount} de ${items.length} disponibles`}
                value={branch.id}
                checked={isSelected}
                onChange={() => onChange(branch.id)}
              />
              <span className="checkout-branch__name">{branch.name}</span>
              <span className="checkout-branch__address">{branch.address}</span>
              <span className={`checkout-branch__count${summary.allAvailable ? ' is-ok' : ''}`}>
                {summary.availableCount} de {items.length} {items.length === 1 ? 'producto disponible' : 'productos disponibles'}
              </span>
            </label>
          )
        })}
      </div>

      {error && (
        <p id="branch-error" className="checkout-field__error" role="alert">
          <IconAlertTriangle size={14} aria-hidden="true" /> {error}
        </p>
      )}

      {availability && (
        <div className="checkout-branch__availability">
          <h3 className="checkout-branch__title">
            Sucursal seleccionada: <strong>{getBranch(branchId).name}</strong>
          </h3>
          <ul className="checkout-branch__list">
            {availability.lines.map((line) => (
              <li key={line.id} className={`checkout-branch__line checkout-branch__line--${line.status}`}>
                <span className="checkout-branch__product">{line.name}</span>
                <span className="checkout-branch__numbers">
                  Disponible: {line.available} {line.available === 1 ? 'unidad' : 'unidades'} · Cantidad: {line.requested}
                </span>
                <span className="checkout-branch__status">{AVAILABILITY_LABELS[line.status]}</span>
                {line.message && <p className="checkout-branch__message">{line.message}</p>}
              </li>
            ))}
          </ul>
        </div>
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
   Formulario de pago (simulado)
   ============================================================ */

/**
 * Nombre: PaymentForm
 * Descripción: Datos de la tarjeta para el pago Sandbox. Es una simulación:
 *              los datos no salen del navegador, no se guardan en el
 *              borrador ni en la orden (solo marca y últimos 4 dígitos).
 */
function PaymentForm({ values, errors, touched, onChange, onBlur }) {
  const brand = detectCardBrand(values.cardNumber)
  const isAmex = brand === 'American Express'

  return (
    <>
      <p className="checkout-payment__notice">
        <IconLock size={14} />
        <span>
          Pago simulado (Sandbox): no se realiza ningún cargo real. Puedes usar la tarjeta de
          prueba <strong>4242 4242 4242 4242</strong> con cualquier fecha futura y CVV 123.
        </span>
      </p>

      <div className="checkout-form">
        <Field id="cardName" label="Nombre del titular" error={touched.cardName && errors.cardName} required>
          <input
            id="cardName"
            name="cardName"
            type="text"
            autoComplete="cc-name"
            maxLength={60}
            value={values.cardName}
            onChange={(e) => onChange('cardName', e.target.value)}
            onBlur={() => onBlur('cardName')}
            aria-invalid={Boolean(touched.cardName && errors.cardName)}
            aria-describedby={touched.cardName && errors.cardName ? 'cardName-error' : undefined}
            placeholder="Como aparece en la tarjeta"
            className="checkout-field__input"
          />
        </Field>

        <Field id="cardNumber" label="Número de tarjeta" error={touched.cardNumber && errors.cardNumber} required>
          <div className="checkout-payment__number">
            <input
              id="cardNumber"
              name="cardNumber"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={values.cardNumber}
              onChange={(e) => onChange('cardNumber', formatCardNumber(e.target.value))}
              onBlur={() => onBlur('cardNumber')}
              aria-invalid={Boolean(touched.cardNumber && errors.cardNumber)}
              aria-describedby={touched.cardNumber && errors.cardNumber ? 'cardNumber-error' : undefined}
              placeholder="0000 0000 0000 0000"
              className="checkout-field__input"
            />
            {brand && <span className="checkout-payment__brand">{brand}</span>}
          </div>
        </Field>

        <Field id="cardExpiry" label="Vencimiento (MM/AA)" error={touched.cardExpiry && errors.cardExpiry} required>
          <input
            id="cardExpiry"
            name="cardExpiry"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            maxLength={5}
            value={values.cardExpiry}
            onChange={(e) => onChange('cardExpiry', formatCardExpiry(e.target.value))}
            onBlur={() => onBlur('cardExpiry')}
            aria-invalid={Boolean(touched.cardExpiry && errors.cardExpiry)}
            aria-describedby={touched.cardExpiry && errors.cardExpiry ? 'cardExpiry-error' : undefined}
            placeholder="MM/AA"
            className="checkout-field__input"
          />
        </Field>

        <Field id="cardCvv" label="Código de seguridad (CVV)" error={touched.cardCvv && errors.cardCvv} required>
          <input
            id="cardCvv"
            name="cardCvv"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={isAmex ? 4 : 3}
            value={values.cardCvv}
            onChange={(e) => onChange('cardCvv', e.target.value.replace(/\D/g, ''))}
            onBlur={() => onBlur('cardCvv')}
            aria-invalid={Boolean(touched.cardCvv && errors.cardCvv)}
            aria-describedby={touched.cardCvv && errors.cardCvv ? 'cardCvv-error' : undefined}
            placeholder={isAmex ? '4 dígitos' : '3 dígitos'}
            className="checkout-field__input"
          />
        </Field>
      </div>
    </>
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
  const isB2B = items[0]?.priceType === PRICE_TYPES.B2B

  return (
    <div className="checkout-review__group">
      <h3 className="checkout-review__group-title">
        <span className="checkout-review__icon" aria-hidden="true">
          <IconPackage size={12} strokeWidth={2.5} />
        </span>
        Productos ({items.length})
        <span className={`checkout-price-tag checkout-price-tag--${isB2B ? 'b2b' : 'b2c'}`}>
          {isB2B ? 'Precio B2B' : 'Precio B2C'}
        </span>
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
              <th scope="row" data-label="Producto">
                {item.name}
                {isB2B && formatB2BConditions(item.minQuantity, item.volumeDiscounts) && (
                  <span className="checkout-review__conditions">
                    {formatB2BConditions(item.minQuantity, item.volumeDiscounts)}
                  </span>
                )}
              </th>
              <td data-label="Cantidad">{item.quantity}</td>
              <td data-label="Precio unitario">
                {item.discountPct > 0 && <s className="checkout-review__list-price">{formatCRC(item.basePrice)}</s>}{' '}
                {formatCRC(item.unitPrice)}
                {item.discountPct > 0 && (
                  <span className="checkout-review__discount">−{Math.round(item.discountPct * 100)}%</span>
                )}
              </td>
              <td data-label="Subtotal">{formatCRC(item.unitPrice * item.quantity)}</td>
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

function ReviewBlock({ session, branchId, buyer, delivery, payment, buyerIsValid, deliveryIsValid, paymentIsValid }) {
  const card = paymentIsValid ? maskCard(payment.cardNumber) : null
  const branch = getBranch(branchId)
  return (
    <div className="checkout-review">
      <ReviewItems />

      <div className="checkout-review__group">
        <h3 className="checkout-review__group-title">
          <span className="checkout-review__icon" aria-hidden="true">
            <IconUser size={12} strokeWidth={2.5} />
          </span>
          Cliente y sucursal
        </h3>
        <dl className="checkout-review__list">
          <div className="checkout-review__row">
            <dt>Usuario</dt>
            <dd>{session?.name ?? '—'}</dd>
          </div>
          <div className="checkout-review__row">
            <dt>Tipo de cliente</dt>
            <dd>{ROLE_INFO[session?.role]?.label ?? '—'}</dd>
          </div>
          {session?.company && (
            <div className="checkout-review__row">
              <dt>Empresa</dt>
              <dd>
                {session.company.name}
                {session.company.legalId ? ` · Cédula ${session.company.legalId}` : ''}
              </dd>
            </div>
          )}
          <div className="checkout-review__row">
            <dt>Sucursal</dt>
            <dd>{branch ? branch.name : 'Sin elegir'}</dd>
          </div>
        </dl>
      </div>

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

      <div className="checkout-review__group">
        <h3 className="checkout-review__group-title">
          <span className="checkout-review__icon" aria-hidden="true">
            <IconLock size={12} strokeWidth={2.5} />
          </span>
          Pago
          {paymentIsValid && (
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
            <dt>Tarjeta</dt>
            <dd>{card ? `${card.brand} •••• ${card.last4}` : '—'}</dd>
          </div>
          <div className="checkout-review__row">
            <dt>Titular</dt>
            <dd>{payment.cardName.trim() || '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function CheckoutSummaryPanel({
  branchId,
  purchaseIssues,
  canConfirm,
  onConfirm,
  processing,
  processingStage,
  submitAttempted,
  missingCount,
  termsAccepted,
  termsError,
  onTermsChange,
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
                  Cant: {item.quantity} × {formatCRC(item.unitPrice)}
                  {item.priceType === PRICE_TYPES.B2B ? ' · B2B' : ''}
                </p>
              </div>
              <strong className="checkout-summary__item-subtotal">
                {formatCRC(item.unitPrice * item.quantity)}
              </strong>
            </li>
          ))}
        </ul>

        <p className="checkout-summary__branch">
          <IconMapPin size={14} aria-hidden="true" /> Sucursal:{' '}
          <strong>{getBranch(branchId)?.name ?? 'sin elegir'}</strong>
        </p>

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

        {purchaseIssues.length > 0 && (
          <div className="checkout-summary__issues" role="alert">
            <p>
              <IconAlertTriangle size={14} aria-hidden="true" /> No se puede completar la compra todavía:
            </p>
            <ul>
              {purchaseIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {submitAttempted && !canConfirm && missingCount > 0 && (
          <p className="checkout-summary__notice" role="alert">
            <IconAlertTriangle size={14} /> {missingCount === 1 ? 'Hay 1 campo' : `Hay ${missingCount} campos`}{' '}
            por completar o corregir
          </p>
        )}

        {/* El cliente debe aceptar los términos antes de pagar; el enlace se
            abre en otra pestaña para no perder lo escrito en el formulario. */}
        <div className={`checkout-terms${termsError ? ' checkout-terms--error' : ''}`}>
          <label className="checkout-terms__label" htmlFor="termsAccepted">
            <input
              id="termsAccepted"
              type="checkbox"
              className="checkout-terms__checkbox"
              checked={termsAccepted}
              onChange={(event) => onTermsChange(event.target.checked)}
              disabled={processing}
              aria-invalid={Boolean(termsError)}
              aria-describedby={termsError ? 'termsAccepted-error' : undefined}
            />
            <span>
              He leído y acepto los{' '}
              <Link to="/terminos" target="_blank" rel="noopener noreferrer">
                términos y condiciones
              </Link>{' '}
              de compra.
            </span>
          </label>
          {termsError && (
            <p id="termsAccepted-error" className="checkout-field__error" role="alert">
              <IconAlertTriangle size={14} aria-hidden="true" /> {termsError}
            </p>
          )}
        </div>

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
          Consulta también nuestras políticas de{' '}
          <Link to="/envios" target="_blank" rel="noopener noreferrer">envíos</Link>,{' '}
          <Link to="/devoluciones" target="_blank" rel="noopener noreferrer">devoluciones</Link> y{' '}
          <Link to="/privacidad" target="_blank" rel="noopener noreferrer">privacidad</Link>.
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
const INITIAL_PAYMENT = { cardName: '', cardNumber: '', cardExpiry: '', cardCvv: '' }
// Orden visual de los campos; se usa para enfocar el primer error.
const FIELD_ORDER = [
  'firstName', 'lastName', 'email', 'phone',
  'province', 'canton', 'address', 'extraInfo',
  'cardName', 'cardNumber', 'cardExpiry', 'cardCvv',
]
const TERMS_REQUIRED_MESSAGE = 'Debes aceptar los términos y condiciones para confirmar la compra.'

function Checkout() {
  // `items` son solo los productos seleccionados para esta compra; `cartItems`
  // es el carrito completo (para distinguir "carrito vacío" de "nada elegido").
  const {
    selectedItems: items,
    items: cartItems,
    subtotal,
    iva,
    shippingCost,
    total,
    removeItems,
    selectedErrors,
  } = useCart()
  const { session } = useSession()
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
  // Los datos de la tarjeta viven solo en memoria: no van al borrador.
  const [payment, setPayment] = useState(INITIAL_PAYMENT)
  const [paymentTouched, setPaymentTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  // La aceptación no se guarda en el borrador: se pide en cada compra.
  const [termsAccepted, setTermsAccepted] = useState(false)
  // Sucursal de retiro o despacho; se recuerda para la próxima compra.
  const [branchId, setBranchId] = useState(readSavedBranch)

  // Si el usuario intenta recargar o cerrar mientras se paga, se le advierte.
  useWarnBeforeLeave(processing)

  // Registra "begin_checkout" una sola vez al entrar con productos. La ref
  // evita repetirlo cuando cambian los montos o React vuelve a montar.
  const checkoutLoggedRef = useRef(false)
  useEffect(() => {
    if (checkoutLoggedRef.current || items.length === 0) return
    checkoutLoggedRef.current = true
    trackEvent(EVENT_TYPES.BEGIN_CHECKOUT, {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      total,
      productIds: items.map((item) => item.id),
    })
  }, [items, total])

  const buyerErrors = useMemo(() => validateBuyerForm(buyer), [buyer])
  const deliveryErrors = useMemo(() => validateDeliveryForm(delivery), [delivery])
  const paymentErrors = useMemo(() => validatePaymentForm(payment), [payment])

  const buyerIsValid = Object.keys(buyerErrors).length === 0
  const deliveryIsValid = Object.keys(deliveryErrors).length === 0
  const paymentIsValid = Object.keys(paymentErrors).length === 0
  const canConfirm = buyerIsValid && deliveryIsValid && paymentIsValid && !processing

  // Validaciones del proyecto 3 que impiden pagar: sucursal elegida, stock
  // suficiente en esa sucursal, precios válidos y pedido mínimo B2B (las dos
  // últimas ya se revisan en el carrito y aquí se repiten antes de pagar).
  const branchAvailability = useMemo(
    () => (branchId ? checkBranchAvailability(items, branchId) : null),
    [items, branchId]
  )
  const branchError = submitAttempted && !branchId ? 'Elige la sucursal de retiro o despacho.' : null
  const purchaseIssues = [...selectedErrors, ...(branchAvailability?.errors ?? [])]

  const missingCount =
    Object.keys(buyerErrors).length + Object.keys(deliveryErrors).length + Object.keys(paymentErrors).length
  // El aviso aparece después del primer intento de confirmar sin aceptar.
  const termsError = submitAttempted && !termsAccepted ? TERMS_REQUIRED_MESSAGE : null

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

  function handleBranchChange(id) {
    setBranchId(id)
    setSubmitError(null)
    try {
      localStorage.setItem(BRANCH_STORAGE_KEY, id)
    } catch {
      // Sin localStorage solo se pierde el recordatorio de la sucursal.
    }
  }

  /**
   * Nombre: scrollToElement
   * Descripción: Lleva la vista y el foco a un elemento por id.
   */
  function scrollToElement(id) {
    const element = document.getElementById(id)
    if (element) {
      element.focus({ preventScroll: true })
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function handlePaymentChange(field, value) {
    setPayment((prev) => ({ ...prev, [field]: value }))
  }

  function handlePaymentBlur(field) {
    setPaymentTouched((prev) => ({ ...prev, [field]: true }))
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
    const firstInvalid = FIELD_ORDER.find(
      (field) => buyerErrors[field] || deliveryErrors[field] || paymentErrors[field]
    )
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
   *                1. Valida los formularios y que se hayan aceptado los
   *                   términos (si falta algo, no avanza).
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

    if (!buyerIsValid || !deliveryIsValid || !paymentIsValid) {
      setBuyerTouched({ firstName: true, lastName: true, email: true, phone: true })
      setDeliveryTouched({ province: true, canton: true, address: true, extraInfo: true })
      setPaymentTouched({ cardName: true, cardNumber: true, cardExpiry: true, cardCvv: true })
      focusFirstInvalidField()
      return
    }

    // Sucursal, stock, precio y mínimo B2B: si algo falla no se paga.
    if (!branchId) {
      setSubmitError('Elige la sucursal de retiro o despacho para continuar.')
      scrollToElement(`branch-${BRANCHES[0].id}`)
      return
    }
    if (purchaseIssues.length > 0) {
      setSubmitError(purchaseIssues[0])
      scrollToElement(`branch-${branchId}`)
      return
    }

    // Con los datos completos, lo único que falta es aceptar los términos.
    if (!termsAccepted) {
      const checkbox = document.getElementById('termsAccepted')
      if (checkbox) {
        checkbox.focus({ preventScroll: true })
        checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
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
        // Usuario, rol y empresa de la sesión; sucursal elegida.
        session,
        branchId,
        // La orden guarda el nombre completo (nombre + apellidos) como pide
        // el enunciado; el formulario los pide por separado.
        buyer: { fullName: buildFullName(buyer), email: buyer.email, phone: buyer.phone },
        delivery,
        // buildOrder repite las validaciones de precio, mínimo B2B y stock.
        items,
        totals: { subtotal, iva, shippingCost, total },
        // Queda registrado que el cliente aceptó los términos y cuál versión.
        termsAcceptance: { accepted: termsAccepted, version: TERMS_VERSION },
        // Solo marca y últimos 4 dígitos; el número completo y el CVV no se guardan.
        paymentMethod: maskCard(payment.cardNumber),
      })
    } catch (error) {
      finishWithError(
        error?.message
          ? `No se pudo preparar tu compra: ${error.message}.`
          : 'Hubo un problema al preparar tu compra. Revisa los datos e inténtalo de nuevo.'
      )
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
      // Solo una compra aprobada cuenta como "purchase" (las rechazadas o
      // con error no son compras completadas).
      trackEvent(EVENT_TYPES.PURCHASE, {
        orderNumber: order.orderNumber,
        total: order.total,
        priceType: order.priceType,
        branch: order.branch.name,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        items: order.items.map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
      })
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
            title="Sucursal de retiro o despacho"
            description="Elige la sucursal; revisamos que tenga las unidades que pides."
          >
            <BranchSelector items={items} branchId={branchId} onChange={handleBranchChange} error={branchError} />
          </CheckoutSection>

          <CheckoutSection
            number={3}
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
            number={4}
            title="Método de pago"
            description="Tarjeta de crédito o débito."
          >
            <PaymentForm
              values={payment}
              errors={paymentErrors}
              touched={paymentTouched}
              onChange={handlePaymentChange}
              onBlur={handlePaymentBlur}
            />
          </CheckoutSection>

          <CheckoutSection
            number={5}
            title="Revisión final"
            description="Revisa que todo esté correcto antes de confirmar el pago."
          >
            <ReviewBlock
              session={session}
              branchId={branchId}
              buyer={buyer}
              delivery={delivery}
              payment={payment}
              buyerIsValid={buyerIsValid}
              deliveryIsValid={deliveryIsValid}
              paymentIsValid={paymentIsValid}
            />
          </CheckoutSection>
        </fieldset>

        <CheckoutSummaryPanel
          branchId={branchId}
          purchaseIssues={purchaseIssues}
          canConfirm={canConfirm}
          onConfirm={handleConfirm}
          processing={processing}
          processingStage={processingStage}
          submitAttempted={submitAttempted}
          missingCount={missingCount}
          termsAccepted={termsAccepted}
          termsError={termsError}
          onTermsChange={setTermsAccepted}
        />
      </div>

      <DevScenarioPanel currentScenario={scenario} onChange={handleScenarioChange} disabled={processing} />
    </main>
  )
}

export default Checkout