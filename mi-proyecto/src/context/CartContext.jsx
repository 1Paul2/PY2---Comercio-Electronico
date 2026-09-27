import { createContext, useContext, useEffect, useReducer, useMemo } from 'react'

/**
 * Nombre: CartContext
 * Descripción: Estado global del carrito de compras.
 *              Maneja agregar, incrementar, decrementar y eliminar productos.
 *
 * Comportamiento documentado (según punto 2.4 del enunciado):
 *   - La cantidad de un producto se limita al stock máximo conocido.
 *   - Si se decrementa una línea que tiene 1 unidad, la línea se elimina.
 *
 */

const CartContext = createContext(null)
const CART_STORAGE_KEY = 'maquinaria-cr-cart'

const initialState = {
  items: [], // { id, name, price, image, quantity }
  lastMessage: null, // feedback descriptivo para la UI (ej: toast al agregar, o al topar el mínimo)
}

function getInitialState() {
  try {
    const storedItems = localStorage.getItem(CART_STORAGE_KEY)
    const items = storedItems ? JSON.parse(storedItems) : []

    return Array.isArray(items) ? { ...initialState, items } : initialState
  } catch {
    return initialState
  }
}

function calculateSubtotal(item) {
  return item.price * item.quantity
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { id, name, price, image, quantity = 1, maxStock } = action.payload
      const existing = state.items.find((item) => item.id === id)
      const requestedQuantity = Math.max(1, Math.floor(quantity))
      const stockLimit = Number.isFinite(maxStock) ? maxStock : existing?.maxStock

      if (existing) {
        const available = Number.isFinite(stockLimit)
          ? Math.max(0, stockLimit - existing.quantity)
          : requestedQuantity
        const addedQuantity = Math.min(requestedQuantity, available)

        if (addedQuantity === 0) {
          return {
            ...state,
            lastMessage: `No se agregaron unidades de "${name}" porque ya no hay stock disponible`,
          }
        }

        return {
          ...state,
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, maxStock: stockLimit ?? item.maxStock, quantity: item.quantity + addedQuantity }
              : item
          ),
          lastMessage:
            addedQuantity < requestedQuantity
              ? `Solo se agregaron ${addedQuantity} unidades de "${name}" debido a limitantes de stock`
              : `Se agregaron ${addedQuantity} unidades de "${name}" al carrito`,
        }
      }

      const addedQuantity = Number.isFinite(stockLimit)
        ? Math.min(requestedQuantity, Math.max(0, stockLimit))
        : requestedQuantity

      if (addedQuantity === 0) {
        return {
          ...state,
          lastMessage: `No se agregó "${name}" porque no hay stock disponible`,
        }
      }

      return {
        ...state,
        items: [...state.items, { id, name, price, image, quantity: addedQuantity, maxStock: stockLimit }],
        lastMessage:
          addedQuantity < requestedQuantity
            ? `Solo se agregaron ${addedQuantity} unidades de "${name}" debido a limitantes de stock`
            : `"${name}" se agregó al carrito`,
      }
    }

    case 'INCREMENT': {
      const item = state.items.find((item) => item.id === action.payload.id)
      if (!item) return state

      if (Number.isFinite(item.maxStock) && item.quantity >= item.maxStock) {
        return {
          ...state,
          lastMessage: `No hay más unidades disponibles de "${item.name}"`,
        }
      }

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
          items: state.items.filter((cartItem) => cartItem.id !== action.payload.id),
          lastMessage: `Producto "${item.name}" eliminado correctamente`,
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
  const [state, dispatch] = useReducer(cartReducer, undefined, getInitialState)

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

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