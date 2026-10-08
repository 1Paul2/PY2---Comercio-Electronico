import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { formatCRC } from '../features/catalog/format'
import '../styles/CartDrawer.css'

function CartDrawer({ ref }) {
  const { items, increment, decrement, removeItem, subtotalWithIva } = useCart()
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
    if (items.length === 0) return
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
              <ul className="cart-drawer__list">
                {items.map((item) => (
                  <li key={item.id} className="cart-drawer__item">
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
                        <span className="cart-drawer__label">Precio</span>
                        <strong className="cart-drawer__price">{formatCRC(item.price)}</strong>
                      </div>

                      <div className="cart-drawer__meta-row cart-drawer__meta-row--qty">
                        <span className="cart-drawer__label">Cantidad</span>
                        <div className="cart-drawer__quantity">
                          <button
                            type="button"
                            onClick={() => (item.quantity === 1 ? handleRequestRemove(item) : decrement(item.id))}
                            aria-label={`Disminuir cantidad de ${item.name}`}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => increment(item.id)} aria-label={`Aumentar cantidad de ${item.name}`}>
                            +
                          </button>
                        </div>
                      </div>

                      <div className="cart-drawer__meta-row cart-drawer__meta-row--total">
                        <span className="cart-drawer__label">Subtotal</span>
                        <strong className="cart-drawer__item-subtotal">{formatCRC(item.price * item.quantity)}</strong>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <footer className="cart-drawer__footer">
                <div className="cart-drawer__total">
                  <span>Subtotal (IVA incluido)</span>
                  <strong>{formatCRC(subtotalWithIva)}</strong>
                </div>
                <button
                  type="button"
                  className="cart-drawer__primary"
                  onClick={handleStartCheckout}
                  disabled={items.length === 0}
                >
                  Iniciar checkout
                </button>
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