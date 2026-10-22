import PolicyLayout from '../components/PolicyLayout'

/**
 * Nombre: Devoluciones
 * Descripción: Página "Política de devoluciones". Contenido pendiente (Tarea 2 del Laboratorio 4).
 *              Cada sección es un objeto { id, title, content }; el índice de
 *              la página se arma solo a partir de esta lista.
 */
const SECTIONS = [
  {
    id: 'plazo',
    title: 'Plazo para devolver',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'condiciones',
    title: 'Condiciones del producto',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'casos-no-aceptados',
    title: 'Casos en que no se aceptan devoluciones',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'procedimiento',
    title: 'Cómo solicitar una devolución',
    content: <p>Contenido pendiente.</p>,
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
