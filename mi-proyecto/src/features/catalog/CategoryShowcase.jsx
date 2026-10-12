import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchClient } from './searchClient'
import { formatCRC } from './format'
import { getAddButtonLabel, getCartAvailability, toCartItem } from './cartProduct'
import { useCart } from '../../context/useCart'
import '../../styles/CategoryShowcase.css'

const INDEX_NAME = 'grupo-07_products'
const BLOCK_CATEGORY_LIMIT = 12 
const BLOCK_ITEMS = 4           
const COLUMNS_PER_ROW = 4
const ROTATE_INTERVAL_MS = 5000
const ADDED_FEEDBACK_MS = 1500

/**
 * Nombre: chunk
 * Descripción: Divide un arreglo en bloques de tamaño fijo para formar filas de categorías.
 * Entradas: array: arreglo a dividir; size: tamaño de cada bloque.
 * Salidas: Arreglo bidimensional con los grupos formados.
 * Excepciones: No hay.
 */
function chunk(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

/**
 * Nombre: useCategoryShowcase
 * Descripción: Carga las categorías principales y sus productos destacados para mostrarlos en el showcase.
 * Entradas: No recibe parámetros.
 * Salidas: Estado con loading, ready, empty o error y los bloques de categorías.
 * Excepciones: No hay.
 */
function useCategoryShowcase() {
  const [state, setState] = useState({ status: 'loading', blocks: [] })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const facetResponse = await searchClient.search([
          {
            indexName: INDEX_NAME,
            params: { query: '', hitsPerPage: 0, facets: ['category_facet'] },
          },
        ])

        const facetCounts = facetResponse.results?.[0]?.facets?.category_facet || {}
        const sortedNames = Object.keys(facetCounts).sort((a, b) => facetCounts[b] - facetCounts[a])
        const blockNames = sortedNames.slice(0, BLOCK_CATEGORY_LIMIT)

        if (blockNames.length === 0) {
          if (!cancelled) setState({ status: 'empty', blocks: [] })
          return
        }

        const requests = blockNames.map((name) => ({
          indexName: INDEX_NAME,
          params: {
            query: '',
            filters: `category_facet:"${name}"`,
            hitsPerPage: BLOCK_ITEMS,
          },
        }))

        const response = await searchClient.search(requests)
        const results = response.results || []

        const blocks = blockNames.map((name, index) => ({
          name,
          count: facetCounts[name],
          hits: results[index]?.hits || [],
        }))

        if (!cancelled) setState({ status: 'ready', blocks })
      } catch {
        if (!cancelled) setState({ status: 'error', blocks: [] })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

/**
 * Nombre: BlockColumn
 * Descripción: Muestra una columna con una categoría y su producto destacado rotando automáticamente,
 *              con un botón para agregar al carrito el producto que se está viendo.
 *              Para que el botón nunca agregue un producto distinto al que el usuario ve, la rotación
 *              se pausa mientras el puntero o el foco del teclado están sobre la columna y mientras se
 *              muestra la confirmación "Agregado".
 * Entradas: category: objeto con nombre, conteo y productos de la categoría.
 * Salidas: JSX con la columna visual de la categoría.
 * Excepciones: No hay.
 */
function BlockColumn({ category }) {
  const hits = category.hits
  const { addItem, items } = useCart()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPointerInside, setIsPointerInside] = useState(false)
  const [isFocusInside, setIsFocusInside] = useState(false)
  // Guarda el id del producto agregado: la confirmación solo se muestra
  // para ese producto, aunque luego la columna rote a otro.
  const [addedId, setAddedId] = useState(null)

  const isPaused = isPointerInside || isFocusInside || addedId !== null

  useEffect(() => {
    if (hits.length <= 1 || isPaused) return undefined

    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % hits.length)
    }, ROTATE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [hits.length, isPaused])

  useEffect(() => {
    if (addedId === null) return undefined
    const timeoutId = window.setTimeout(() => setAddedId(null), ADDED_FEEDBACK_MS)
    return () => window.clearTimeout(timeoutId)
  }, [addedId])

  const activeHit = hits[activeIndex]
  if (!activeHit) return null

  const price = activeHit.pricing?.b2c?.price_crc
  const quantityInCart = items.find((item) => item.id === activeHit.objectID)?.quantity ?? 0
  const availability = getCartAvailability(activeHit, quantityInCart)
  const justAdded = addedId === activeHit.objectID

  function handleAddToCart() {
    addItem(toCartItem(activeHit, availability.totalStock))
    setAddedId(activeHit.objectID)
  }

  // Al salir el foco hacia fuera de la columna (no entre sus propios hijos).
  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsFocusInside(false)
  }

  return (
    <div
      className="showcase-column"
      onPointerEnter={() => setIsPointerInside(true)}
      onPointerLeave={() => setIsPointerInside(false)}
      onFocus={() => setIsFocusInside(true)}
      onBlur={handleBlur}
    >
      <div className="showcase-column__header">
        <h3>{category.name}</h3>
        <Link
          to={`/productos?categoria=${encodeURIComponent(category.name)}`}
          aria-label={`Ver todo: ${category.name}`}
        >
          ›
        </Link>
      </div>

      <Link to={`/producto/${activeHit.objectID}`} className="showcase-rotator">
        <div className="showcase-rotator__stage">
          {hits.map((hit, index) => (
            <img
              key={hit.objectID}
              src={hit.image_url}
              alt={hit.title}
              loading="lazy"
              className={`showcase-rotator__image${index === activeIndex ? ' is-active' : ''}`}
              onError={(e) => {
                e.currentTarget.src = `${import.meta.env.BASE_URL}icons.svg`
              }}
            />
          ))}

          {hits.length > 1 && (
            <div className="showcase-rotator__dots">
              {hits.map((hit, index) => (
                <span
                  key={hit.objectID}
                  className={`showcase-rotator__dot${index === activeIndex ? ' is-active' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        <p className="showcase-rotator__name">{activeHit.title}</p>
        <p className="showcase-rotator__price">{formatCRC(price)}</p>
      </Link>

      <button
        type="button"
        className={`showcase-column__add${justAdded ? ' showcase-column__add--success' : ''}`}
        onClick={handleAddToCart}
        disabled={!availability.canAddToCart}
        aria-label={
          !availability.isAvailable
            ? `${activeHit.title} agotado`
            : availability.isAtStockLimit
              ? `${activeHit.title}: ya tienes todo el stock disponible en el carrito`
              : `Agregar ${activeHit.title} al carrito`
        }
      >
        {getAddButtonLabel(availability, justAdded)}
      </button>
    </div>
  )
}

/**
 * Nombre: CategoryShowcase
 * Descripción: Renderiza el bloque visual de categorías principales con productos destacados.
 * Entradas: No recibe parámetros.
 * Salidas: JSX con la sección de categorías del inicio.
 * Excepciones: No hay.
 */
function CategoryShowcase() {
  const { status, blocks } = useCategoryShowcase()

  if (status === 'loading') {
    return <p className="category-showcase__message">Cargando categorías...</p>
  }

  if (status === 'error' || status === 'empty') {
    return null
  }

  const rows = chunk(blocks, COLUMNS_PER_ROW)

  return (
    <section className="category-blocks">
      <h2>Explorá por categoría</h2>
      {rows.map((row, index) => (
        <div className="category-blocks__row" key={index}>
          {row.map((category) => (
            <BlockColumn key={category.name} category={category} />
          ))}
        </div>
      ))}
    </section>
  )
}

export default CategoryShowcase