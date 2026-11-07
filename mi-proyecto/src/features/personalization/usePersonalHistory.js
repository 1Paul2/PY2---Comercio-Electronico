import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useSession } from '../../context/useSession'
import { HISTORY_UPDATED_EVENT, parseHistory, readRawHistory, rememberSearch } from '../history/history'
import { EVENT_TYPES, trackEvent } from '../activity/activityLog'

/**
 * Nombre: subscribe
 * Descripción: Escucha los cambios del historial: los de esta pestaña
 *              (HISTORY_UPDATED_EVENT) y los de otras pestañas ("storage").
 */
function subscribe(onChange) {
  window.addEventListener(HISTORY_UPDATED_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(HISTORY_UPDATED_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/**
 * Nombre: usePersonalHistory
 * Descripción: Historial del usuario activo, siempre actualizado. Cuando se
 *              ve un producto, se busca algo o se quita una entrada, los
 *              bloques que lo usan se vuelven a dibujar sin recargar.
 * Entradas: No recibe parámetros.
 * Salidas: { session, history } — history es null si no hay sesión.
 * Excepciones: No lanza.
 */
export function usePersonalHistory() {
  const { session } = useSession()
  const userId = session?.userId ?? null

  // Se compara el texto guardado (un string), no el objeto: así React solo
  // vuelve a dibujar cuando el historial realmente cambió.
  const getSnapshot = useCallback(() => readRawHistory(userId), [userId])
  const raw = useSyncExternalStore(subscribe, getSnapshot)
  const history = useMemo(() => parseHistory(raw), [raw])

  return { session, history: userId ? history : null }
}

/**
 * Nombre: repeatSearch
 * Descripción: Registra una búsqueda repetida desde "Tus búsquedas
 *              recientes": la sube al inicio del historial y cuenta como
 *              evento "search" con method "recent".
 * Entradas: query: texto de la búsqueda.
 * Salidas: No retorna valor.
 */
export function repeatSearch(query) {
  rememberSearch(query)
  trackEvent(EVENT_TYPES.SEARCH, { query, method: 'recent' })
}
