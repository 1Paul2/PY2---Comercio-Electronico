import { Link, useLocation } from 'react-router-dom'
import { getLastOrder, getOrder } from '../features/orders/orderStorage'

function Confirmacion() {
  // La orden se lee del almacenamiento: por el número que envía el checkout
  // o, si se abre la página sin datos de navegación, la última orden creada.
  const { state } = useLocation()
  const order = (state?.orderNumber && getOrder(state.orderNumber)) || getLastOrder()

  if (!order) {
    return (
      <main className="checkout-page">
        <h1>Confirmación</h1>
        <p>No encontramos ninguna orden reciente.</p>
        <Link to="/productos">Explorar catálogo</Link>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <h1>Confirmación</h1>
      <p>
        Número de orden: <strong>{order.orderNumber}</strong>
      </p>
      <p>Aquí se mostrará el resultado del pago y el resumen de la orden.</p>
      <Link to="/">Volver al inicio</Link>
    </main>
  )
}

export default Confirmacion