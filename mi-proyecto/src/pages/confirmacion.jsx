import { Link, useLocation } from 'react-router-dom'

function Confirmacion() {
  // El checkout construye la orden (con su número único) al confirmar.
  const { state } = useLocation()
  const orderNumber = state?.order?.orderNumber

  return (
    <main className="checkout-page">
      <h1>Confirmación</h1>
      {orderNumber && (
        <p>
          Número de orden: <strong>{orderNumber}</strong>
        </p>
      )}
      <p>Aquí se mostrará el resultado del pago y el resumen de la orden.</p>
      <Link to="/">Volver al inicio</Link>
    </main>
  )
}

export default Confirmacion