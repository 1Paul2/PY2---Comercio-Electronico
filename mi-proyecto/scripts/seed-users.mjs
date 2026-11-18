import { algoliasearch } from 'algoliasearch'
import { readFileSync } from 'fs'
import 'dotenv/config'

/*
 * seed-users.mjs — Carga los usuarios iniciales (data/users/users.json) en el
 * índice grupo-07_users de Algolia. Se usa replaceAllObjects para que el
 * índice quede exactamente igual al archivo, aunque se borre o renombre un
 * usuario. Los usuarios viven en una subcarpeta para que seed-algolia.mjs,
 * que lee los .json de data/, no los mezcle con los productos.
 */

const USERS_INDEX = 'grupo-07_users'
const appId = process.env.ALGOLIA_APP_ID
const adminKey = process.env.ALGOLIA_ADMIN_KEY

if (!appId || !adminKey) {
  console.error('Faltan las variables ALGOLIA_APP_ID o ALGOLIA_ADMIN_KEY en tu .env')
  process.exit(1)
}

const client = algoliasearch(appId, adminKey)
const users = JSON.parse(readFileSync('./data/users/users.json', 'utf-8'))

async function seed() {
  await client.replaceAllObjects({ indexName: USERS_INDEX, objects: users })

  await client.setSettings({
    indexName: USERS_INDEX,
    indexSettings: {
      searchableAttributes: ['name', 'email', 'company.name'],
      attributesForFaceting: ['role', 'searchable(email)'],
    },
  })

  console.log(`${users.length} usuarios cargados en ${USERS_INDEX}.`)
}

seed().catch((err) => {
  console.error('Error al cargar los usuarios:', err)
  process.exit(1)
})
