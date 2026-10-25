import { Link } from 'react-router-dom'
import PolicyLayout from '../components/PolicyLayout'
import { TERMS_VERSION } from '../features/policies/policyPages'

/**
 * Nombre: Terminos
 * Descripción: Página "Términos y condiciones".
 *              Cada sección es un objeto { id, title, content }; el índice de
 *              la página se arma solo a partir de esta lista.
 */
const SECTIONS = [
  {
    id: 'sobre-la-tienda',
    title: 'Sobre Maquinaria CR',
    content: (
      <>
        <p>
          Maquinaria CR es una tienda en línea que vende maquinaria pesada y repuestos a personas,
          empresas y contratistas en Costa Rica. El inventario se distribuye entre nuestras sedes de
          San José, Alajuela y Cartago Centro.
        </p>
        <p>
          Para cualquier consulta sobre estos términos o sobre una compra, escríbenos a{' '}
          <a href="mailto:info@maquinariacr.com">info@maquinariacr.com</a>.
        </p>
        <p>
          Las marcas de los productos (por ejemplo, de excavadoras o tractores) pertenecen a sus
          fabricantes. Maquinaria CR las comercializa como distribuidor y no es representante
          oficial de esas marcas.
        </p>
      </>
    ),
  },
  {
    id: 'uso-del-sitio',
    title: 'Condiciones de uso del sitio',
    content: (
      <>
        <p>Al navegar el sitio o hacer una compra, aceptas estos términos.</p>
        <ul>
          <li>
            El sitio se puede usar para consultar productos, comparar precios y comprar. No hace
            falta crear una cuenta.
          </li>
          <li>
            No está permitido usar el sitio para fines fraudulentos, hacer compras con datos de
            otra persona, intentar acceder a partes no públicas ni interferir con su
            funcionamiento.
          </li>
          <li>
            Los textos, el diseño y la organización del catálogo pertenecen a Maquinaria CR y no se
            pueden copiar para otros fines comerciales.
          </li>
          <li>
            Las fotos son de referencia. Las especificaciones que rigen la compra son las de la
            ficha de cada producto: marca, año, condición, peso y potencia, entre otras.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'condiciones-de-compra',
    title: 'Condiciones generales de compra',
    content: (
      <>
        <h3>Condición de los productos</h3>
        <p>Cada ficha indica la condición del producto:</p>
        <ul>
          <li>
            <strong>Nuevo:</strong> sin uso previo, tal como sale del fabricante.
          </li>
          <li>
            <strong>Reacondicionado:</strong> revisado y reparado por nuestro taller, con las piezas
            de desgaste reemplazadas.
          </li>
          <li>
            <strong>Usado:</strong> se vende en el estado descrito en la ficha, según su año y uso
            previo. Solo aplica a maquinaria, no a repuestos.
          </li>
        </ul>

        <h3>Precios e impuestos</h3>
        <p>
          Los precios están en colones costarricenses (₡). Antes de pagar se muestra el desglose
          completo de la compra: subtotal, IVA del 13% y costo de envío. Ese mismo desglose aparece
          en el comprobante.
        </p>

        <h3>Precio mayorista y descuentos por volumen</h3>
        <p>
          Algunos productos tienen precio mayorista, que aplica a partir de la cantidad mínima
          indicada en su ficha. Algunos ofrecen además descuentos adicionales al comprar más
          unidades. El descuento que corresponde se calcula y se muestra antes de agregar el
          producto al carrito.
        </p>

        <h3>Errores en los precios</h3>
        <p>
          Si un producto se publica con un precio claramente equivocado, por ejemplo por un error
          de digitación, la tienda puede cancelar el pedido y reembolsar el monto completo. Te
          avisaremos antes de cualquier cobro adicional; nunca se cobra un monto distinto al que
          aceptaste.
        </p>

        <h3>Disponibilidad</h3>
        <p>
          Todo pedido está sujeto al stock disponible. El carrito no permite agregar más unidades
          de las que hay en existencia.
        </p>

        <h3>Pago y confirmación del pedido</h3>
        <p>
          El pago se realiza con tarjeta al finalizar el checkout. Cada compra recibe un número de
          orden que aparece en el comprobante. La orden queda en uno de estos estados:
        </p>
        <ul>
          <li>
            <strong>Pendiente:</strong> la orden está registrada y espera un pago aprobado.
          </li>
          <li>
            <strong>Confirmada:</strong> el emisor de la tarjeta aprobó el cobro y la compra quedó
            cerrada.
          </li>
          <li>
            <strong>Cancelada:</strong> el pago fue rechazado. No se genera ningún cargo y puedes
            intentarlo de nuevo.
          </li>
        </ul>

        <h3>Aceptación de estos términos</h3>
        <p>
          Para finalizar una compra debes aceptar estos términos en el checkout. La aceptación queda
          registrada en la orden junto con la versión de los términos vigente en ese momento.
        </p>

        <h3>Envío</h3>
        <p>
          El costo de envío se calcula según el peso del pedido y se muestra antes de pagar. Los
          detalles están en la <Link to="/envios">política de envíos</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'cancelaciones',
    title: 'Cancelación de pedidos',
    content: (
      <>
        <p>
          Puedes cancelar un pedido confirmado mientras no haya salido a entrega. Escribe a{' '}
          <a href="mailto:info@maquinariacr.com">info@maquinariacr.com</a> con tu número de orden y
          se reembolsa el monto completo, incluido el envío.
        </p>
        <p>
          Si el pedido ya salió a entrega, la solicitud se trata como una devolución, según la{' '}
          <Link to="/devoluciones">política de devoluciones</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'garantia',
    title: 'Garantía',
    content: (
      <>
        <p>La garantía cubre fallas de funcionamiento que no se deban a mal uso:</p>
        <div className="policy-table-wrap">
          <table className="policy-table">
            <thead>
              <tr>
                <th scope="col">Condición</th>
                <th scope="col">Garantía</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nuevo</td>
                <td>La del fabricante. La tienda gestiona el reclamo por ti.</td>
              </tr>
              <tr>
                <td>Reacondicionado</td>
                <td>6 meses de garantía de la tienda sobre las piezas reparadas o reemplazadas.</td>
              </tr>
              <tr>
                <td>Usado</td>
                <td>30 días de garantía de la tienda sobre motor, transmisión y sistema hidráulico.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          La garantía no cubre el desgaste normal, los daños por operación indebida, la falta de
          mantenimiento ni las reparaciones hechas por talleres no autorizados.
        </p>
      </>
    ),
  },
  {
    id: 'responsabilidades-del-cliente',
    title: 'Responsabilidades del cliente',
    content: (
      <ul>
        <li>Dar datos de contacto y una dirección de entrega correctos y completos.</li>
        <li>Revisar el pedido antes de pagar: productos, condición, cantidades y totales.</li>
        <li>
          Garantizar que el lugar de entrega tenga acceso y espacio suficientes para descargar
          maquinaria pesada.
        </li>
        <li>
          Contar con los permisos que exija la ley para circular u operar la maquinaria, y que la
          opere personal capacitado con el equipo de seguridad adecuado.
        </li>
        <li>
          Instalar los repuestos según las indicaciones del fabricante, idealmente con un técnico
          calificado.
        </li>
        <li>Revisar el pedido al recibirlo e informar cualquier daño o faltante lo antes posible.</li>
      </ul>
    ),
  },
  {
    id: 'responsabilidades-de-la-tienda',
    title: 'Responsabilidades de la tienda',
    content: (
      <>
        <ul>
          <li>Describir cada producto con información veraz sobre su condición y especificaciones.</li>
          <li>Mostrar precios, impuestos y costos de envío de forma clara antes del pago.</li>
          <li>Entregar los productos comprados en las condiciones y plazos indicados.</li>
          <li>Atender garantías, cancelaciones y reclamos en los plazos de estas políticas.</li>
          <li>
            Proteger los datos personales según la <Link to="/privacidad">política de privacidad</Link>.
          </li>
          <li>
            Atender devoluciones según la <Link to="/devoluciones">política de devoluciones</Link>.
          </li>
        </ul>
        <h3>Límite de responsabilidad</h3>
        <p>
          La tienda no se hace responsable por daños causados por una instalación incorrecta, por un
          uso distinto al indicado por el fabricante ni por pérdidas indirectas, como días de obra
          detenida. En cualquier caso, la responsabilidad de la tienda se limita al monto pagado por
          el producto.
        </p>
      </>
    ),
  },
  {
    id: 'cambios-y-reclamos',
    title: 'Cambios a estos términos y reclamos',
    content: (
      <>
        <p>
          La tienda puede actualizar estos términos. Cada cambio se publica en esta página con una
          nueva versión y fecha. A cada compra le aplica la versión que aceptaste en el checkout,
          que queda guardada en tu orden. Versión vigente: <strong>{TERMS_VERSION}</strong>.
        </p>
        <p>
          Si tienes un reclamo, escríbenos a{' '}
          <a href="mailto:info@maquinariacr.com">info@maquinariacr.com</a> con tu número de orden.
          Te respondemos en un máximo de 3 días hábiles. Estos términos se rigen por las leyes de
          Costa Rica.
        </p>
      </>
    ),
  },
]

function Terminos() {
  return (
    <PolicyLayout
      eyebrow="Políticas"
      title="Términos y condiciones"
      intro="Reglas de uso del sitio y condiciones que aplican a cada compra en Maquinaria CR."
      updatedAt="octubre de 2026"
      sections={SECTIONS}
    />
  )
}

export default Terminos