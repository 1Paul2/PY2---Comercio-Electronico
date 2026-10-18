/**
 * Módulo: cartProduct
 * Descripción: Reglas compartidas para agregar un producto de Algolia al
 *              carrito. Las usan la tarjeta del catálogo (ProductCard) y las
 *              tarjetas del inicio (CategoryShowcase), así ambas calculan el
 *              stock y arman el producto del carrito exactamente igual.
 */

/**
 * Nombre: getCartAvailability
 * Descripción: Calcula si un producto se puede agregar al carrito.
 * Entradas: hit: producto de Algolia; quantityInCart: unidades ya agregadas.
 * Salidas: { totalStock, isAvailable, isAtStockLimit, canAddToCart }.
 * Excepciones: No lanza.
 */
export function getCartAvailability(hit, quantityInCart = 0) {
  const price = hit?.pricing?.b2c?.price_crc
  const inStock = hit?.pricing?.b2c?.in_stock
  const totalStock = (hit?.locations || []).reduce((sum, loc) => sum + (loc.stock_quantity || 0), 0)
  const isAvailable = totalStock > 0 && inStock !== false && typeof price === 'number'
  const isAtStockLimit = isAvailable && quantityInCart >= totalStock

  return { totalStock, isAvailable, isAtStockLimit, canAddToCart: isAvailable && !isAtStockLimit }
}

/**
 * Nombre: toCartItem
 * Descripción: Convierte un producto de Algolia en el formato que recibe
 *              addItem del carrito (una unidad, precio B2C).
 * Entradas: hit: producto de Algolia; totalStock: stock total calculado.
 * Salidas: objeto para addItem.
 * Excepciones: No lanza.
 */
export function toCartItem(hit, totalStock) {
  return {
    id: hit.objectID,
    name: hit.title,
    price: hit.pricing?.b2c?.price_crc,
    image: hit.image_url,
    weight_kg: hit.facets?.weight_kg,
    quantity: 1,
    maxStock: totalStock,
  }
}

/**
 * Nombre: getAddButtonLabel
 * Descripción: Texto visible del botón de agregar según el estado.
 * Entradas: availability (de getCartAvailability) y justAdded.
 * Salidas: string.
 * Excepciones: No lanza.
 */
export function getAddButtonLabel({ isAvailable, isAtStockLimit }, justAdded) {
  if (justAdded) return '✓ Agregado'
  if (!isAvailable) return 'Agotado'
  if (isAtStockLimit) return 'Máximo en carrito'
  return 'Agregar al carrito'
}
