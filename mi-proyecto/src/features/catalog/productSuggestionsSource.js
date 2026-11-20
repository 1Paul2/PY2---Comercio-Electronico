import { getAlgoliaResults } from '@algolia/autocomplete-preset-algolia'
import { searchClient } from './searchClient'

/**
 * Nombre: createProductSuggestionsSource
 * Descripción: Genera la fuente de sugerencias para el buscador con resultados de productos.
 * Entradas: onSelect: función ejecutada al seleccionar un producto sugerido.
 * Salidas: Objeto con la configuración del origen de sugerencias.
 * Excepciones: No hay.
 */
export function createProductSuggestionsSource({ onSelect, recentSearchesPlugin }) {
  return {
    sourceId: 'products',
    getItems({ query }) {
      if (!query) return []
      return getAlgoliaResults({
        searchClient,
        queries: [
          {
            indexName: 'grupo-07_products',
            query,
            params: { hitsPerPage: 5 },
          },
        ],
      })
    },
    templates: {
      item({ item, html }) {
        return html`<div class="aa-ProductItem">
          <img class="aa-ProductItem-image" src="${item.image_url}" alt="" />
          <div class="aa-ProductItem-content">
            <span class="aa-ProductItem-brand">${item.brand}</span>
            <span class="aa-ProductItem-title">${item.title}</span>
          </div>
        </div>`
      },
    },
    onSelect({ item }) {
      recentSearchesPlugin?.data.addItem({ id: item.objectID, label: item.title })
      onSelect?.(item.title)
    },
  }
}
