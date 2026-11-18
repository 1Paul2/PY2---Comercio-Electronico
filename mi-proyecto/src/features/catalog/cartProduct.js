import { getProductPricing, getProductPrices, priceCartItem } from '../pricing/pricing'

/**
 * Módulo: cartProduct
 * Descripción: Reglas compartidas para agregar un producto de Algolia al
 *              carrito. Las usan la tarjeta del catálogo (ProductCard), las
 *              tarjetas del inicio (CategoryShowcase) y el detalle
 *              (ProductDetail), así todas calculan el stock, el precio según
 *              el rol y arman el producto del carrito exactamente igual.
 *
 * Producto en el carrito (lo usa también el checkout y la orden):
 *   { id, name, image, quantity, weight_kg, selected,
 *     priceType: 'B2C' | 'B2B',
 *     basePrice, unitPrice, minQuantity,
 *     locations: [{ site, stock_quantity }],
 *     // apoyo interno:
 *     price,            // = unitPrice (lo leen el resumen y la orden)
 *     discountPct,      // descuento por volumen aplicado (0 a 1)
 *     volumeDiscounts,  // tramos de descuento del tipo de precio
 *     prices,           // ambos precios, para recalcular si cambia el rol
 *     maxStock }        // stock total de todas las sucursales
 */

/**
 * Nombre: getTotalStock
 * Descripción: Suma el stock de todas las sucursales de un producto.
 */
export function getTotalStock(hit) {
  return (hit?.locations || []).reduce((sum, loc) => sum + (loc.stock_quantity || 0), 0)
}

/**
 * Nombre: getCartAvailability
 * Descripción: Calcula si un producto se puede agregar al carrito con el rol
 *              actual: precio válido, stock disponible y, para B2B, stock
 *              suficiente para el pedido mínimo.
 * Entradas: hit: producto de Algolia; quantityInCart: unidades ya agregadas;
 *           rol: rol del usuario (undefined para visitante).
 * Salidas: { totalStock, isAvailable, isAtStockLimit, canAddToCart,
 *            hasValidPrice, belowMinimumStock, pricing }.
 * Excepciones: No lanza.
 */
export function getCartAvailability(hit, quantityInCart = 0, rol) {
  const pricing = getProductPricing(hit, rol)
  const inStock = hit?.pricing?.b2c?.in_stock
  const totalStock = getTotalStock(hit)
  const hasStock = totalStock > 0 && inStock !== false
  const belowMinimumStock = hasStock && quantityInCart === 0 && totalStock < pricing.minQuantity
  const isAvailable = hasStock && pricing.isValid && !belowMinimumStock
  const isAtStockLimit = isAvailable && quantityInCart >= totalStock

  return {
    totalStock,
    isAvailable,
    isAtStockLimit,
    canAddToCart: isAvailable && !isAtStockLimit,
    hasValidPrice: pricing.isValid,
    hasStock,
    belowMinimumStock,
    pricing,
  }
}

/**
 * Nombre: toCartItem
 * Descripción: Convierte un producto de Algolia en el formato que recibe
 *              addItem del carrito, con el precio del rol actual.
 * Entradas: hit: producto de Algolia; rol: rol del usuario;
 *           quantity: unidades (por defecto, el mínimo del rol).
 * Salidas: objeto para addItem (ver la forma al inicio del módulo).
 * Excepciones: No lanza.
 */
export function toCartItem(hit, rol, quantity) {
  const { minQuantity } = getProductPricing(hit, rol)
  const base = {
    id: hit.objectID,
    name: hit.title,
    image: hit.image_url,
    weight_kg: hit.facets?.weight_kg,
    locations: (hit.locations || []).map((loc) => ({ site: loc.site, stock_quantity: loc.stock_quantity ?? 0 })),
    maxStock: getTotalStock(hit),
    prices: getProductPrices(hit),
  }
  return priceCartItem(base, rol, Number.isInteger(quantity) && quantity > 0 ? quantity : minQuantity)
}

/**
 * Nombre: getAddButtonLabel
 * Descripción: Texto visible del botón de agregar según el estado.
 * Entradas: availability (de getCartAvailability) y justAdded.
 * Salidas: string.
 * Excepciones: No lanza.
 */
export function getAddButtonLabel({ isAvailable, isAtStockLimit, hasValidPrice, hasStock, belowMinimumStock, pricing }, justAdded) {
  if (justAdded) return '✓ Agregado'
  if (hasStock !== false && hasValidPrice === false) return 'Precio no disponible'
  if (belowMinimumStock) return `Stock menor al mínimo (${pricing.minQuantity})`
  if (!isAvailable) return 'Agotado'
  if (isAtStockLimit) return 'Máximo en carrito'
  if (pricing?.minQuantity > 1) return `Agregar ${pricing.minQuantity} al carrito`
  return 'Agregar al carrito'
}
