/**
 * Nombre: LogoIcon
 * Descripción: Ícono de marca (engranaje con orificio hexagonal) usado junto
 * al nombre "Maquinaria CR" en el header. Es un solo <path> vectorial para
 * que se vea nítido en cualquier tamaño y en el degradado amarillo del header.
 * Entradas: className (opcional): clases CSS para controlar tamaño/posición.
 * Salidas: JSX con el SVG del ícono de marca.
 * Excepciones: No hay.
 */
function LogoIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Maquinaria CR"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M25.47,5.80 L38.53,5.80 L36.72,13.08 L42.04,15.29 L45.91,8.86 L55.14,18.09 L48.71,21.96 L50.92,27.28 L58.20,25.47 L58.20,38.53 L50.92,36.72 L48.71,42.04 L55.14,45.91 L45.91,55.14 L42.04,48.71 L36.72,50.92 L38.53,58.20 L25.47,58.20 L27.28,50.92 L21.96,48.71 L18.09,55.14 L8.86,45.91 L15.29,42.04 L13.08,36.72 L5.80,38.53 L5.80,25.47 L13.08,27.28 L15.29,21.96 L8.86,18.09 L18.09,8.86 L21.96,15.29 L27.28,13.08 Z M36.75,23.77 L41.50,32.00 L36.75,40.23 L27.25,40.23 L22.50,32.00 L27.25,23.77 Z"
      />
    </svg>
  )
}

export default LogoIcon
