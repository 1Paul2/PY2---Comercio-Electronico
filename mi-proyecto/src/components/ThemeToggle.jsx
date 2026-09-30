import { useTheme } from '../context/useTheme'
import '../styles/ThemeToggle.css'

/**
 * Nombre: ThemeToggle
 * Descripción: Permite alternar entre los modos claro y oscuro de la interfaz.
 * Entradas: No recibe parámetros.
 * Salidas: JSX con un botón para cambiar el tema activo.
 * Excepciones: No hay.
 */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
      <span className={`theme-toggle__inner ${theme === 'dark' ? 'is-flipped' : ''}`}>
        <span className="theme-toggle__face theme-toggle__face--front">☀️</span>
        <span className="theme-toggle__face theme-toggle__face--back">🌙</span>
      </span>
    </button>
  )
}

export default ThemeToggle