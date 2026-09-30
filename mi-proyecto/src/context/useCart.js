import { createContext, useContext } from 'react'

/**
 * Contexto del carrito. Vive en este archivo (y no en CartContext.jsx) para
 * que CartContext.jsx exporte solo componentes y el Fast Refresh de Vite
 * funcione al editarlo.
 */
export const CartContext = createContext(null)

/**
 * Nombre: useCart
 * Descripción: Da acceso al estado y a las acciones del carrito desde
 *              cualquier componente, sin pasar props.
 * Entradas: No recibe parámetros.
 * Salidas: Objeto con items, montos calculados y acciones del carrito.
 * Excepciones: Lanza un error si se usa fuera de un <CartProvider>.
 */
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de un <CartProvider>')
  }
  return context
}
