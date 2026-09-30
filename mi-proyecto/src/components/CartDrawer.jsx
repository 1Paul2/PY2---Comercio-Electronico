import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { formatCRC } from '../features/catalog/format'
import '../styles/CartDrawer.css'

/**
 * Nombre: CartDrawer
 * Descripción: Panel lateral (mini carrito) que se despliega desde la derecha
 *              con el resumen de los productos del carrito, el subtotal con
 *              IVA incluido y el acceso a la página /carrito.
 *              Usa el elemento nativo <dialog> abierto con showModal(): el
 *              navegador se encarga de atrapar el foco, cerrar con Escape,
 *              volver inerte el resto de la página y devolver el foco al
 *              botón que lo abrió, sin librerías ni lógica extra.
 * Entradas: ref: referencia al <dialog>; quien lo usa lo abre con
 *           ref.current.showModal().
 * Salidas: JSX con el panel del carrito.
 * Excepciones: No hay.
 */
function CartDrawer({ ref }) {
  const { items, itemCount, iva, subtotalWithIva } = useCart()

  function closeDrawer() {
    ref.current?.close()
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) closeDrawer()
  }

  const unitsLabel = itemCount === 1 ? 'unidad' : 'unidades'

  return (
    <dialog ref={ref} className="cart-drawer" aria-labelledby="cart-drawer-title" onClick={handleBackdropClick}>
      <div className="cart-drawer__panel">
        <header className="cart-drawer__header">
          <h2 id="cart-drawer-title">
            Tu carrito
            {itemCount > 0 && <span className="cart-drawer__count"> ({itemCount} {unitsLabel})</span>}
          </h2>
          <button type="button" className="cart-drawer__close" onClick={closeDrawer} aria-label="Cerrar carrito">
            ×
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
                  <img className="cart-drawer__image" src={item.image} alt="" loading="lazy" />
                  <div className="cart-drawer__item-info">
                    <p className="cart-drawer__item-name">{item.name}</p>
                    <p className="cart-drawer__item-qty">
                      {item.quantity} × {formatCRC(item.price)}
                    </p>
                  </div>
                  <p className="cart-drawer__item-subtotal">{formatCRC(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>

            <footer className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>Subtotal (IVA incluido)</span>
                <strong>{formatCRC(subtotalWithIva)}</strong>
              </div>
              <p className="cart-drawer__note">
                Incluye {formatCRC(iva)} de IVA (13%). El envío se calcula en el carrito.
              </p>
              <Link className="cart-drawer__primary" to="/carrito" onClick={closeDrawer}>
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
  )
}

export default CartDrawer
