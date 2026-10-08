import { useEffect, useRef } from 'react'

/**
 * Nombre: useCheckoutPersistence
 * Descripción: Hook que persiste temporalmente los datos del checkout
 *              (comprador y entrega) en sessionStorage. Se encarga de:
 *                1. Hidratar el estado inicial desde sessionStorage.
 *                2. Guardar los cambios en cada actualización.
 *                3. Exponer una función para limpiar los datos cuando la
 *                   compra se completa o el carrito queda vacío.
 *              Usa sessionStorage (no localStorage) porque son datos
 *              temporales: si el usuario cierra el navegador, no tiene
 *              sentido conservarlos como sí ocurre con el carrito.
 * Entradas:
 *  - initialBuyer: objeto con los valores por defecto del comprador.
 *  - initialDelivery: objeto con los valores por defecto de la entrega.
 *  - options: { enabled: boolean } — si es false, no se lee ni se escribe
 *             nada (por ejemplo, cuando el carrito está vacío).
 * Salidas: {
 *   buyer, setBuyer,
 *   delivery, setDelivery,
 *   clearDraft,
 * }
 * Excepciones: No lanza; captura errores de sessionStorage y sigue
 *              funcionando en memoria.
 */

const DRAFT_STORAGE_KEY = 'maquinaria-cr-checkout-draft-v1'

/**
 * Nombre: isValidDraft
 * Descripción: Verifica que un draft leído de sessionStorage tenga la
 *              forma esperada. Descarta drafts corruptos o de versiones
 *              anteriores en vez de romper la app.
 */
function isValidDraft(draft) {
  return (
    draft !== null &&
    typeof draft === 'object' &&
    draft.buyer !== null &&
    typeof draft.buyer === 'object' &&
    draft.delivery !== null &&
    typeof draft.delivery === 'object'
  )
}

/**
 * Nombre: readDraft
 * Descripción: Lee el draft desde sessionStorage. Si no existe, está
 *              corrupto o es inválido, devuelve null.
 */
function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidDraft(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Nombre: writeDraft
 * Descripción: Guarda el draft en sessionStorage. Si falla (modo privado,
 *              cuota llena), se ignora silenciosamente.
 */
function writeDraft(buyer, delivery) {
  try {
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ buyer, delivery, savedAt: Date.now() })
    )
  } catch {
  }
}

/**
 * Nombre: clearDraft
 * Descripción: Elimina el draft de sessionStorage. Se llama cuando la
 *              compra se completa o el carrito queda vacío.
 */
export function clearCheckoutDraft() {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY)
  } catch {
  }
}

export function useCheckoutPersistence(initialBuyer, initialDelivery, options = {}) {
  const { enabled = true } = options
  const hydratedRef = useRef(false)
  const draft = enabled ? readDraft() : null

  const buyerInitial = draft?.buyer
    ? { ...initialBuyer, ...draft.buyer }
    : initialBuyer
  const deliveryInitial = draft?.delivery
    ? { ...initialDelivery, ...draft.delivery }
    : initialDelivery
  useEffect(() => {
    hydratedRef.current = true
  }, [])

  return {
    buyerInitial,
    deliveryInitial,
    hadDraft: Boolean(draft),
    saveDraft: (buyer, delivery) => {
      if (!enabled) return
      if (!hydratedRef.current) return
      writeDraft(buyer, delivery)
    },
    clearDraft: clearCheckoutDraft,
  }
}