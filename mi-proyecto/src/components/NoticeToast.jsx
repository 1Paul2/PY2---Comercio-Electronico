import { useEffect, useRef, useState } from 'react'
import '../styles/NoticeToast.css'

/**
 * Nombre: NoticeToast
 * Descripción: Aviso que entra desde la izquierda en la esquina superior de
 *              la pantalla. No oscurece ni bloquea la página (se puede seguir
 *              viendo y usando). Se cierra con el botón "Aceptar" o, si se
 *              indica autoCloseMs, se cierra solo al pasar ese tiempo. Al
 *              cerrarse, sale deslizándose hacia la izquierda (por donde
 *              entró) y recién al terminar esa animación avisa con onAccept.
 *              Usa role="alert" para que los lectores de pantalla lo
 *              anuncien sin mover el foco.
 * Entradas:
 *   - tone: 'success' | 'danger' | 'warning' | 'info' (color del aviso).
 *   - icon: ícono a mostrar en el círculo.
 *   - title: título del aviso.
 *   - message: texto principal.
 *   - children (opcional): contenido extra debajo del mensaje.
 *   - onAccept: se llama al presionar "Aceptar" o al cumplirse autoCloseMs.
 *   - autoCloseMs (opcional): milisegundos tras los cuales se cierra solo.
 * Salidas: JSX del aviso.
 * Excepciones: No hay.
 */
function NoticeToast({ tone = 'info', icon, title, message, children, onAccept, autoCloseMs }) {
  // Se guarda la función en una ref para que el temporizador no se reinicie
  // cada vez que el componente padre vuelve a dibujarse.
  const onAcceptRef = useRef(onAccept)
  useEffect(() => {
    onAcceptRef.current = onAccept
  }, [onAccept])

  // true mientras se reproduce la animación de salida.
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!autoCloseMs) return undefined
    const timeoutId = window.setTimeout(() => setLeaving(true), autoCloseMs)
    return () => window.clearTimeout(timeoutId)
  }, [autoCloseMs])

  // Si el usuario pidió menos movimiento no hay animación de salida: se
  // cierra de inmediato.
  useEffect(() => {
    if (!leaving) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onAcceptRef.current?.()
    }
  }, [leaving])

  function handleAnimationEnd(event) {
    if (leaving && event.animationName === 'notice-toast-out') {
      onAcceptRef.current?.()
    }
  }

  return (
    <section
      className={`notice-toast notice-toast--${tone}${leaving ? ' notice-toast--leaving' : ''}`}
      onAnimationEnd={handleAnimationEnd}
      role="alert"
      aria-labelledby="notice-toast-title"
      aria-describedby="notice-toast-message"
    >
      <span className="notice-toast__icon" aria-hidden="true">{icon}</span>
      <div className="notice-toast__text">
        <h2 id="notice-toast-title" className="notice-toast__title">{title}</h2>
        <p id="notice-toast-message" className="notice-toast__message">{message}</p>
        {children}
        <button
          type="button"
          className="notice-toast__accept"
          onClick={() => setLeaving(true)}
          disabled={leaving}
        >
          Aceptar
        </button>
      </div>
    </section>
  )
}

export default NoticeToast
