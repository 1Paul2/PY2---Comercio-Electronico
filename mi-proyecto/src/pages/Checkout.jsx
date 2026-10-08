import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import '../styles/Checkout.css'

function Checkout() {
  const { items } = useCart()
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
      <h1>Checkout</h1>
      <p>El proceso de checkout se implementará más tarde</p>
      <Link to="/carrito">Volver al carrito</Link>
    </main>
  )
}

export default Checkout