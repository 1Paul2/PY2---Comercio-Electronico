import { useCart } from '../context/useCart'
import NoticeToast from './NoticeToast'

const NOTICE_TONES = {
  warning: { tone: 'warning', icon: '!', title: 'Revisa tu carrito' },
  info: { tone: 'info', icon: 'i', title: 'Carrito actualizado' },
}

/**
 * Nombre: CartNotice
 * Descripción: Muestra los avisos del carrito que el usuario debe leer: por
 *              ejemplo, que no puede bajar del pedido mínimo B2B, que no hay
 *              más stock o que los precios cambiaron al iniciar sesión. Los
 *              avisos de éxito al agregar no se muestran aquí (el encabezado
 *              ya anima el ícono del carrito).
 * Entradas: No recibe parámetros.
 * Salidas: JSX del aviso o null.
 * Excepciones: No hay.
 */
function CartNotice() {
  const { lastMessage, lastMessageType, clearMessage } = useCart()
  const config = NOTICE_TONES[lastMessageType]
  if (!lastMessage || !config) return null

  return (
    <NoticeToast
      key={lastMessage}
      tone={config.tone}
      icon={config.icon}
      title={config.title}
      message={lastMessage}
      onAccept={clearMessage}
    />
  )
}

export default CartNotice
