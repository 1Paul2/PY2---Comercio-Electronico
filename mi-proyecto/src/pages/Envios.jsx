import { Link } from 'react-router-dom'
import PolicyLayout from '../components/PolicyLayout'

/**
 * Nombre: Envios
 * Descripción: Página "Política de envíos". Contenido alineado con el cálculo
 *              real de la tienda (₡30 por kg, mínimo ₡3 500).
 */
const SECTIONS = [
  {
    id: 'cobertura',
    title: 'Cobertura',
    content: (
      <>
        <p>
          Realizamos entregas en las <strong>7 provincias de Costa Rica</strong>: San José, Alajuela, 
          Cartago, Heredia, Guanacaste, Puntarenas y Limón.
        </p>
        <p>
          Para maquinaria pesada, coordinamos la entrega directamente con el cliente para asegurar 
          que el lugar cuente con el acceso y el espacio necesario.
        </p>
      </>
    ),
  },
  {
    id: 'tiempos',
    title: 'Tiempos de entrega',
    content: (
      <>
        <p>
          El tiempo estimado de entrega es de <strong>1 a 3 días hábiles</strong> a partir de la 
          confirmación del pago.
        </p>
        <p>
          En zonas de difícil acceso o para maquinaria que requiera transporte especial, el tiempo 
          puede extenderse. En esos casos, te contactaremos para coordinar la fecha exacta.
        </p>
      </>
    ),
  },
  {
    id: 'costos',
    title: 'Costos de envío',
    content: (
      <>
        <p>
          El costo de envío se calcula automáticamente en el carrito según el peso total del pedido:
        </p>
        <ul>
          <li><strong>Tarifa base:</strong> ₡30 por kilogramo.</li>
          <li><strong>Costo mínimo:</strong> ₡3 500 por envío.</li>
        </ul>
        <p>
          El monto exacto se muestra antes de pagar, en el resumen de la orden, para que no haya 
          sorpresas.
        </p>
      </>
    ),
  },
  {
    id: 'restricciones',
    title: 'Restricciones y condiciones especiales',
    content: (
      <>
        <p>Algunas condiciones aplican para la entrega de ciertos productos:</p>
        <ul>
          <li>
            <strong>Maquinaria muy pesada:</strong> requiere coordinación previa y puede necesitar 
            un vehículo especial. Si el lugar de entrega no tiene acceso para el transporte, 
            buscaremos una alternativa contigo.
          </li>
          <li>
            <strong>Zonas de difícil acceso:</strong> si el destino no cuenta con vías adecuadas, 
            la entrega podría coordinarse en un punto intermedio o tener un costo adicional.
          </li>
        </ul>
        <div className="policy-note">
          <p>
            Si tienes dudas sobre la entrega de tu producto, escríbenos a{' '}
            <a href="mailto:info@maquinariacr.com">info@maquinariacr.com</a> antes de comprar.
          </p>
        </div>
        <p>
          Para más detalles sobre devoluciones, revisa nuestra{' '}
          <Link to="/devoluciones">política de devoluciones</Link>.
        </p>
      </>
    ),
  },
]

function Envios() {
  return (
    <PolicyLayout
      eyebrow="Políticas"
      title="Política de envíos"
      intro="Cobertura, tiempos de entrega, costos y restricciones de los envíos."
      updatedAt="octubre de 2026"
      sections={SECTIONS}
    />
  )
}

export default Envios