import { useState } from 'react'
import { InstantSearch } from 'react-instantsearch'
import { Link, useNavigate } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import { formatCRC } from '../features/catalog/format'
import SearchHeader from '../features/catalog/SearchHeader'
import Footer from '../components/Footer'
import { useCart } from '../context/useCart'
import '../styles/Cart.css'

function CartItem({ item, increment, decrement, onRequestRemove }) {
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
          <button
            type="button"
            onClick={() => (item.quantity === 1 ? onRequestRemove(item) : decrement(item.id))}
            aria-label={`Disminuir cantidad de ${item.name}`}
          >
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
        <button type="button" className="cart-item__remove" onClick={() => onRequestRemove(item)}>
          Eliminar
        </button>
      </div>
    </article>
  )
}

function CartContent() {
  const { items, itemCount, subtotal, iva, shippingCost, total, increment, decrement, removeItem } = useCart()
  const [pendingRemoval, setPendingRemoval] = useState(null)
  const navigate = useNavigate()

  function handleStartCheckout() {
    if (items.length === 0) {
      return
    }
    navigate('/checkout')
  }

  function confirmRemoval() {
    if (!pendingRemoval) return
    removeItem(pendingRemoval.id)
    setPendingRemoval(null)
  }

  if (items.length === 0) {
    return (
      <main className="cart-page cart-page--empty">
        <div className="cart-empty">
          <h1>Tu carrito está vacío</h1>
          <p>Agrega productos del catálogo para comenzar tu compra.</p>
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
          <p className="cart-page__eyebrow">Tu pedido</p>
          <h1>Resumen de compra</h1>
          <p className="cart-page__intro">Revisa los productos, cantidades y el total de tu pedido.</p>
        </div>
        <Link className="cart-page__back" to="/productos">
          Seguir comprando
        </Link>
      </div>

      <div className="cart-page__layout">
        <section className="cart-page__items" aria-label="Productos del carrito">
          <div className="cart-page__items-heading">
            <h2>Productos</h2>
            <span>{itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}</span>
          </div>
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              increment={increment}
              decrement={decrement}
              onRequestRemove={setPendingRemoval}
            />
          ))}
        </section>

        <aside className="cart-summary" aria-label="Resumen de compra">
          <div className="cart-summary__heading">
            <div>
              <p className="cart-summary__eyebrow">Total del pedido</p>
              <h2>Tu resumen</h2>
            </div>
            <span className="cart-summary__count" aria-label={`${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'}`}>
              {itemCount}
            </span>
          </div>
          <div className="cart-summary__row">
            <span>Subtotal</span>
            <strong>{formatCRC(subtotal)}</strong>
          </div>
          <div className="cart-summary__row">
            <span>IVA (13%)</span>
            <strong>{formatCRC(iva)}</strong>
          </div>
          <div className="cart-summary__row">
            <span>Envío estimado</span>
            <strong>{formatCRC(shippingCost)}</strong>
          </div>
          <div className="cart-summary__total">
            <span>Total <small>IVA incluido</small></span>
            <strong>{formatCRC(total)}</strong>
          </div>
          <p className="cart-summary__note">El envío se estima según el peso de los productos.</p>
          <button
            type="button"
            className="cart-summary__checkout"
            onClick={handleStartCheckout}
            disabled={items.length === 0}
            aria-disabled={items.length === 0}
          >
            Iniciar checkout
          </button>
        </aside>
      </div>

      {pendingRemoval && (
        <div className="cart-confirmation__backdrop" role="presentation">
          <section className="cart-confirmation" role="dialog" aria-modal="true" aria-labelledby="cart-confirmation-title">
            <h2 id="cart-confirmation-title">¿Eliminar producto?</h2>
            <p>¿Deseas eliminar {`"${pendingRemoval.name}"`} del carrito?</p>
            <div className="cart-confirmation__actions">
              <button type="button" className="cart-confirmation__cancel" onClick={() => setPendingRemoval(null)}>
                Cancelar
              </button>
              <button type="button" className="cart-confirmation__delete" onClick={confirmRemoval}>
                Eliminar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function Carrito() {
  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      <SearchHeader redirectSearchTo="/productos" />
      <CartContent />
      <Footer />
    </InstantSearch>
  )
}

export default Carrito