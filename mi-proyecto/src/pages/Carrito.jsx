import { InstantSearch } from 'react-instantsearch'
import { Link } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import { formatCRC } from '../features/catalog/format'
import SearchHeader from '../features/catalog/SearchHeader'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import '../styles/Cart.css'

function CartItem({ item, increment, decrement, removeItem }) {
  const isAtStockLimit = Number.isFinite(item.maxStock) && item.quantity >= item.maxStock

  return (
    <article className="cart-item">
      <img className="cart-item__image" src={item.image} alt={item.name} />

      <div className="cart-item__details">
        <h2>{item.name}</h2>
        <p>Precio unitario: {formatCRC(item.price)}</p>
        <p className="cart-item__subtotal">Subtotal: {formatCRC(item.price * item.quantity)}</p>
      </div>

      <div className="cart-item__actions">
        <div className="cart-item__quantity" aria-label={`Cantidad de ${item.name}`}>
          <button type="button" onClick={() => decrement(item.id)} aria-label={`Disminuir cantidad de ${item.name}`}>
            −
          </button>
          <span>{item.quantity}</span>
          <button
            type="button"
            onClick={() => increment(item.id)}
            disabled={isAtStockLimit}
            aria-label={`Aumentar cantidad de ${item.name}`}
          >
            +
          </button>
        </div>
        <button type="button" className="cart-item__remove" onClick={() => removeItem(item.id)}>
          Eliminar
        </button>
      </div>
    </article>
  )
}

function CartContent() {
  const { items, subtotal, lastMessage, clearMessage, increment, decrement, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <main className="cart-page cart-page--empty">
        <div className="cart-empty">
          <h1>Tu carrito está vacío</h1>
          <p>Agrega productos del catálogo para comenzar tu compra.</p>
          {lastMessage && (
            <p className="cart-page__feedback" role="status" aria-live="polite">
              {lastMessage}
              <button type="button" onClick={clearMessage} aria-label="Cerrar mensaje">
                ×
              </button>
            </p>
          )}
          <Link className="cart-page__button" to="/productos">
            Volver al catálogo
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="cart-page">
      <div className="cart-page__heading">
        <div>
          <p className="cart-page__eyebrow">Compra</p>
          <h1>Carrito de compras</h1>
        </div>
        <Link className="cart-page__back" to="/productos">
          Seguir comprando
        </Link>
      </div>

      <div className="cart-page__layout">
        <section className="cart-page__items" aria-label="Productos del carrito">
          {lastMessage && (
            <p className="cart-page__feedback" role="status" aria-live="polite">
              {lastMessage}
              <button type="button" onClick={clearMessage} aria-label="Cerrar mensaje">
                ×
              </button>
            </p>
          )}
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              increment={increment}
              decrement={decrement}
              removeItem={removeItem}
            />
          ))}
        </section>

        <aside className="cart-summary" aria-label="Resumen de compra">
          <h2>Resumen</h2>
          <div className="cart-summary__row">
            <span>Subtotal</span>
            <strong>{formatCRC(subtotal)}</strong>
          </div>
          <p className="cart-summary__note">Impuestos y envío se calcularán en el siguiente paso.</p>
        </aside>
      </div>
    </main>
  )
}

function Carrito() {
  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      <SearchHeader />
      <CartContent />
      <Footer />
    </InstantSearch>
  )
}

export default Carrito
