import { SANDBOX_SCENARIO } from './paymentContract'

const SCENARIO_STORAGE_KEY = 'maquinaria-cr-payment-scenario-v1'
const VALID_SCENARIOS = Object.values(SANDBOX_SCENARIO)
const DEFAULT_SCENARIO = SANDBOX_SCENARIO.APPROVED

/**
 * Nombre: isValidScenario
 * Descripción: Verifica que un valor sea un escenario válido del Sandbox.
 */
export function isValidScenario(value) {
  return typeof value === 'string' && VALID_SCENARIOS.includes(value)
}

/**
 * Nombre: readScenarioFromStorage
 * Descripción: Lee el escenario guardado en sessionStorage. Devuelve null
 *              si no hay nada, si es inválido o si el storage falla.
 */
function readScenarioFromStorage() {
  try {
    const raw = sessionStorage.getItem(SCENARIO_STORAGE_KEY)
    return isValidScenario(raw) ? raw : null
  } catch {
    return null
  }
}

/**
 * Nombre: writeScenarioToStorage
 * Descripción: Guarda el escenario en sessionStorage. Ignora errores de
 *              almacenamiento (modo privado, cuota llena).
 */
function writeScenarioToStorage(scenario) {
  try {
    sessionStorage.setItem(SCENARIO_STORAGE_KEY, scenario)
  } catch { }
}

/**
 * Nombre: clearScenario
 * Descripción: Limpia la elección de escenario. Se llama cuando se quiere
 *              volver al valor por defecto (APPROVED).
 */
export function clearScenario() {
  try {
    sessionStorage.removeItem(SCENARIO_STORAGE_KEY)
  } catch { }
}

/**
 * Nombre: resolveScenario
 * Descripción: Determina el escenario activo aplicando la prioridad:
 *                1. Query param (?scenario=...) si es válido.
 *                2. Valor guardado en sessionStorage si es válido.
 *                3. Valor por defecto (APPROVED).
 *              Esta es la función que el checkout usa para saber qué
 *              escenario enviar al Sandbox.
 * Entradas: queryParam: string | null | undefined (de useSearchParams).
 * Salidas: uno de los valores de SANDBOX_SCENARIO.
 * Excepciones: No lanza.
 */
export function resolveScenario(queryParam) {
  if (isValidScenario(queryParam)) return queryParam
  const stored = readScenarioFromStorage()
  if (stored) return stored
  return DEFAULT_SCENARIO
}

/**
 * Nombre: setScenario
 * Descripción: Guarda el escenario elegido por el usuario en sessionStorage.
 *              Solo acepta valores válidos.
 * Entradas: scenario: string.
 * Salidas: true si se guardó; false si el valor no es válido o el storage
 *          falló.
 * Excepciones: No lanza.
 */
export function setScenario(scenario) {
  if (!isValidScenario(scenario)) return false
  writeScenarioToStorage(scenario)
  return true
}

export { DEFAULT_SCENARIO, VALID_SCENARIOS }