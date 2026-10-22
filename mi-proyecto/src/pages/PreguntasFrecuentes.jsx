import PolicyLayout from '../components/PolicyLayout'

/**
 * Nombre: PreguntasFrecuentes
 * Descripción: Página "Preguntas frecuentes". Contenido pendiente (Tarea 3 del Laboratorio 4).
 *              Cada sección es un objeto { id, title, content }; el índice de
 *              la página se arma solo a partir de esta lista.
 */
const SECTIONS = [
  {
    id: 'compras',
    title: 'Compras',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'pagos',
    title: 'Pagos',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'envios',
    title: 'Envíos',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'devoluciones',
    title: 'Devoluciones',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'atencion',
    title: 'Atención al cliente',
    content: <p>Contenido pendiente.</p>,
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
