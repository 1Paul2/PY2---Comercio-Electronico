import PolicyLayout from '../components/PolicyLayout'

/**
 * Nombre: Terminos
 * Descripción: Página "Términos y condiciones". Contenido pendiente (Tarea 2 del Laboratorio 4).
 *              Cada sección es un objeto { id, title, content }; el índice de
 *              la página se arma solo a partir de esta lista.
 */
const SECTIONS = [
  {
    id: 'uso-del-sitio',
    title: 'Uso del sitio',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'condiciones-de-compra',
    title: 'Condiciones de compra',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'responsabilidades-del-cliente',
    title: 'Responsabilidades del cliente',
    content: <p>Contenido pendiente.</p>,
  },
  {
    id: 'responsabilidades-de-la-tienda',
    title: 'Responsabilidades de la tienda',
    content: <p>Contenido pendiente.</p>,
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
