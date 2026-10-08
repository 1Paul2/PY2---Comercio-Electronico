import { Link } from 'react-router-dom'

function Confirmacion() {
  return (
    <main className="checkout-page">
      <h1>Confirmación</h1>
      <p>Aquí se mostrará el resultado del pago y el resumen de la orden.</p>
      <Link to="/">Volver al inicio</Link>
    </main>
  )
}

export default Confirmacion