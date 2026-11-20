import { readFileSync } from 'fs'
import 'dotenv/config'

/*
 * upload-orders.mjs — Sube al índice grupo-07_orders de Algolia las órdenes
 * generadas en el checkout de un navegador.
 *
 * La aplicación guarda cada orden nueva en localStorage y no escribe en
 * Algolia, porque eso exigiría publicar una llave con permiso de escritura
 * dentro del paquete que descarga cualquier visitante. Para que esas órdenes
 * también queden en el índice especializado de órdenes:
 *
 *   1. El administrador entra a Panel > Órdenes y pulsa
 *      "Exportar órdenes de este navegador" (descarga ordenes-AAAA-MM-DD.json).
 *   2. Se ejecuta este script con ese archivo:
 *        npm run upload-orders -- ruta/al/ordenes-AAAA-MM-DD.json
 *
 * El script valida cada orden, usa el número de orden como objectID y la
 * agrega o actualiza con saveObjects: no borra las órdenes que ya estén en el
 * índice (a diferencia de seed-orders, que reemplaza todo el contenido).
 *
 * Uso:
 *   npm run upload-orders -- <archivo.json>          sube las órdenes
 *   node scripts/upload-orders.mjs <archivo> --dry   solo valida, sin Algolia
 */

const ORDERS_INDEX = 'grupo-07_orders'
const ORDER_NUMBER_PATTERN = /^MCR-\d{8}-[0-9A-HJKMNP-TV-Z]{8}$/
const ROLES = ['B2C', 'B2B']
const DRY_RUN = process.argv.includes('--dry')

/**
 * Nombre: validateOrder
 * Descripción: Revisa que una orden tenga los datos mínimos que pide el
 *              proyecto (número, usuario, fecha, productos, cantidades,
 *              precios, sucursal, total y estados).
 * Entradas: order: objeto leído del archivo.
 * Salidas: arreglo de problemas encontrados (vacío si la orden sirve).
 */
function validateOrder(order) {
  const problems = []
  if (!ORDER_NUMBER_PATTERN.test(order?.orderNumber ?? '')) problems.push('número de orden inválido')
  if (!order?.customer?.userId) problems.push('sin usuario')
  if (!ROLES.includes(order?.customer?.role)) problems.push('rol de cliente inválido')
  if (Number.isNaN(Date.parse(order?.createdAt))) problems.push('fecha inválida')
  if (!Array.isArray(order?.items) || order.items.length === 0) problems.push('sin productos')
  for (const item of order?.items ?? []) {
    if (!Number.isInteger(item?.quantity) || item.quantity < 1) problems.push(`cantidad inválida en ${item?.id}`)
    if (!Number.isFinite(item?.unitPrice) || item.unitPrice <= 0) problems.push(`precio inválido en ${item?.id}`)
  }
  if (!order?.branch?.name) problems.push('sin sucursal')
  if (!Number.isFinite(order?.total) || order.total <= 0) problems.push('total inválido')
  if (typeof order?.orderStatus !== 'string') problems.push('sin estado de la orden')
  if (typeof order?.paymentStatus !== 'string') problems.push('sin estado del pago')
  return problems
}

/**
 * Nombre: toIndexRecord
 * Descripción: Prepara la orden para el índice: el número de orden es el
 *              objectID (así subirla dos veces la actualiza en vez de
 *              duplicarla) y se quitan los campos que solo usa la app local.
 */
function toIndexRecord(order) {
  const { source: _source, ...record } = order
  return { ...record, objectID: order.orderNumber }
}

async function upload() {
  const file = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
  if (!file) {
    console.error('Indica el archivo exportado desde el panel: npm run upload-orders -- ordenes-AAAA-MM-DD.json')
    process.exit(1)
  }

  let orders
  try {
    orders = JSON.parse(readFileSync(file, 'utf8'))
  } catch (err) {
    console.error(`No se pudo leer ${file}: ${err.message}`)
    process.exit(1)
  }
  if (!Array.isArray(orders)) {
    console.error('El archivo debe contener una lista de órdenes (el JSON que descarga el panel).')
    process.exit(1)
  }

  const valid = []
  for (const order of orders) {
    const problems = validateOrder(order)
    if (problems.length > 0) {
      console.warn(`Se omite ${order?.orderNumber ?? '(sin número)'}: ${problems.join(', ')}`)
    } else {
      valid.push(toIndexRecord(order))
    }
  }

  console.log(`${valid.length} de ${orders.length} órdenes listas para ${ORDERS_INDEX}.`)
  if (valid.length === 0) process.exit(1)

  if (DRY_RUN) {
    for (const order of valid) {
      console.log(` - ${order.orderNumber}  ${order.customer.role}  ${order.branch.name}  total ${order.total}  ${order.paymentStatus}`)
    }
    console.log('Modo --dry: no se conectó a Algolia.')
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
  await client.saveObjects({ indexName: ORDERS_INDEX, objects: valid, waitForTasks: true })
  console.log(`${valid.length} órdenes agregadas o actualizadas en ${ORDERS_INDEX}.`)
}

upload().catch((err) => {
  console.error('Error al subir las órdenes:', err)
  process.exit(1)
})
