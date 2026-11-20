import { useCallback, useEffect, useState } from 'react'
import { searchClient } from '../catalog/searchClient'
import { ADMIN_CHANGES_EVENT, applyAdminChanges, readStore } from './adminChanges'

const PRODUCTS_INDEX = 'grupo-07_products'

/**
 * Nombre: useAdminProducts
 * Descripción: Consulta el catálogo para el panel administrativo y devuelve
 *              los productos con las modificaciones simuladas ya aplicadas.
 *              Vuelve a cargar cuando cambia la búsqueda y cuando el
 *              administrador guarda un cambio, para que la tabla muestre
 *              siempre el valor vigente.
 *
 *              Se consulta Algolia directamente en vez de usar los widgets
 *              de react-instantsearch porque el panel necesita la lista
 *              completa de campos (precios B2C y B2B, mínimos, descuentos y
 *              existencias por sucursal), no una vista de catálogo.
 *
 * Entradas: query: texto de búsqueda; hitsPerPage: cuántos traer.
 * Salidas: { products, loading, error, reload }.
 * Excepciones: No lanza; ante un fallo devuelve error con un mensaje.
 */
export function useAdminProducts(query = '', hitsPerPage = 40) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recarga, setRecarga] = useState(0)

  const reload = useCallback(() => setRecarga((n) => n + 1), [])

  // Si otra pantalla del panel guarda una modificación, se recargan los datos.
  useEffect(() => {
    window.addEventListener(ADMIN_CHANGES_EVENT, reload)
    return () => window.removeEventListener(ADMIN_CHANGES_EVENT, reload)
  }, [reload])

  useEffect(() => {
    let cancelado = false

    // La carga va dentro de una función asíncrona: actualizar el estado de
    // forma síncrona en el cuerpo del efecto provoca renders en cascada.
    const cargar = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await searchClient.search([
          { indexName: PRODUCTS_INDEX, params: { query, hitsPerPage } },
        ])
        if (cancelado) return
        const store = readStore()
        const hits = response?.results?.[0]?.hits ?? []
        setProducts(hits.map((hit) => applyAdminChanges(hit, store)))
      } catch {
        if (cancelado) return
        setError('No pudimos consultar el catálogo. Revisa la conexión e intenta de nuevo.')
        setProducts([])
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    cargar()

    return () => {
      cancelado = true
    }
  }, [query, hitsPerPage, recarga])

  return { products, loading, error, reload }
}
