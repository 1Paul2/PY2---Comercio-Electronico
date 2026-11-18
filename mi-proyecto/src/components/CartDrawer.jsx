import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { formatCRC } from '../features/catalog/format'
import { formatB2BConditions, PRICE_TYPES, validateCartItem } from '../features/pricing/pricing'
import '../styles/CartDrawer.css'

function CartDrawer({ ref }) {
  const {
    items,
    selectedItems,
    selectedItemCount,
    allSelected,
    increment,
    decrement,
    removeItem,
    toggleSelected,
    setAllSelected,
    subtotalWithIva,
    selectedErrors,
    canCheckout,
  } = useCart()
  const hasSelection = selectedItems.length > 0
  const [pendingRemoval, setPendingRemoval] = useState(null)
  const navigate = useNavigate()

  function closeDrawer() {
    ref.current?.close()
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) closeDrawer()
  }

  function handleRequestRemove(item) {
    closeDrawer()
    setPendingRemoval(item)
  }

  function confirmRemoval() {
    if (!pendingRemoval) return
    removeItem(pendingRemoval.id)
    setPendingRemoval(null)
  }

  function handleStartCheckout() {
    if (!canCheckout) return
    closeDrawer()
    navigate('/checkout')
  }

  return (
    <>
      <dialog ref={ref} className="cart-drawer" aria-labelledby="cart-drawer-title" onClick={handleBackdropClick}>
        <div className="cart-drawer__panel">
          <header className="cart-drawer__header">
            <h2 id="cart-drawer-title">Carrito de compra</h2>
            <button type="button" className="cart-drawer__close" onClick={closeDrawer} aria-label="Cerrar carrito">
              <span aria-hidden="true">×</span>
              <span className="cart-drawer__close-text">Cerrar</span>
            </button>
          </header>

          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <p className="cart-drawer__empty-title">Tu carrito está vacío</p>
              <p>Explora el catálogo y agrega los productos que necesitas.</p>
              <Link className="cart-drawer__primary" to="/productos" onClick={closeDrawer}>
                Ver productos
              </Link>
            </div>
          ) : (
            <>
              {/* Selección de productos para el checkout, igual que en la página del carrito. */}
              <div className="cart-drawer__select-all">
                <label>
                  <input
                    type="checkbox"
                    className="cart-drawer__checkbox"
                    checked={allSelected}
                    onChange={() => setAllSelected(!allSelected)}
                  />
                  <span>{allSelected ? 'Quitar selección' : 'Seleccionar todos'}</span>
                </label>
                <span className="cart-drawer__select-count">
                  {selectedItems.length} de {items.length}
                </span>
              </div>

              <ul className="cart-drawer__list">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`cart-drawer__item${item.selected ? '' : ' cart-drawer__item--unselected'}`}
                  >
                    <input
                      type="checkbox"
                      className="cart-drawer__checkbox cart-drawer__item-check"
                      checked={item.selected}
                      onChange={() => toggleSelected(item.id)}
                      aria-label={`Incluir ${item.name} en la compra`}
                    />

                    <button
                      type="button"
                      className="cart-drawer__remove"
                      onClick={() => handleRequestRemove(item)}
                      aria-label={`Eliminar ${item.name}`}
                    >
                      ×
                    </button>

                    <img className="cart-drawer__image" src={item.image} alt="" loading="lazy" />

                    <div className="cart-drawer__item-info">
                      <p className="cart-drawer__item-name">{item.name}</p>

                      <div className="cart-drawer__meta-row">
                        <span className="cart-drawer__label">
                          {item.priceType === PRICE_TYPES.B2B ? 'Precio B2B' : 'Precio'}
                        </span>
                        <strong className="cart-drawer__price">
                          {Number.isFinite(item.unitPrice) ? formatCRC(item.unitPrice) : 'No disponible'}
                          {item.discountPct > 0 && (
                            <span className="cart-drawer__discount"> −{Math.round(item.discountPct * 100)}%</span>
                          )}
                        </strong>
                      </div>

                      {item.priceType === PRICE_TYPES.B2B && formatB2BConditions(item.minQuantity, item.volumeDiscounts) && (
                        <p className="cart-drawer__conditions">
                          {formatB2BConditions(item.minQuantity, item.volumeDiscounts)}
                        </p>
                      )}

                      {validateCartItem(item).map((error) => (
                        <p key={error} className="cart-drawer__error" role="alert">
                          {error}
                        </p>
                      ))}

                      <div className="cart-drawer__meta-row cart-drawer__meta-row--qty">
                        <span className="cart-drawer__label">Cantidad</span>
                        <div className="cart-drawer__quantity">
                          <button
                            type="button"
                            onClick={() =>
                              item.quantity === 1 && !(item.minQuantity > 1) ? handleRequestRemove(item) : decrement(item.id)
                            }
                            aria-disabled={item.minQuantity > 1 && item.quantity <= item.minQuantity}
                            aria-label={`Disminuir cantidad de ${item.name}`}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => increment(item.id)}
                            disabled={Number.isFinite(item.maxStock) && item.quantity >= item.maxStock}
                            aria-label={`Aumentar cantidad de ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="cart-drawer__meta-row cart-drawer__meta-row--total">
                        <span className="cart-drawer__label">Subtotal</span>
                        <strong className="cart-drawer__item-subtotal">
                          {Number.isFinite(item.unitPrice) ? formatCRC(item.unitPrice * item.quantity) : '—'}
                        </strong>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <footer className="cart-drawer__footer">
                <div className="cart-drawer__total">
                  <span>
                    Total seleccionado
                    <small>
                      IVA incluido · {selectedItemCount} {selectedItemCount === 1 ? 'artículo' : 'artículos'}
                    </small>
                  </span>
                  <strong>{formatCRC(subtotalWithIva)}</strong>
                </div>
                <button
                  type="button"
                  className="cart-drawer__primary"
                  onClick={handleStartCheckout}
                  disabled={!canCheckout}
                >
                  Ir a checkout
                </button>
                {!hasSelection && (
                  <p className="cart-drawer__hint" role="status">
                    Selecciona al menos un producto para ir a checkout.
                  </p>
                )}
                {hasSelection && selectedErrors.length > 0 && (
                  <p className="cart-drawer__hint cart-drawer__hint--error" role="alert">
                    Revisa los productos marcados: {selectedErrors[0]}
                  </p>
                )}
                <Link className="cart-drawer__secondary" to="/carrito" onClick={closeDrawer}>
                  Ir al carrito
                </Link>
                <button type="button" className="cart-drawer__secondary" onClick={closeDrawer}>
                  Seguir comprando
                </button>
              </footer>
            </>
          )}
        </div>
      </dialog>

      {pendingRemoval && (
        <div className="cart-drawer__confirmation-backdrop" role="presentation">
          <section className="cart-drawer__confirmation" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-confirmation-title">
            <h2 id="cart-drawer-confirmation-title">¿Eliminar producto?</h2>
            <p>¿Deseas eliminar {`"${pendingRemoval.name}"`} del carrito?</p>
            <div className="cart-drawer__confirmation-actions">
              <button type="button" className="cart-drawer__confirmation-cancel" onClick={() => setPendingRemoval(null)}>
                Cancelar
              </button>
              <button type="button" className="cart-drawer__confirmation-delete" onClick={confirmRemoval}>
                Eliminar
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default CartDrawer