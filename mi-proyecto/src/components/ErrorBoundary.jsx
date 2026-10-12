import { Component } from 'react'
import '../styles/NotFound.css'

/**
 * Nombre: ErrorBoundary
 * Descripción: Atrapa cualquier error inesperado al dibujar una pantalla.
 *              Sin este componente, React deja la página completamente en
 *              blanco cuando algo falla; con él, el usuario ve un mensaje
 *              comprensible y opciones para continuar. No muestra detalles
 *              técnicos en pantalla: el error solo se registra en la consola.
 *              App lo monta con key = ruta actual, así que al navegar a otra
 *              página el error se descarta automáticamente.
 * Entradas: children: contenido a proteger.
 * Salidas: children, o la pantalla de error si algo falló.
 * Excepciones: No lanza.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
    this.handleRetry = this.handleRetry.bind(this)
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Error inesperado:', error, info?.componentStack)
  }

  handleRetry() {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="not-found" role="alert">
        <div className="not-found__box">
          <p className="not-found__code">¡Ups!</p>
          <h1>Algo salió mal</h1>
          <p className="not-found__text">
            Ocurrió un problema inesperado al mostrar esta página. Tu carrito y tus
            órdenes siguen guardados. Puedes intentarlo de nuevo o volver al inicio.
          </p>
          <div className="not-found__actions">
            <button type="button" className="not-found__button" onClick={this.handleRetry}>
              Intentar de nuevo
            </button>
            <a className="not-found__link" href="#/">
              Ir al inicio
            </a>
          </div>
        </div>
      </main>
    )
  }
}

export default ErrorBoundary
