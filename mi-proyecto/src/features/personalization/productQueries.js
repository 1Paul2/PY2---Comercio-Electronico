import { useEffect, useState } from 'react'
import { searchClient } from '../catalog/searchClient'

/**
 * Módulo: productQueries
 * Descripción: Consultas a Algolia de los bloques personalizados. El
 *              historial guarda una copia mínima de cada producto; para
 *              mostrar la tarjeta con precio y stock actualizados se vuelve a
 *              pedir el producto por su objectID.
 *
 * Los resultados se guardan en memoria mientras la pestaña esté abierta,
 * así al volver al inicio o quitar un producto no hay que esperar otra vez.
 */

const INDEX_NAME = 'grupo-07_products'
const productCache = new Map()
const searchCache = new Map()

function objectIdFilter(ids) {
  return ids.map((id) => `objectID:"${String(id).replace(/"/g, '\\"')}"`).join(' OR ')
}

async function runSearch(params) {
  const response = await searchClient.search([{ indexName: INDEX_NAME, params }])
  return response.results?.[0]?.hits ?? []
}

/**
 * Nombre: useProductsByIds
 * Descripción: Trae de Algolia los productos indicados y los devuelve en el
 *              mismo orden recibido (el del historial). Solo consulta los que
 *              todavía no conoce.
 * Entradas: ids: arreglo de objectID.
 * Salidas: { status: 'loading' | 'ready' | 'error', hits }.
 * Excepciones: No lanza; una falla de red deja status 'error'.
 */
export function useProductsByIds(ids) {
  const [known, setKnown] = useState(() => Object.fromEntries(productCache))
  const [failedKey, setFailedKey] = useState(null)

  const missing = ids.filter((id) => !(id in known))
  const missingKey = missing.join('|')

  useEffect(() => {
    if (!missingKey) return undefined
    let cancelled = false
    const pending = missingKey.split('|')

    runSearch({ query: '', filters: objectIdFilter(pending), hitsPerPage: pending.length })
      .then((hits) => {
        const found = Object.fromEntries(pending.map((id) => [id, null]))
        hits.forEach((hit) => {
          found[hit.objectID] = hit
        })
        Object.entries(found).forEach(([id, hit]) => productCache.set(id, hit))
        if (!cancelled) setKnown((prev) => ({ ...prev, ...found }))
      })
      .catch(() => {
        if (!cancelled) setFailedKey(missingKey)
      })

    return () => {
      cancelled = true
    }
  }, [missingKey])

  const status = !missingKey ? 'ready' : failedKey === missingKey ? 'error' : 'loading'
  const hits = ids.map((id) => known[id]).filter(Boolean)

  return { status, hits }
}

/**
 * Nombre: useProductSearch
 * Descripción: Ejecuta una búsqueda en Algolia ({ query, filters,
 *              hitsPerPage }) y recuerda el resultado.
 * Entradas: request: parámetros de la búsqueda, o null para no buscar.
 * Salidas: { status: 'idle' | 'loading' | 'ready' | 'error', hits }.
 * Excepciones: No lanza.
 */
export function useProductSearch(request) {
  const key = request ? JSON.stringify(request) : null
  const [results, setResults] = useState(() => Object.fromEntries(searchCache))
  const [failedKey, setFailedKey] = useState(null)
  const isKnown = key !== null && key in results

  useEffect(() => {
    if (!key || isKnown) return undefined
    let cancelled = false

    runSearch(JSON.parse(key))
      .then((hits) => {
        searchCache.set(key, hits)
        if (!cancelled) setResults((prev) => ({ ...prev, [key]: hits }))
      })
      .catch(() => {
        if (!cancelled) setFailedKey(key)
      })

    return () => {
      cancelled = true
    }
  }, [key, isKnown])

  if (!key) return { status: 'idle', hits: [] }
  if (isKnown) return { status: 'ready', hits: results[key] }
  return { status: failedKey === key ? 'error' : 'loading', hits: [] }
}
