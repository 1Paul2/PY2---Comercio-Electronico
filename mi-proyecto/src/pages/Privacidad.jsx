import { Link } from 'react-router-dom'
import PolicyLayout from '../components/PolicyLayout'

/**
 * Nombre: Privacidad
 * Descripción: Página "Política de privacidad".
 *              Cada sección es un objeto { id, title, content }; el índice de
 *              la página se arma solo a partir de esta lista.
 */
const SECTIONS = [
  {
    id: 'responsable',
    title: 'Responsable de los datos',
    content: (
      <p>
        Maquinaria CR es responsable de los datos personales que se recopilan en este sitio. Para
        cualquier consulta sobre esta política o sobre tus datos, escríbenos a{' '}
        <a href="mailto:info@maquinariacr.com">info@maquinariacr.com</a>.
      </p>
    ),
  },
  {
    id: 'datos-recopilados',
    title: 'Información que recopilamos',
    content: (
      <>
        <p>
          Puedes navegar el catálogo sin dar ningún dato personal y sin crear una cuenta. Solo
          pedimos datos cuando haces una compra:
        </p>
        <ul>
          <li>
            <strong>Datos del comprador:</strong> nombre, apellidos, correo electrónico y teléfono.
          </li>
          <li>
            <strong>Datos de entrega:</strong> provincia, cantón, dirección exacta e indicaciones
            adicionales opcionales para encontrar el lugar.
          </li>
          <li>
            <strong>Datos del pedido:</strong> número de orden, fecha, productos, cantidades, montos
            y la aceptación de los <Link to="/terminos">términos y condiciones</Link> con su
            versión.
          </li>
        </ul>
        <div className="policy-note">
          <p>
            La tienda no solicita ni guarda el número de tu tarjeta ni tu número de cédula. El cobro
            lo procesa directamente el servicio de pago.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'uso-de-los-datos',
    title: 'Uso de la información',
    content: (
      <>
        <p>Usamos tus datos únicamente para:</p>
        <ul>
          <li>Procesar el pago y generar la orden con su comprobante.</li>
          <li>Coordinar la entrega en la dirección indicada y contactarte si surge algún problema.</li>
          <li>Atender cancelaciones, garantías, devoluciones y reclamos.</li>
        </ul>
        <p>
          No usamos tus datos para publicidad ni para enviarte mensajes promocionales, y no los
          vendemos a nadie.
        </p>
      </>
    ),
  },
  {
    id: 'datos-compartidos',
    title: 'Con quién se comparten',
    content: (
      <>
        <p>Solo se comparte lo necesario para completar la compra:</p>
        <div className="policy-table-wrap">
          <table className="policy-table">
            <thead>
              <tr>
                <th scope="col">Quién</th>
                <th scope="col">Qué recibe</th>
                <th scope="col">Para qué</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Servicio de pago</td>
                <td>Número de orden, monto y moneda</td>
                <td>Procesar el cobro</td>
              </tr>
              <tr>
                <td>Encargado de la entrega</td>
                <td>Nombre, teléfono y dirección de entrega</td>
                <td>Llevar el pedido</td>
              </tr>
              <tr>
                <td>Servicio de búsqueda</td>
                <td>El texto que escribes en el buscador</td>
                <td>Mostrar resultados y sugerencias</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          El buscador no recibe tu nombre ni tus datos de contacto. Quienes reciben datos para la
          entrega deben mantenerlos confidenciales y usarlos solo para ese fin.
        </p>
      </>
    ),
  },
  {
    id: 'datos-en-el-navegador',
    title: 'Datos que se guardan en tu navegador',
    content: (
      <>
        <p>
          Para que no pierdas tu avance, el sitio guarda alguna información en tu propio navegador.
          No usamos cookies de publicidad ni de seguimiento.
        </p>
        <div className="policy-table-wrap">
          <table className="policy-table">
            <thead>
              <tr>
                <th scope="col">Dato</th>
                <th scope="col">Cuánto dura</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Borrador del formulario de compra</td>
                <td>Se borra al cerrar la pestaña.</td>
              </tr>
              <tr>
                <td>Productos del carrito</td>
                <td>Hasta que compres o los quites.</td>
              </tr>
              <tr>
                <td>Historial de pedidos y comprobantes</td>
                <td>Hasta que borres los datos del sitio.</td>
              </tr>
              <tr>
                <td>Búsquedas recientes y tema claro u oscuro</td>
                <td>Hasta que borres los datos del sitio.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Si usas una computadora compartida, te recomendamos borrar los datos del sitio desde la
          configuración del navegador al terminar.
        </p>
      </>
    ),
  },
  {
    id: 'proteccion-de-los-datos',
    title: 'Protección de los datos',
    content: (
      <ul>
        <li>El sitio funciona sobre una conexión cifrada (HTTPS).</li>
        <li>Pedimos solo los datos necesarios para la compra y la entrega.</li>
        <li>Los datos de la tarjeta nunca pasan por la tienda.</li>
        <li>El formulario valida cada dato antes de generar la orden, para evitar errores.</li>
        <li>Solo el personal que atiende tu pedido tiene acceso a tus datos.</li>
      </ul>
    ),
  },
  {
    id: 'tus-derechos',
    title: 'Tus derechos',
    content: (
      <>
        <p>
          Puedes solicitar en cualquier momento el acceso, la corrección o la eliminación de tus
          datos escribiendo a <a href="mailto:info@maquinariacr.com">info@maquinariacr.com</a> con
          tu número de orden. Te respondemos en un máximo de 5 días hábiles.
        </p>
        <p>
          Algunos datos de pedidos confirmados se conservan mientras sigan vigentes la garantía o
          una devolución en trámite, aunque pidas su eliminación.
        </p>
      </>
    ),
  },
  {
    id: 'cambios',
    title: 'Cambios a esta política',
    content: (
      <p>
        Si cambia la forma en que tratamos los datos, actualizaremos esta página y su fecha de
        última actualización. Los cambios no se aplican a datos de compras anteriores sin tu
        consentimiento.
      </p>
    ),
  },
]

function Privacidad() {
  return (
    <PolicyLayout
      eyebrow="Políticas"
      title="Política de privacidad"
      intro="Qué datos personales pedimos, para qué los usamos y cómo los protegemos."
      updatedAt="octubre de 2026"
      sections={SECTIONS}
    />
  )
}

export default Privacidad