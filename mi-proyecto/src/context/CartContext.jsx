import { useEffect, useReducer, useMemo } from 'react'
import { CartContext } from './useCart'

/**
 * Nombre: CartContext
 * Descripción: Estado global del carrito de compras.
 *              Maneja agregar, incrementar, decrementar y eliminar productos.
 *
 * Comportamiento documentado (punto 2.4 del enunciado):
 *   - Cada producto ocupa una sola línea, identificada por su id. Agregar un
 *     producto que ya está en el carrito suma unidades a esa línea.
 *   - La cantidad de un producto se limita al stock máximo conocido.
 *   - La cantidad nunca baja de 1. Si se presiona "−" con 1 unidad, el
 *     producto NO se elimina ni queda en 0: la vista del carrito pide
 *     confirmación explícita y solo se elimina si el usuario la acepta.
 *
 * Persistencia (punto 2.9): solo se guardan los items en localStorage. Los
 * montos (subtotal, IVA) se recalculan siempre a partir de ellos.
 */

const CART_STORAGE_KEY = 'maquinaria-cr-cart'
const IVA_RATE = 0.13

const initialState = {
  items: [],
  lastMessage: null,
  lastMessageType: null,
  lastAddId: 0,
}

/**
 * Nombre: isValidStoredItem
 * Descripción: Verifica que un item leído de localStorage tenga los datos
 *              mínimos para mostrarse y calcular montos sin errores.
 * Entradas: item: valor leído del almacenamiento.
 * Salidas: true si el item es utilizable, false si debe descartarse.
 * Excepciones: No hay.
 */
function isValidStoredItem(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    item.id !== undefined &&
    item.id !== null &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1
  )
}

/**
 * Nombre: getInitialState
 * Descripción: Recupera el carrito guardado en localStorage al cargar la app.
 *              Descarta los items inválidos (por ejemplo, si el dato fue
 *              editado a mano o viene de una versión anterior).
 * Entradas: No recibe parámetros.
 * Salidas: Estado inicial del reducer con los items recuperados.
 * Excepciones: Si localStorage no está disponible o el JSON está corrupto,
 *              devuelve un carrito vacío en vez de romper la aplicación.
 */
function getInitialState() {
  try {
    const storedItems = localStorage.getItem(CART_STORAGE_KEY)
    const items = storedItems ? JSON.parse(storedItems) : []

    return Array.isArray(items) ? { ...initialState, items: items.filter(isValidStoredItem) } : initialState
  } catch {
    return initialState
  }
}

function calculateSubtotal(item) {
  return item.price * item.quantity
}

function formatAddedMessage(quantity, name, isPartial = false) {
  const unitLabel = quantity === 1 ? 'unidad' : 'unidades'
  const verb = quantity === 1 ? 'se agregó' : 'se agregaron'
  const prefix = isPartial ? 'Solo ' : ''

  return `${prefix}${quantity} ${unitLabel} de "${name}" ${verb} al carrito`
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
            lastMessageType: 'warning',
          }
        }

        return {
          ...state,
          lastAddId: state.lastAddId + 1,
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, maxStock: stockLimit ?? item.maxStock, quantity: item.quantity + addedQuantity }
              : item
          ),
          lastMessage:
            addedQuantity < requestedQuantity
              ? `${formatAddedMessage(addedQuantity, name, true)} debido a limitantes de stock`
              : formatAddedMessage(addedQuantity, name),
          lastMessageType: addedQuantity < requestedQuantity ? 'warning' : 'success',
        }
      }

      const addedQuantity = Number.isFinite(stockLimit)
        ? Math.min(requestedQuantity, Math.max(0, stockLimit))
        : requestedQuantity

      if (addedQuantity === 0) {
        return {
          ...state,
          lastMessage: `No se agregó "${name}" porque no hay stock disponible`,
          lastMessageType: 'warning',
        }
      }

      return {
        ...state,
        lastAddId: state.lastAddId + 1,
        items: [...state.items, { id, name, price, image, quantity: addedQuantity, maxStock: stockLimit }],
        lastMessage:
          addedQuantity < requestedQuantity
            ? `${formatAddedMessage(addedQuantity, name, true)} debido a limitantes de stock`
            : formatAddedMessage(addedQuantity, name),
        lastMessageType: addedQuantity < requestedQuantity ? 'warning' : 'success',
      }
    }

    case 'INCREMENT': {
      const item = state.items.find((item) => item.id === action.payload.id)
      if (!item) return state

      if (Number.isFinite(item.maxStock) && item.quantity >= item.maxStock) {
        return {
          ...state,
          lastMessage: `No hay más unidades disponibles de "${item.name}"`,
          lastMessageType: 'warning',
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
        lastMessageType: null,
      }
    }

    case 'DECREMENT': {
      const item = state.items.find((item) => item.id === action.payload.id)
      if (!item) return state

      if (item.quantity <= 1) {
        return {
          ...state,
          lastMessage: null,
          lastMessageType: null,
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
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
        lastMessage: null,
        lastMessageType: null,
      }
    }

    case 'CLEAR_CART': {
      return {
        ...state,
        items: [],
        lastMessage: 'El carrito se vació',
        lastMessageType: 'success',
      }
    }

    case 'CLEAR_MESSAGE': {
      return {
        ...state,
        lastMessage: null,
        lastMessageType: null,
      }
    }
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
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // Sin localStorage (modo privado o almacenamiento lleno): el carrito
      // sigue funcionando en memoria. Este comentario evita el error no-empty.
    }
  }, [state.items])

  useEffect(() => {
    if (!state.lastMessage) return undefined

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: 'CLEAR_MESSAGE' })
    }, 5000)

    return () => window.clearTimeout(timeoutId)
  }, [state.lastMessage])

  const value = useMemo(() => {
    const itemCount = state.items.reduce((total, item) => total + item.quantity, 0)
    const subtotal = state.items.reduce((total, item) => total + calculateSubtotal(item), 0)
    const iva = Math.round(subtotal * IVA_RATE)
    const subtotalWithIva = subtotal + iva

    return {
      items: state.items,
      lastMessage: state.lastMessage,
      lastMessageType: state.lastMessageType,
      lastAddId: state.lastAddId,
      itemCount,
      subtotal,
      iva,
      subtotalWithIva,

      addItem: (product) => dispatch({ type: 'ADD_ITEM', payload: product }),
      increment: (id) => dispatch({ type: 'INCREMENT', payload: { id } }),
      decrement: (id) => dispatch({ type: 'DECREMENT', payload: { id } }),
      removeItem: (id) => {
        dispatch({ type: 'REMOVE_ITEM', payload: { id } })
      },
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      clearMessage: () => dispatch({ type: 'CLEAR_MESSAGE' }),
      hydrateCart: (items) => dispatch({ type: 'HYDRATE_CART', payload: { items } }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
