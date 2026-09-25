import { createContext, useContext, useReducer, useMemo } from 'react'

/**
 * Nombre: CartContext
 * Descripción: Estado global del carrito de compras.
 *              Maneja agregar, incrementar, decrementar y eliminar productos.
 *
 * Comportamiento documentado (según punto 2.4 del enunciado):
 *   - La cantidad de un producto NUNCA baja de 1 mientras esté en el carrito.
 *   - Si se intenta decrementar estando en 1, la cantidad se mantiene en 1
 *     y se genera un mensaje descriptivo indicando que debe
 *     usarse la opción "Eliminar" para quitar el producto por completo.
 *   - Para sacar un producto del carrito debe usarse explícitamente REMOVE_ITEM.
 *
 */

const CartContext = createContext(null)

const initialState = {
  items: [], // { id, name, price, image, quantity }
  lastMessage: null, // feedback descriptivo para la UI (ej: toast al agregar, o al topar el mínimo)
}

function calculateSubtotal(item) {
  return item.price * item.quantity
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { id, name, price, image } = action.payload
      const existing = state.items.find((item) => item.id === id)

      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
          ),
          lastMessage: `Se agregó otra unidad de "${name}" al carrito`,
        }
      }

      return {
        ...state,
        items: [...state.items, { id, name, price, image, quantity: 1 }],
        lastMessage: `"${name}" se agregó al carrito`,
      }
    }

    case 'INCREMENT': {
      const item = state.items.find((item) => item.id === action.payload.id)
      if (!item) return state

      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
        lastMessage: null,
      }
    }

    case 'DECREMENT': {
      const item = state.items.find((item) => item.id === action.payload.id)
      if (!item) return state

      if (item.quantity <= 1) {
        return {
          ...state,
          lastMessage: `"${item.name}" ya está en la cantidad mínima (1). Usá "Eliminar" si querés quitarlo del carrito.`,
        }
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ),
        lastMessage: null,
      }
    }

    case 'REMOVE_ITEM': {
      const item = state.items.find((item) => item.id === action.payload.id)

      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
        lastMessage: item ? `Producto "${item.name}" eliminado correctamente` : null,
      }
    }

    case 'CLEAR_CART': {
      return {
        ...state,
        items: [],
        lastMessage: 'El carrito se vació',
      }
    }

    case 'CLEAR_MESSAGE': {
      return {
        ...state,
        lastMessage: null,
      }
    }

    // Para Tayler (: al recuperar el carrito de localStorage
    // tras recargar la página, se puede despachar esta acción con los
    // items guardados en vez de reconstruir el reducer desde cero.
    case 'HYDRATE_CART': {
      return {
        ...state,
        items: action.payload.items || [],
      }
    }

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const value = useMemo(() => {
    const itemCount = state.items.reduce((total, item) => total + item.quantity, 0)
    const subtotal = state.items.reduce((total, item) => total + calculateSubtotal(item), 0)

    return {
      items: state.items,
      lastMessage: state.lastMessage,
      itemCount,
      subtotal,

      addItem: (product) => dispatch({ type: 'ADD_ITEM', payload: product }),
      increment: (id) => dispatch({ type: 'INCREMENT', payload: { id } }),
      decrement: (id) => dispatch({ type: 'DECREMENT', payload: { id } }),
      removeItem: (id) => {
        const item = state.items.find((item) => item.id === id)
        const name = item ? item.name : 'este producto'

        // Confirmación antes de eliminar, según lo pedido en el laboratorio.
        const confirmed = window.confirm(`¿Estás seguro de eliminar "${name}" del carrito?`)
        if (!confirmed) return

        dispatch({ type: 'REMOVE_ITEM', payload: { id } })
      },
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      clearMessage: () => dispatch({ type: 'CLEAR_MESSAGE' }),
      hydrateCart: (items) => dispatch({ type: 'HYDRATE_CART', payload: { items } }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de un <CartProvider>')
  }
  return context
}