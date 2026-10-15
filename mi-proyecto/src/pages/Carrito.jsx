import { useState } from 'react'
import { InstantSearch } from 'react-instantsearch'
import { Link, useNavigate } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import { formatCRC } from '../features/catalog/format'
import SearchHeader from '../features/catalog/SearchHeader'
import Footer from '../components/Footer'
import { useCart } from '../context/useCart'
import '../styles/Cart.css'

/**
 * Nombre: unitsLabel
 * Descripción: Texto "N artículo(s)" con la forma singular o plural.
 */
function unitsLabel(count) {
  return `${count} ${count === 1 ? 'artículo' : 'artículos'}`
}

/**
 * Nombre: CartItem
 * Descripción: Línea del carrito con casilla para elegir si el producto pasa
 *              al checkout, imagen, precios, control de cantidad y eliminar.
 *              Un producto no seleccionado se ve atenuado y no suma al total.
 */
function CartItem({ item, increment, decrement, onRequestRemove, onToggleSelected }) {
  const isAtStockLimit = Number.isFinite(item.maxStock) && item.quantity >= item.maxStock
  const checkboxId = `cart-select-${item.id}`

  return (
    <article className={`cart-item${item.selected ? '' : ' cart-item--unselected'}`}>
      <div className="cart-item__select">
        <input
          id={checkboxId}
          type="checkbox"
          className="cart-checkbox"
          checked={item.selected}
          onChange={() => onToggleSelected(item.id)}
          aria-label={`Incluir ${item.name} en la compra`}
        />
      </div>

      <label htmlFor={checkboxId} className="cart-item__media">
        <img className="cart-item__image" src={item.image} alt="" />
      </label>

      <div className="cart-item__details">
        <h2>{item.name}</h2>
        <p>Precio unitario: {formatCRC(item.price)}</p>
        <p className="cart-item__subtotal">Subtotal: {formatCRC(item.price * item.quantity)}</p>
        {!item.selected && <p className="cart-item__excluded">No se incluirá en esta compra</p>}
        {isAtStockLimit && (
          <p className="cart-item__stock-note" role="status">
            Alcanzaste el máximo disponible ({item.maxStock} {item.maxStock === 1 ? 'unidad' : 'unidades'}).
          </p>
        )}
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
          <span aria-live="polite">{item.quantity}</span>
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
  const {
    items,
    selectedItems,
    selectedItemCount,
    allSelected,
    subtotal,
    iva,
    shippingCost,
    total,
    increment,
    decrement,
    removeItem,
    toggleSelected,
    setAllSelected,
  } = useCart()
  const [pendingRemoval, setPendingRemoval] = useState(null)
  const navigate = useNavigate()
  const hasSelection = selectedItems.length > 0

  function handleStartCheckout() {
    if (!hasSelection) return
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
          <h1>Carrito de compra</h1>
          <p className="cart-page__intro">
            Marca los productos que quieres comprar ahora; los demás se quedan guardados en tu carrito.
          </p>
        </div>
        <Link className="cart-page__back" to="/productos">
          Seguir comprando
        </Link>
      </div>

      <div className="cart-page__layout">
        <section className="cart-page__items" aria-label="Productos del carrito">
          <div className="cart-page__items-heading">
            <label className="cart-select-all">
              <input
                type="checkbox"
                className="cart-checkbox"
                checked={allSelected}
                onChange={() => setAllSelected(!allSelected)}
              />
              <span>{allSelected ? 'Quitar selección' : 'Seleccionar todos'}</span>
            </label>
            <span>
              {selectedItems.length} de {items.length} {items.length === 1 ? 'producto' : 'productos'} seleccionados
            </span>
          </div>
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              increment={increment}
              decrement={decrement}
              onRequestRemove={setPendingRemoval}
              onToggleSelected={toggleSelected}
            />
          ))}
        </section>

        <aside className="cart-summary" aria-label="Resumen de compra">
          <div className="cart-summary__heading">
            <div>
              <p className="cart-summary__eyebrow">Productos seleccionados</p>
              <h2>Tu resumen</h2>
            </div>
            <span className="cart-summary__count" aria-label={unitsLabel(selectedItemCount)}>
              {selectedItemCount}
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
          <p className="cart-summary__note">
            Solo se cobran los productos seleccionados. El envío se estima según su peso.
          </p>
          <button
            type="button"
            className="cart-summary__checkout"
            onClick={handleStartCheckout}
            disabled={!hasSelection}
          >
            Ir a checkout
          </button>
          {!hasSelection && (
            <p className="cart-summary__hint" role="status">
              Selecciona al menos un producto para ir a checkout.
            </p>
          )}
        </aside>
      </div>

      {/* Barra fija inferior en celular: total y botón siempre a la vista
          mientras se eligen los productos. */}
      <div className="cart-mobile-bar">
        <div className="cart-mobile-bar__total">
          <span>Total ({unitsLabel(selectedItemCount)})</span>
          <strong>{formatCRC(total)}</strong>
        </div>
        <button
          type="button"
          className="cart-mobile-bar__button"
          onClick={handleStartCheckout}
          disabled={!hasSelection}
        >
          Ir a checkout
        </button>
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
