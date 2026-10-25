import PolicyLayout from '../components/PolicyLayout'

/**
 * Nombre: PreguntasFrecuentes
 * Descripción: Página "Preguntas frecuentes" con formato desplegable (details/summary).
 */
const SECTIONS = [
  {
    id: 'compras',
    title: 'Compras',
    content: (
      <details className="policy-faq">
        <summary>¿Necesito crear una cuenta para comprar?</summary>
        <p>
          No. Puedes navegar el catálogo y comprar sin registrarte. Solo te pediremos tus datos 
          de contacto y entrega al finalizar el checkout.
        </p>
      </details>
    ),
  },
  {
    id: 'pagos',
    title: 'Pagos',
    content: (
      <details className="policy-faq">
        <summary>¿Qué métodos de pago aceptan?</summary>
        <p>
          Aceptamos tarjetas de crédito y débito a través de nuestro procesador de pagos seguro. 
          No guardamos los datos de tu tarjeta en la tienda.
        </p>
      </details>
    ),
  },
  {
    id: 'envios',
    title: 'Envíos',
    content: (
      <details className="policy-faq">
        <summary>¿Cuánto cuesta el envío?</summary>
        <p>
          El costo se calcula según el peso de tu pedido a razón de ₡30 por kilogramo, con un 
          mínimo de ₡3 500. El monto exacto se muestra en el resumen antes de pagar.
        </p>
      </details>
    ),
  },
  {
    id: 'devoluciones',
    title: 'Devoluciones',
    content: (
      <details className="policy-faq">
        <summary>¿Puedo devolver un producto si no era lo que esperaba?</summary>
        <p>
          Sí, los productos nuevos y reacondicionados se pueden devolver dentro de los 15 días 
          siguientes a la entrega, siempre que no hayan sido instalados o puestos a trabajar. 
          La maquinaria usada solo se acepta si no coincide con la ficha técnica.
        </p>
      </details>
    ),
  },
  {
    id: 'atencion',
    title: 'Atención al cliente',
    content: (
      <details className="policy-faq">
        <summary>¿Cómo puedo contactarlos si tengo un problema con mi pedido?</summary>
        <p>
          Escríbenos a <a href="mailto:info@maquinariacr.com">info@maquinariacr.com</a> con tu 
          número de orden. Te responderemos en un máximo de 3 días hábiles.
        </p>
      </details>
    ),
  },
]

function PreguntasFrecuentes() {
  return (
    <PolicyLayout
      eyebrow="Ayuda"
      title="Preguntas frecuentes"
      intro="Respuestas rápidas sobre compras, pagos, envíos, devoluciones y atención al cliente."
      updatedAt="octubre de 2026"
      sections={SECTIONS}
    />
  )
}

export default PreguntasFrecuentes