import PolicyLayout from '../components/PolicyLayout'

/**
 * Nombre: Privacidad
 * Descripción: Página "Política de privacidad". Contenido pendiente (Tarea 2 del Laboratorio 4).
 *              Cada sección es un objeto { id, title, content }; el índice de
 *              la página se arma solo a partir de esta lista.
 */
const SECTIONS = [
  {
    id: 'datos-recopilados',
    title: 'Datos que recopilamos',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'uso-de-los-datos',
    title: 'Uso de los datos',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'proteccion-de-los-datos',
    title: 'Protección de los datos',
    content: <p>Contenido pendiente.</p>,
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
