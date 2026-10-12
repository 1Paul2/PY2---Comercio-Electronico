import { useEffect } from 'react'

/**
 * Nombre: useWarnBeforeLeave
 * Descripción: Mientras `active` sea true, el navegador pide confirmación si
 *              el usuario intenta recargar o cerrar la pestaña. Se usa
 *              durante el procesamiento del pago para que una recarga
 *              accidental no interrumpa el cobro ni lleve a enviarlo dos
 *              veces. El texto del aviso lo decide el navegador.
 * Entradas: active: boolean.
 * Salidas: No devuelve nada.
 * Excepciones: No lanza.
 */
export function useWarnBeforeLeave(active) {
  useEffect(() => {
    if (!active) return undefined

    function handleBeforeUnload(event) {
      event.preventDefault()
      // Algunos navegadores aún requieren returnValue para mostrar el aviso.
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [active])
}
