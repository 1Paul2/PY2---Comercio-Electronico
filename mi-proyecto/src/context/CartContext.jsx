import { useEffect, useReducer, useMemo, useRef } from 'react'
import { CartContext } from './useCart'
import { useSession } from './useSession'
import { EVENT_TYPES, trackEvent } from '../features/activity/activityLog'
import { getSession } from '../features/session/session'
import { ROLES } from '../features/session/roles'
import { priceCartItem, validateCartItem } from '../features/pricing/pricing'

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
 *
 * Precios por rol (proyecto 3, ver features/pricing/pricing.js):
 *   - Cada línea guarda los dos precios del producto (`prices`) y su precio
 *     calculado para el rol actual (priceType, basePrice, unitPrice,
 *     minQuantity). `price` es igual a unitPrice.
 *   - El descuento por volumen B2B se recalcula cada vez que cambia la
 *     cantidad de una línea.
 *   - Un cliente B2B no puede bajar del pedido mínimo con "−": se muestra un
 *     aviso. Para quitar el producto debe usar "Eliminar".
 *   - Cambio de usuario: el carrito recuerda a qué usuario pertenece
 *     (CART_OWNER_STORAGE_KEY). Si un visitante inicia sesión, el carrito se
 *     conserva y sus precios se recalculan con el rol nuevo (las cantidades
 *     B2B suben al mínimo si hace falta). Si entra otro usuario, se cierra la
 *     sesión o entra un administrador (que no compra), el carrito se vacía.
 *
 * Selección para el checkout: cada línea tiene `selected`. Solo las líneas
 * seleccionadas pasan al checkout, y los montos (subtotal, IVA, envío y
 * total) se calculan únicamente sobre ellas. Un producto nuevo (o al que se
 * le agregan unidades) queda seleccionado. Tras una compra aprobada se
 * eliminan solo los productos comprados; los no seleccionados se conservan.
 */

const CART_STORAGE_KEY = 'maquinaria-cr-cart'
const CART_OWNER_STORAGE_KEY = 'maquinaria-cr-cart-owner'
const IVA_RATE = 0.13
const SHIPPING_RATE_PER_KG = 30
const DEFAULT_ITEM_WEIGHT_KG = 5
const MIN_SHIPPING_COST = 3500

const initialState = {
  items: [],
  lastMessage: null,
  lastMessageType: null,
  lastAddId: 0,
  lastAdded: null,
  owner: null,
  role: null,
}

/**
 * Nombre: isValidStoredItem
 * Descripción: Verifica que un item leído de localStorage tenga los datos
 *              mínimos para mostrarse y calcular montos sin errores. Los
 *              carritos de versiones anteriores no traen `prices` y se
 *              descartan: sin los dos precios no se sabe cuánto paga cada rol.
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
    item.prices !== null &&
    typeof item.prices === 'object' &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1
  )
}

/**
 * Nombre: readOwner
 * Descripción: Lee de localStorage el usuario dueño del carrito.
 * Salidas: userId o null (visitante o dato ausente).
 */
function readOwner() {
  try {
    return localStorage.getItem(CART_OWNER_STORAGE_KEY) || null
  } catch {
    return null
  }
}

/**
 * Nombre: repriceForRole
 * Descripción: Recalcula los precios de las líneas para un rol. En B2B, las
 *              cantidades por debajo del mínimo suben al mínimo si el stock
 *              alcanza.
 * Entradas: items: líneas del carrito; role: rol nuevo (o null).
 * Salidas: { items, raisedNames } con los nombres de las líneas ajustadas.
 */
function repriceForRole(items, role) {
  const raisedNames = []
  const repriced = items.map((item) => {
    const priced = priceCartItem(item, role)
    const stock = Number.isFinite(item.maxStock) ? item.maxStock : Infinity
    if (priced.quantity < priced.minQuantity && priced.minQuantity <= stock) {
      raisedNames.push(item.name)
      return priceCartItem(item, role, priced.minQuantity)
    }
    return priced
  })
  return { items: repriced, raisedNames }
}

/**
 * Nombre: getInitialState
 * Descripción: Recupera el carrito guardado en localStorage al cargar la app
 *              y calcula sus precios con el rol de la sesión guardada.
 *              Descarta los items inválidos (por ejemplo, si el dato fue
 *              editado a mano o viene de una versión anterior).
 * Entradas: No recibe parámetros.
 * Salidas: Estado inicial del reducer con los items recuperados.
 * Excepciones: Si localStorage no está disponible o el JSON está corrupto,
 *              devuelve un carrito vacío en vez de romper la aplicación.
 */
function getInitialState() {
  const session = getSession()
  const base = { ...initialState, owner: readOwner(), role: session?.role ?? null }
  try {
    const storedItems = localStorage.getItem(CART_STORAGE_KEY)
    const items = storedItems ? JSON.parse(storedItems) : []

    if (!Array.isArray(items)) return base
    const cleanItems = items.filter(isValidStoredItem).map((item) => ({
      ...item,
      weight_kg: normalizeItemWeight(item.weight_kg),
      selected: item.selected !== false,
    }))
    return { ...base, items: repriceForRole(cleanItems, base.role).items }
  } catch {
    return base
  }
}

function normalizeItemWeight(weight_kg, fallback = DEFAULT_ITEM_WEIGHT_KG) {
  return Number.isFinite(weight_kg) && weight_kg >= 0 ? weight_kg : fallback
}

function calculateSubtotal(item) {
  return Number.isFinite(item.unitPrice) ? item.unitPrice * item.quantity : 0
}

function formatAddedMessage(quantity, name, isPartial = false) {
  const unitLabel = quantity === 1 ? 'unidad' : 'unidades'
  const verb = quantity === 1 ? 'se agregó' : 'se agregaron'
  const prefix = isPartial ? 'Solo ' : ''

  return `${prefix}${quantity} ${unitLabel} de "${name}" ${verb} al carrito`
}

function addedResult(state, items, newLine, addedQuantity, requestedQuantity) {
  const isPartial = addedQuantity < requestedQuantity
  return {
    ...state,
    items,
    lastAddId: state.lastAddId + 1,
    lastAdded: {
      productId: newLine.id,
      name: newLine.name,
      price: newLine.unitPrice,
      priceType: newLine.priceType,
      quantity: addedQuantity,
    },
    lastMessage: isPartial
      ? `${formatAddedMessage(addedQuantity, newLine.name, true)} debido a limitantes de stock`
      : formatAddedMessage(addedQuantity, newLine.name),
    lastMessageType: isPartial ? 'warning' : 'success',
  }
}

function warning(state, message) {
  return { ...state, lastMessage: message, lastMessageType: 'warning' }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const product = action.payload
      const { id, name, quantity = 1, maxStock, weight_kg } = product
      const existing = state.items.find((item) => item.id === id)
      const itemWeight = normalizeItemWeight(weight_kg, existing?.weight_kg)
      const requestedQuantity = Math.max(1, Math.floor(quantity))
      const stockLimit = Number.isFinite(maxStock) ? maxStock : existing?.maxStock

      if (state.role === ROLES.ADMIN) {
        return warning(state, 'Los administradores no pueden agregar productos al carrito')
      }

      if (existing) {
        const available = Number.isFinite(stockLimit)
          ? Math.max(0, stockLimit - existing.quantity)
          : requestedQuantity
        const addedQuantity = Math.min(requestedQuantity, available)

        if (addedQuantity === 0) {
          return warning(state, `No se agregaron unidades de "${name}" porque ya no hay stock disponible`)
        }

        const updated = priceCartItem(
          {
            ...existing,
            prices: product.prices ?? existing.prices,
            locations: product.locations ?? existing.locations,
            maxStock: stockLimit ?? existing.maxStock,
            weight_kg: itemWeight,
            selected: true,
          },
          state.role,
          existing.quantity + addedQuantity
        )
        const items = state.items.map((item) => (item.id === id ? updated : item))
        return addedResult(state, items, updated, addedQuantity, requestedQuantity)
      }

      const priced = priceCartItem({ ...product, weight_kg: itemWeight, selected: true }, state.role, requestedQuantity)

      if (!Number.isFinite(priced.unitPrice)) {
        return warning(state, `No se agregó "${name}": su precio no está disponible`)
      }

      if (Number.isFinite(stockLimit) && stockLimit < priced.minQuantity) {
        return warning(
          state,
          `No se agregó "${name}": el pedido mínimo B2B es de ${priced.minQuantity} unidades y solo hay ${Math.max(0, stockLimit)}`
        )
      }

      const firstQuantity = Math.max(priced.minQuantity, requestedQuantity)
      const addedQuantity = Number.isFinite(stockLimit)
        ? Math.min(firstQuantity, Math.max(0, stockLimit))
        : firstQuantity

      if (addedQuantity === 0) {
        return warning(state, `No se agregó "${name}" porque no hay stock disponible`)
      }

      const newItem = priceCartItem({ ...priced, maxStock: stockLimit }, state.role, addedQuantity)
      return addedResult(state, [...state.items, newItem], newItem, addedQuantity, firstQuantity)
    }

    case 'INCREMENT': {
      const item = state.items.find((item) => item.id === action.payload.id)
      if (!item) return state

      if (Number.isFinite(item.maxStock) && item.quantity >= item.maxStock) {
        return warning(state, `No hay más unidades disponibles de "${item.name}"`)
      }

      return {
        ...state,
        items: state.items.map((line) =>
          line.id === action.payload.id ? priceCartItem(line, state.role, line.quantity + 1) : line
        ),
        lastMessage: null,
        lastMessageType: null,
      }
    }

    case 'DECREMENT': {
      const item = state.items.find((item) => item.id === action.payload.id)
      if (!item) return state

      const minQuantity = Number.isInteger(item.minQuantity) && item.minQuantity > 1 ? item.minQuantity : 1

      if (item.quantity <= minQuantity) {
        if (minQuantity === 1) return { ...state, lastMessage: null, lastMessageType: null }
        return warning(
          state,
          `El pedido mínimo B2B de "${item.name}" es de ${minQuantity} unidades. Para quitarlo del carrito usa "Eliminar".`
        )
      }

      return {
        ...state,
        items: state.items.map((line) =>
          line.id === action.payload.id ? priceCartItem(line, state.role, line.quantity - 1) : line
        ),
        lastMessage: null,
        lastMessageType: null,
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

    case 'TOGGLE_SELECTED': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, selected: !item.selected } : item
        ),
      }
    }

    case 'SET_ALL_SELECTED': {
      return {
        ...state,
        items: state.items.map((item) => ({ ...item, selected: action.payload.selected })),
      }
    }

    case 'REMOVE_ITEMS': {
      const ids = new Set(action.payload.ids)
      return {
        ...state,
        items: state.items.filter((item) => !ids.has(item.id)),
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
      const items = (action.payload.items || []).filter(isValidStoredItem)
      return {
        ...state,
        items: repriceForRole(items, state.role).items,
      }
    }

    case 'SYNC_SESSION': {
      const { userId, role } = action.payload
      if (state.owner === userId && state.role === role) return state

      const hadItems = state.items.length > 0
      const isSameOwner = state.owner === userId
      const guestLoggingIn = state.owner === null && userId !== null

      if (role === ROLES.ADMIN || (!isSameOwner && !guestLoggingIn)) {
        return {
          ...state,
          owner: userId,
          role,
          items: [],
          lastMessage: hadItems ? 'Se vació el carrito porque cambió el usuario' : null,
          lastMessageType: hadItems ? 'info' : null,
        }
      }

      const { items, raisedNames } = repriceForRole(state.items, role)
      let lastMessage = null
      if (hadItems && raisedNames.length > 0) {
        lastMessage = `Se actualizaron los precios del carrito a tu tarifa. Se ajustó al pedido mínimo B2B: ${raisedNames.join(', ')}`
      } else if (hadItems) {
        lastMessage = 'Se actualizaron los precios del carrito según tu tipo de cliente'
      }
      return {
        ...state,
        owner: userId,
        role,
        items,
        lastMessage,
        lastMessageType: lastMessage ? 'info' : null,
      }
    }

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, getInitialState)
  const { session } = useSession()
  const sessionUserId = session?.userId ?? null
  const sessionRole = session?.role ?? null

  useEffect(() => {
    dispatch({ type: 'SYNC_SESSION', payload: { userId: sessionUserId, role: sessionRole } })
  }, [sessionUserId, sessionRole])

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
      if (state.owner) localStorage.setItem(CART_OWNER_STORAGE_KEY, state.owner)
      else localStorage.removeItem(CART_OWNER_STORAGE_KEY)
    } catch {
      // Sin localStorage el carrito sigue funcionando en memoria.
    }
  }, [state.items, state.owner])

  const loggedAddIdRef = useRef(state.lastAddId)
  useEffect(() => {
    if (state.lastAddId === loggedAddIdRef.current || !state.lastAdded) return
    loggedAddIdRef.current = state.lastAddId
    trackEvent(EVENT_TYPES.ADD_TO_CART, state.lastAdded)
  }, [state.lastAddId, state.lastAdded])

  useEffect(() => {
    if (!state.lastMessage) return undefined

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: 'CLEAR_MESSAGE' })
    }, 6000)

    return () => window.clearTimeout(timeoutId)
  }, [state.lastMessage])

  const value = useMemo(() => {
    const itemCount = state.items.reduce((total, item) => total + item.quantity, 0)
    const selectedItems = state.items.filter((item) => item.selected)
    const selectedItemCount = selectedItems.reduce((total, item) => total + item.quantity, 0)
    const subtotal = selectedItems.reduce((total, item) => total + calculateSubtotal(item), 0)
    const iva = Math.round(subtotal * IVA_RATE)
    const subtotalWithIva = subtotal + iva
    const totalWeight = selectedItems.reduce((total, item) => total + item.weight_kg * item.quantity, 0)
    const shippingCost = selectedItems.length === 0
      ? 0
      : Math.max(MIN_SHIPPING_COST, Math.ceil(totalWeight * SHIPPING_RATE_PER_KG))
    const total = subtotalWithIva + shippingCost
    const selectedErrors = selectedItems.flatMap(validateCartItem)

    return {
      items: state.items,
      selectedItems,
      selectedItemCount,
      allSelected: state.items.length > 0 && selectedItems.length === state.items.length,
      lastMessage: state.lastMessage,
      lastMessageType: state.lastMessageType,
      lastAddId: state.lastAddId,
      itemCount,
      subtotal,
      iva,
      subtotalWithIva,
      shippingCost,
      total,
      selectedErrors,
      canCheckout: selectedItems.length > 0 && selectedErrors.length === 0,
      priceRole: state.role,

      addItem: (product) => dispatch({ type: 'ADD_ITEM', payload: product }),
      increment: (id) => dispatch({ type: 'INCREMENT', payload: { id } }),
      decrement: (id) => dispatch({ type: 'DECREMENT', payload: { id } }),
      removeItem: (id) => {
        dispatch({ type: 'REMOVE_ITEM', payload: { id } })
      },
      toggleSelected: (id) => dispatch({ type: 'TOGGLE_SELECTED', payload: { id } }),
      setAllSelected: (selected) => dispatch({ type: 'SET_ALL_SELECTED', payload: { selected } }),
      removeItems: (ids) => dispatch({ type: 'REMOVE_ITEMS', payload: { ids } }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      clearMessage: () => dispatch({ type: 'CLEAR_MESSAGE' }),
      hydrateCart: (items) => dispatch({ type: 'HYDRATE_CART', payload: { items } }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
