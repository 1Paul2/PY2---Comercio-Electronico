import { Link } from 'react-router-dom'
import PolicyLayout from '../components/PolicyLayout'

/**
 * Nombre: Devoluciones
 * Descripción: Página "Política de devoluciones".
 *              Cada sección es un objeto { id, title, content }; el índice de
 *              la página se arma solo a partir de esta lista.
 */
const SECTIONS = [
  {
    id: 'plazo',
    title: 'Plazo para solicitar una devolución',
    content: (
      <>
        <p>
          Tienes <strong>15 días naturales</strong> desde la fecha de entrega para solicitar la
          devolución de un producto, aunque simplemente hayas cambiado de opinión. Este plazo
          incluye y amplía el derecho de retracto que reconoce la normativa costarricense de
          protección al consumidor para compras en línea.
        </p>
        <div className="policy-note">
          <p>
            Si el producto llega dañado, incompleto o no corresponde a lo que pediste, repórtalo
            dentro de las <strong>48 horas</strong> siguientes a la entrega. Más detalles en{' '}
            <em>Productos dañados o equivocados</em>, más abajo.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'condiciones',
    title: 'Condiciones para aprobar una devolución',
    content: (
      <>
        <p>La devolución se aprueba si se cumplen todas estas condiciones:</p>
        <ul>
          <li>Se solicita dentro del plazo.</li>
          <li>Se presenta el número de orden de la compra.</li>
          <li>
            El producto no se ha instalado ni puesto en operación después de la entrega. En
            maquinaria, el horómetro debe marcar las mismas horas que al momento de recibirla.
          </li>
          <li>
            Se devuelve con sus manuales, llaves, accesorios y piezas completas, y en el caso de los
            repuestos, en su empaque original.
          </li>
          <li>No presenta daños causados por golpes, mal uso o manipulación indebida.</li>
        </ul>
        <h3>Según la condición del producto</h3>
        <div className="policy-table-wrap">
          <table className="policy-table">
            <thead>
              <tr>
                <th scope="col">Condición</th>
                <th scope="col">Devolución por cambio de opinión</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nuevo</td>
                <td>Sí, dentro de los 15 días y con las condiciones anteriores.</td>
              </tr>
              <tr>
                <td>Reacondicionado</td>
                <td>Sí, dentro de los 15 días y con las condiciones anteriores.</td>
              </tr>
              <tr>
                <td>Usado</td>
                <td>
                  No. Solo se acepta si el equipo no coincide con la ficha (año, modelo o estado
                  descrito) o presenta una falla no informada.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: 'casos-no-aceptados',
    title: 'Casos en que no se aceptan devoluciones',
    content: (
      <ul>
        <li>Repuestos que ya fueron instalados, aunque se hayan retirado después.</li>
        <li>Maquinaria que se haya puesto a trabajar después de la entrega.</li>
        <li>Maquinaria vendida como usada, salvo en los casos indicados en la tabla anterior.</li>
        <li>
          Pedidos especiales: equipos o piezas fabricados, adaptados o importados a solicitud del
          cliente.
        </li>
        <li>Productos dañados por instalación incorrecta o por un uso distinto al indicado.</li>
        <li>Solicitudes presentadas después del plazo de 15 días.</li>
      </ul>
    ),
  },
  {
    id: 'danados-o-equivocados',
    title: 'Productos dañados o equivocados',
    content: (
      <>
        <p>
          Revisa el pedido en el momento de la entrega, en presencia del transportista si es
          posible. Si encuentras un daño, un faltante o un producto que no corresponde:
        </p>
        <ul>
          <li>Anótalo en el comprobante de entrega antes de firmarlo.</li>
          <li>
            Repórtalo dentro de las 48 horas siguientes, con fotos del producto, del empaque y de la
            placa o número de serie.
          </li>
        </ul>
        <p>
          En estos casos la tienda cubre todo el costo de retorno y puedes elegir entre el reemplazo
          del producto o el reembolso completo, incluido el envío.
        </p>
      </>
    ),
  },
  {
    id: 'devolucion-o-garantia',
    title: 'Devolución o garantía',
    content: (
      <p>
        Si un producto falla después del plazo de devolución, el caso se atiende por garantía y no
        por devolución. La cobertura de cada condición (nuevo, reacondicionado o usado) está en la
        sección de garantía de los <Link to="/terminos">términos y condiciones</Link>.
      </p>
    ),
  },
  {
    id: 'procedimiento',
    title: 'Cómo solicitar una devolución',
    content: (
      <ol>
        <li>
          Escribe a <a href="mailto:info@maquinariacr.com">info@maquinariacr.com</a> con tu número
          de orden (por ejemplo, MCR-20261020-7KQ4M2XA), el producto, el motivo y fotos del
          producto.
        </li>
        <li>
          En un máximo de 3 días hábiles te respondemos si la solicitud procede y cómo se hará el
          retorno.
        </li>
        <li>
          Los repuestos se envían o se entregan en una de nuestras sedes. La maquinaria se recoge en
          el mismo lugar de entrega, en una fecha coordinada contigo.
        </li>
        <li>Revisamos el producto para confirmar que cumple las condiciones.</li>
        <li>Te informamos el resultado y aplicamos el reembolso o el cambio.</li>
      </ol>
    ),
  },
  {
    id: 'reembolsos',
    title: 'Reembolsos y cambios',
    content: (
      <>
        <ul>
          <li>
            El reembolso se aplica a la misma tarjeta usada en la compra, en un máximo de 10 días
            hábiles después de aprobada la devolución.
          </li>
          <li>Se reembolsa el precio pagado por el producto, con su IVA.</li>
          <li>
            El costo del envío original se reembolsa solo si el motivo es un defecto, un daño de
            transporte o un error de la tienda.
          </li>
          <li>
            Cuando la devolución es por cambio de opinión, el costo del retorno corre por cuenta del
            cliente y se calcula con la misma tarifa por peso de la{' '}
            <Link to="/envios">política de envíos</Link>.
          </li>
          <li>
            Si devuelves parte de una compra mayorista y las unidades que conservas ya no alcanzan
            el mínimo del descuento por volumen, el reembolso se calcula con el precio que
            corresponde a esa nueva cantidad.
          </li>
        </ul>
        <p>
          En lugar del reembolso puedes pedir el cambio por otro producto. Si tiene un precio
          distinto, se cobra o se reembolsa la diferencia.
        </p>
      </>
    ),
  },
]

function Devoluciones() {
  return (
    <PolicyLayout
      eyebrow="Políticas"
      title="Política de devoluciones"
      intro="Plazos, condiciones y pasos para devolver un producto comprado en la tienda."
      updatedAt="octubre de 2026"
      sections={SECTIONS}
    />
  )
}

export default Devoluciones