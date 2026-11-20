import { createHash } from 'crypto'
import { readFileSync, readdirSync } from 'fs'
import 'dotenv/config'

/*
 * seed-orders.mjs — Carga órdenes de ejemplo en el índice grupo-07_orders de
 * Algolia. Las órdenes se arman con los usuarios de data/users/users.json y
 * los productos de data/*.json, con la misma forma y las mismas reglas de
 * cálculo que src/features/orders/buildOrder.js, para que precios, mínimos B2B,
 * stock por sucursal, IVA y envío cuadren. Los números de orden son
 * deterministas, así que volver a correr el script deja el índice igual
 * (replaceAllObjects).
 *
 * Uso:
 *   npm run seed-orders                  carga las órdenes en Algolia
 *   node scripts/seed-orders.mjs --dry   genera, valida e imprime las órdenes
 *                                        sin conectarse a Algolia (no pide .env)
 */

const ORDERS_INDEX = 'grupo-07_orders'
const DRY_RUN = process.argv.includes('--dry')

const IVA_RATE = 0.13
const MIN_SHIPPING = 3500
const SHIPPING_PER_KG = 30
const DEFAULT_WEIGHT_KG = 5
const TERMS_VERSION = '2026-10'
const ORDER_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ORDER_NUMBER_PATTERN = /^MCR-\d{8}-[0-9A-HJKMNP-TV-Z]{8}$/

const ROLE_LABELS = { B2C: 'Cliente B2C', B2B: 'Cliente B2B' }

const BRANCHES = {
  'san-jose': { id: 'san-jose', name: 'San José', address: 'Paseo Colón, San José' },
  alajuela: { id: 'alajuela', name: 'Alajuela', address: 'Radial Francisco J. Orlich, Alajuela' },
  cartago: { id: 'cartago', name: 'Cartago Centro', address: 'Avenida 1, Cartago Centro' },
}

// Combinaciones coherentes de estado de orden y de pago.
const STATUS_COMBOS = {
  CONFIRMED: ['APPROVED'],
  FAILED: ['DECLINED'],
  PENDING: ['ERROR', 'PENDING'],
}

/*
 * Órdenes de ejemplo. Cada una indica usuario, sucursal, productos y
 * cantidades; el resto se calcula con los datos reales.
 */
const ORDER_SPECS = [
  {
    createdAt: '2026-11-02T15:20:00.000Z',
    userId: 'u-b2c-01',
    branch: 'san-jose',
    items: [['REP-MIN-003', 2], ['REP-MIN-005', 1]],
    delivery: { province: 'Heredia', canton: 'Heredia', address: '200 m norte de la Municipalidad, San Francisco', extraInfo: 'Casa de portón negro' },
    card: { brand: 'Visa', last4: '4242' },
    orderStatus: 'CONFIRMED',
    paymentStatus: 'APPROVED',
  },
  {
    createdAt: '2026-11-04T17:05:00.000Z',
    userId: 'u-b2c-02',
    branch: 'cartago',
    items: [['REP-TR-002', 3], ['REP-TR-001', 1]],
    delivery: { province: 'Cartago', canton: 'Paraíso', address: 'Orosi, 300 m sur de la iglesia', extraInfo: 'Finca con rótulo verde' },
    card: { brand: 'Mastercard', last4: '5100' },
    orderStatus: 'CONFIRMED',
    paymentStatus: 'APPROVED',
  },
  {
    createdAt: '2026-11-05T19:40:00.000Z',
    userId: 'u-b2c-01',
    branch: 'alajuela',
    items: [['REP-MT-009', 1]],
    delivery: { province: 'Alajuela', canton: 'Alajuela', address: 'Barrio San José, frente al Colegio Técnico', extraInfo: '' },
    card: { brand: 'Visa', last4: '0119' },
    orderStatus: 'FAILED',
    paymentStatus: 'DECLINED',
  },
  {
    createdAt: '2026-11-07T14:30:00.000Z',
    userId: 'u-b2c-02',
    branch: 'san-jose',
    items: [['REP-TR-006', 1], ['REP-TR-005', 2]],
    delivery: { province: 'San José', canton: 'Escazú', address: 'San Rafael, 150 m oeste del Multiplaza', extraInfo: 'Entregar en recepción' },
    card: { brand: 'Mastercard', last4: '8821' },
    orderStatus: 'PENDING',
    paymentStatus: 'PENDING',
  },
  {
    createdAt: '2026-11-09T16:10:00.000Z',
    userId: 'u-b2c-01',
    branch: 'cartago',
    items: [['REP-MT-004', 2]],
    delivery: { province: 'Cartago', canton: 'Cartago', address: 'Oriente, 100 m este de la Basílica', extraInfo: 'Llamar antes de llegar' },
    card: { brand: 'Visa', last4: '3377' },
    orderStatus: 'PENDING',
    paymentStatus: 'ERROR',
  },
  {
    createdAt: '2026-11-10T15:45:00.000Z',
    userId: 'u-b2b-01',
    branch: 'san-jose',
    items: [['REP-COM-004', 12], ['REP-COM-007', 6], ['REP-COM-001', 2]],
    delivery: { province: 'San José', canton: 'Montes de Oca', address: 'Sabanilla, bodega 4, Zona Industrial', extraInfo: 'Horario de recibo: 7:00 a 15:00' },
    card: { brand: 'Visa', last4: '6611' },
    orderStatus: 'CONFIRMED',
    paymentStatus: 'APPROVED',
  },
  {
    createdAt: '2026-11-12T18:20:00.000Z',
    userId: 'u-b2b-02',
    branch: 'alajuela',
    items: [['REP-TR-002', 12], ['REP-MT-009', 3]],
    delivery: { province: 'Alajuela', canton: 'San Carlos', address: 'Ciudad Quesada, 2 km norte del Hospital', extraInfo: 'Portón azul de la planta' },
    card: { brand: 'Mastercard', last4: '9034' },
    orderStatus: 'CONFIRMED',
    paymentStatus: 'APPROVED',
  },
  {
    createdAt: '2026-11-13T20:00:00.000Z',
    userId: 'u-b2b-01',
    branch: 'cartago',
    items: [['REP-MIN-001', 2]],
    delivery: { province: 'Cartago', canton: 'La Unión', address: 'Tres Ríos, Parque Industrial Zona Franca', extraInfo: '' },
    card: { brand: 'Visa', last4: '1450' },
    orderStatus: 'FAILED',
    paymentStatus: 'DECLINED',
  },
  {
    createdAt: '2026-11-15T14:15:00.000Z',
    userId: 'u-b2b-02',
    branch: 'san-jose',
    items: [['REP-MT-002', 5], ['REP-MT-001', 4], ['REP-MT-005', 2]],
    delivery: { province: 'Alajuela', canton: 'Grecia', address: 'Tacares, 400 m sur del beneficio', extraInfo: 'Pedir a Daniela en proveeduría' },
    card: { brand: 'Mastercard', last4: '7702' },
    orderStatus: 'PENDING',
    paymentStatus: 'PENDING',
  },
  {
    createdAt: '2026-11-17T21:30:00.000Z',
    userId: 'u-b2b-01',
    branch: 'alajuela',
    items: [['REP-MT-015', 3]],
    delivery: { province: 'San José', canton: 'Santa Ana', address: 'Pozos, Condominio Industrial Lindora, bodega 12', extraInfo: '' },
    card: { brand: 'Visa', last4: '2288' },
    orderStatus: 'PENDING',
    paymentStatus: 'ERROR',
  },
]

/**
 * Nombre: normalize
 * Descripción: Quita tildes y pasa a minúsculas para comparar nombres de sede.
 */
function normalize(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * Nombre: loadProducts
 * Descripción: Lee los .json de data/ (solo el primer nivel) y los indexa por objectID.
 */
function loadProducts() {
  const products = new Map()
  for (const file of readdirSync('./data').filter((name) => name.endsWith('.json'))) {
    for (const product of JSON.parse(readFileSync(`./data/${file}`, 'utf-8'))) {
      products.set(product.objectID, product)
    }
  }
  return products
}

/**
 * Nombre: getBranchStock
 * Descripción: Stock de un producto en la sucursal (comparando sin tildes).
 */
function getBranchStock(product, branch) {
  const site = (product.locations ?? []).find((loc) => normalize(loc.site) === normalize(branch.name))
  return site?.stock_quantity ?? 0
}

/**
 * Nombre: getVolumeDiscount
 * Descripción: Porcentaje (0 a 1) del tramo con mayor min_units alcanzado.
 */
function getVolumeDiscount(tiers, quantity) {
  return (tiers ?? [])
    .filter((tier) => tier.min_units <= quantity)
    .sort((a, b) => b.min_units - a.min_units)[0]?.discount_pct ?? 0
}

/**
 * Nombre: formatB2BConditions
 * Descripción: Texto como "Pedido mínimo 3 · 5% desde 6 u. · 10% desde 12 u.".
 */
function formatB2BConditions(minQuantity, tiers) {
  const parts = []
  if (minQuantity > 1) parts.push(`Pedido mínimo ${minQuantity}`)
  for (const tier of [...(tiers ?? [])].sort((a, b) => a.min_units - b.min_units)) {
    parts.push(`${Math.round(tier.discount_pct * 100)}% desde ${tier.min_units} u.`)
  }
  return parts.join(' · ')
}

/**
 * Nombre: buildOrderNumber
 * Descripción: Número MCR-AAAAMMDD-XXXXXXXX determinista: la parte final sale
 *              de un hash de la fecha completa y el usuario, no de azar.
 */
function buildOrderNumber(createdAt, userId) {
  const datePart = createdAt.slice(0, 10).replaceAll('-', '')
  const digest = createHash('sha256').update(`${createdAt}|${userId}`).digest()
  const suffix = Array.from({ length: 8 }, (_, i) => ORDER_ALPHABET[digest[i] % ORDER_ALPHABET.length]).join('')
  return `MCR-${datePart}-${suffix}`
}

/**
 * Nombre: buildItem
 * Descripción: Línea de la orden con las reglas de precio de la app.
 */
function buildItem(product, quantity, priceType, branch) {
  const isB2B = priceType === 'B2B'
  const b2b = product.pricing?.b2b ?? {}
  const listPrice = isB2B ? b2b.price_crc : product.pricing?.b2c?.price_crc
  const minQuantity = isB2B ? b2b.min_order_quantity ?? 1 : 1
  const discountPct = isB2B ? getVolumeDiscount(b2b.volume_discounts, quantity) : 0
  const unitPrice = Math.round(listPrice * (1 - discountPct))

  return {
    id: product.objectID,
    name: product.title,
    image: product.image_url ?? null,
    quantity,
    priceType,
    listPrice,
    unitPrice,
    discountPct,
    discountAmount: (listPrice - unitPrice) * quantity,
    lineSubtotal: unitPrice * quantity,
    minQuantity,
    branchStock: getBranchStock(product, branch),
    conditions: isB2B ? formatB2BConditions(minQuantity, b2b.volume_discounts) : '',
  }
}

/**
 * Nombre: buildConditions
 * Descripción: Resumen de las condiciones comerciales de la orden.
 */
function buildConditions(priceType, items) {
  if (priceType === 'B2B') {
    const discounted = items.filter((line) => line.discountPct > 0)
    return {
      priceType,
      label: 'Condiciones B2B (mayorista)',
      rules: [
        'Precio mayorista B2B de cada producto.',
        'Pedido mínimo por producto según su ficha; validado antes de pagar.',
        discounted.length > 0
          ? `Descuento por volumen aplicado en ${discounted.length} ${discounted.length === 1 ? 'producto' : 'productos'}.`
          : 'Ningún producto alcanzó un descuento por volumen.',
      ],
    }
  }
  return {
    priceType,
    label: 'Condiciones B2C (público)',
    rules: ['Precio al público.', 'Cantidad mínima: 1 unidad por producto.', 'Sin descuentos por volumen.'],
  }
}

/**
 * Nombre: buildOrders
 * Descripción: Arma todas las órdenes de ORDER_SPECS con los datos reales.
 * Excepciones: Lanza Error si un usuario, producto o sucursal no existe.
 */
function buildOrders(users, products) {
  return ORDER_SPECS.map((spec) => {
    const user = users.find((u) => u.objectID === spec.userId)
    if (!user || (user.role !== 'B2C' && user.role !== 'B2B')) {
      throw new Error(`Usuario no válido para una orden: ${spec.userId}`)
    }
    const branch = BRANCHES[spec.branch]
    if (!branch) throw new Error(`Sucursal desconocida: ${spec.branch}`)

    const priceType = user.role
    const entries = spec.items.map(([productId, quantity]) => {
      const product = products.get(productId)
      if (!product) throw new Error(`Producto no encontrado en data/: ${productId}`)
      return { product, line: buildItem(product, quantity, priceType, branch) }
    })
    const lines = entries.map((entry) => entry.line)

    const subtotal = lines.reduce((sum, line) => sum + line.lineSubtotal, 0)
    const iva = Math.round(subtotal * IVA_RATE)
    const totalWeight = entries.reduce(
      (sum, { product, line }) => sum + (product.facets?.weight_kg ?? DEFAULT_WEIGHT_KG) * line.quantity,
      0,
    )
    const shippingCost = Math.max(MIN_SHIPPING, Math.ceil(totalWeight * SHIPPING_PER_KG))
    const orderNumber = buildOrderNumber(spec.createdAt, user.objectID)

    return {
      objectID: orderNumber,
      orderNumber,
      createdAt: spec.createdAt,
      customer: {
        userId: user.objectID,
        name: user.name,
        email: user.email,
        role: user.role,
        roleLabel: ROLE_LABELS[user.role],
        company: user.role === 'B2B' ? user.company ?? null : null,
      },
      priceType,
      branch: { id: branch.id, name: branch.name, address: branch.address },
      buyer: { fullName: user.name, email: user.email, phone: user.phone },
      delivery: { ...spec.delivery },
      termsAcceptance: { accepted: true, version: TERMS_VERSION, acceptedAt: spec.createdAt },
      paymentMethod: { brand: spec.card.brand, last4: spec.card.last4 },
      items: lines,
      commercialConditions: buildConditions(priceType, lines),
      currency: 'CRC',
      subtotal,
      iva,
      shippingCost,
      total: subtotal + iva + shippingCost,
      orderStatus: spec.orderStatus,
      paymentStatus: spec.paymentStatus,
    }
  })
}

/**
 * Nombre: validateOrders
 * Descripción: Comprueba formato del número, estados, mínimos, stock y que
 *              los montos cuadren. Devuelve la lista de problemas.
 */
function validateOrders(orders) {
  const problems = []
  const seen = new Set()

  for (const order of orders) {
    const fail = (msg) => problems.push(`${order.orderNumber}: ${msg}`)

    if (!ORDER_NUMBER_PATTERN.test(order.orderNumber)) fail('número de orden con formato inválido')
    if (order.orderNumber.slice(4, 12) !== order.createdAt.slice(0, 10).replaceAll('-', '')) fail('el número no coincide con la fecha')
    if (seen.has(order.orderNumber)) fail('número de orden repetido')
    seen.add(order.orderNumber)
    if (order.objectID !== order.orderNumber) fail('objectID distinto del número de orden')
    if (!STATUS_COMBOS[order.orderStatus]?.includes(order.paymentStatus)) {
      fail(`estados incoherentes (${order.orderStatus} + ${order.paymentStatus})`)
    }
    if (!/^\d{4}$/.test(order.paymentMethod?.last4 ?? '')) fail('last4 de la tarjeta inválido')
    if (order.items.length < 1 || order.items.length > 3) fail('debe tener de 1 a 3 productos')

    for (const line of order.items) {
      if (line.priceType !== order.priceType) fail(`${line.id}: tipo de precio distinto al de la orden`)
      if (!Number.isInteger(line.quantity) || line.quantity < line.minQuantity) fail(`${line.id}: cantidad menor al mínimo (${line.minQuantity})`)
      if (line.quantity > line.branchStock) fail(`${line.id}: cantidad mayor al stock de la sucursal (${line.branchStock})`)
      if (line.lineSubtotal !== line.unitPrice * line.quantity) fail(`${line.id}: subtotal de línea no cuadra`)
      if (line.discountAmount !== (line.listPrice - line.unitPrice) * line.quantity) fail(`${line.id}: ahorro de línea no cuadra`)
      if (line.unitPrice !== Math.round(line.listPrice * (1 - line.discountPct))) fail(`${line.id}: precio unitario no cuadra con el descuento`)
      if (order.priceType === 'B2C' && line.discountPct !== 0) fail(`${line.id}: B2C no admite descuento`)
    }

    const subtotal = order.items.reduce((sum, line) => sum + line.lineSubtotal, 0)
    if (subtotal !== order.subtotal) fail('el subtotal no coincide con la suma de líneas')
    if (order.iva !== Math.round(order.subtotal * IVA_RATE)) fail('el IVA no cuadra')
    if (order.shippingCost < MIN_SHIPPING) fail('el envío es menor al mínimo')
    if (order.total !== order.subtotal + order.iva + order.shippingCost) fail('el total no cuadra')
  }

  if (!orders.some((o) => o.priceType === 'B2B' && o.items.some((l) => l.discountPct > 0))) {
    problems.push('Ninguna orden B2B alcanza un descuento por volumen')
  }
  return problems
}

/**
 * Nombre: printSummary
 * Descripción: Imprime un resumen por orden (para el modo --dry).
 */
function printSummary(orders) {
  for (const order of orders) {
    const company = order.customer.company ? ` (${order.customer.company.name})` : ''
    console.log(
      `${order.orderNumber} | ${order.customer.userId} ${order.customer.name}${company} | ${order.customer.role} | ` +
        `${order.branch.name} | ${order.items.length} prod. | total ₡${order.total.toLocaleString('es-CR')} | ` +
        `${order.orderStatus} / ${order.paymentStatus}`,
    )
  }
  console.log(`\nTotal: ${orders.length} órdenes.`)
}

/**
 * Nombre: seed
 * Descripción: Genera y valida las órdenes; en --dry las imprime y termina,
 *              si no las sube a Algolia y configura el índice.
 */
async function seed() {
  const users = JSON.parse(readFileSync('./data/users/users.json', 'utf-8'))
  const orders = buildOrders(users, loadProducts())

  const problems = validateOrders(orders)
  if (problems.length > 0) {
    console.error('Las órdenes de ejemplo no son válidas, no se sube nada:')
    for (const problem of problems) console.error(` - ${problem}`)
    process.exit(1)
  }

  if (DRY_RUN) {
    console.log(`Modo --dry: no se conecta a Algolia (índice ${ORDERS_INDEX}).\n`)
    printSummary(orders)
    return
  }

  const appId = process.env.ALGOLIA_APP_ID
  const adminKey = process.env.ALGOLIA_ADMIN_KEY
  if (!appId || !adminKey) {
    console.error('Faltan las variables ALGOLIA_APP_ID o ALGOLIA_ADMIN_KEY en tu .env')
    process.exit(1)
  }

  const { algoliasearch } = await import('algoliasearch')
  const client = algoliasearch(appId, adminKey)

  await client.replaceAllObjects({ indexName: ORDERS_INDEX, objects: orders })

  await client.setSettings({
    indexName: ORDERS_INDEX,
    indexSettings: {
      searchableAttributes: ['orderNumber', 'customer.name', 'customer.email', 'customer.company.name'],
      attributesForFaceting: [
        'filterOnly(orderNumber)',
        'filterOnly(customer.userId)',
        'customer.role',
        'priceType',
        'branch.name',
        'orderStatus',
        'paymentStatus',
      ],
      customRanking: ['desc(createdAt)'],
    },
  })

  console.log(`${orders.length} órdenes cargadas en ${ORDERS_INDEX}.`)
}

seed().catch((err) => {
  console.error('Error al cargar las órdenes:', err)
  process.exit(1)
})
