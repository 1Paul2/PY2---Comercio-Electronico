import PolicyLayout from '../components/PolicyLayout'

/**
 * Nombre: Envios
 * Descripción: Página "Política de envíos". Contenido pendiente (Tarea 3 del Laboratorio 4).
 *              Cada sección es un objeto { id, title, content }; el índice de
 *              la página se arma solo a partir de esta lista.
 */
const SECTIONS = [
  {
    id: 'cobertura',
    title: 'Cobertura',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'tiempos',
    title: 'Tiempos de entrega',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'costos',
    title: 'Costos de envío',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'restricciones',
    title: 'Restricciones',
    content: <p>Contenido pendiente.</p>,
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
