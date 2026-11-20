import { createLocalStorageRecentSearchesPlugin } from '@algolia/autocomplete-plugin-recent-searches'

/**
 * Nombre: recentSearchesPlugin
 * Descripción: Guarda y recupera búsquedas recientes del usuario en localStorage.
 * Entradas: No recibe parámetros.
 * Salidas: Plugin configurado para el autocompletado.
 * Excepciones: No hay.
 */
export function createRecentSearchesPlugin(userId, onSelect) {
  if (!userId) return null
  return createLocalStorageRecentSearchesPlugin({
    key: `grupo07-recent-searches-${userId}`,
    limit: 10,
    transformSource({ source }) {
      return { ...source, onSelect({ item }) { onSelect?.(item.label) } }
    },
  })
}
