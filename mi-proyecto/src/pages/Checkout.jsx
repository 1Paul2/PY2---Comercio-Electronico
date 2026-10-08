import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { formatCRC } from '../features/catalog/format'
import '../styles/Checkout.css'

function CheckoutProgress({ currentStep = 'checkout' }) {
  const steps = [
    { id: 'cart', label: 'Carrito' },
    { id: 'checkout', label: 'Checkout' },
    { id: 'confirmation', label: 'Confirmación' },
  ]
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <nav className="checkout-progress" aria-label="Progreso de la compra">
      <ol className="checkout-progress__list">
        {steps.map((step, index) => {
          const status =
            index < currentIndex ? 'complete' : index === currentIndex ? 'active' : 'pending'
          return (
            <li key={step.id} className={`checkout-progress__item checkout-progress__item--${status}`}>
              <span className="checkout-progress__bullet" aria-hidden="true">
                {index < currentIndex ? '✓' : index + 1}
              </span>
              <span className="checkout-progress__label">{step.label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function CheckoutSection({ number, title, description, children }) {
  return (
    <section className="checkout-section" aria-labelledby={`checkout-section-${number}`}>
      <header className="checkout-section__header">
        <span className="checkout-section__number" aria-hidden="true">
          {number}
        </span>
        <div>
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

function CheckoutSummaryPanel() {
  const { items, subtotal, iva, shippingCost, total } = useCart()

  return (
    <aside className="checkout-summary" aria-label="Resumen de la orden">
      <h2 className="checkout-summary__title">Resumen de la orden</h2>

      <ul className="checkout-summary__items">
        {items.map((item) => (
          <li key={item.id} className="checkout-summary__item">
            <img className="checkout-summary__image" src={item.image} alt="" loading="lazy" />
            <div className="checkout-summary__item-info">
              <p className="checkout-summary__item-name">{item.name}</p>
              <p className="checkout-summary__item-meta">
                {item.quantity} × {formatCRC(item.price)}
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
      <button type="button" className="checkout-summary__confirm" disabled>
        Confirmar compra
      </button>
      <Link to="/carrito" className="checkout-summary__back">
        Volver al carrito
      </Link>
    </aside>
  )
}

function Checkout() {
  const { items } = useCart()
  const navigate = useNavigate()
  if (items.length === 0) {
    return (
      <main className="checkout-page checkout-page--empty">
        <div className="checkout-empty">
          <h1>No hay productos para comprar</h1>
          <p>Agrega al menos un producto al carrito antes de iniciar el checkout.</p>
          <Link className="checkout-page__button" to="/productos">
            Volver al catálogo
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <div className="checkout-page__header">
        <div className="checkout-page__heading">
          <p className="checkout-page__eyebrow">Compra</p>
          <h1>Finalizar compra</h1>
        </div>
        <CheckoutProgress currentStep="checkout" />
      </div>

      <div className="checkout-page__layout">
        <div className="checkout-page__main">
          <CheckoutSection
            number={1}
            title="Información del comprador"
            description="Usaremos estos datos para contactarte sobre tu pedido."
          >
            <div className="checkout-placeholder">
              Formulario del comprador.
            </div>
          </CheckoutSection>

          <CheckoutSection
            number={2}
            title="Información de entrega"
            description="Indícanos dónde quieres recibir tu pedido."
          >
            <div className="checkout-placeholder">
              Formulario de entrega.
            </div>
          </CheckoutSection>

          <CheckoutSection
            number={3}
            title="Revisión final"
            description="Revisa que todo esté correcto antes de confirmar el pago."
          >
            <div className="checkout-placeholder">
              Revisión final y confirmación .
            </div>
          </CheckoutSection>
        </div>

        <CheckoutSummaryPanel />
      </div>

      <div className="checkout-page__footer-nav">
        <button type="button" className="checkout-page__back-button" onClick={() => navigate('/carrito')}>
          ← Volver al carrito
        </button>
      </div>
    </main>
  )
}

export default Checkout