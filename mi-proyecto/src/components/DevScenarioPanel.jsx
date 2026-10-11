import { SANDBOX_SCENARIO } from '../features/payment/paymentContract'
import { setScenario } from '../features/payment/scenarioSelector'
import '../styles/DevScenarioPanel.css'

/**
 * Nombre: DevScenarioPanel
 * Descripción: Panel flotante visible SOLO en modo desarrollo. Permite
 *              cambiar el escenario del Sandbox de pago con un clic para
 *              facilitar la demo y evaluación de los tres casos:
 *              aprobado, rechazado y error del servicio.
 *              En el build de producción (import.meta.env.DEV === false)
 *              este componente no se renderiza.
 * Entradas:
 *   - currentScenario: escenario activo actual.
 *   - onChange: callback que recibe el nuevo escenario.
 * Salidas: null en producción; JSX del panel en dev.
 * Excepciones: No hay.
 */
function DevScenarioPanel({ currentScenario, onChange }) {
  if (!import.meta.env.DEV) return null

  const options = [
    { value: SANDBOX_SCENARIO.APPROVED, label: 'Aprobado', tone: 'success' },
    { value: SANDBOX_SCENARIO.DECLINED, label: 'Rechazado', tone: 'danger' },
    { value: SANDBOX_SCENARIO.ERROR, label: 'Error del servicio', tone: 'warning' },
  ]

  function handleClick(scenario) {
    setScenario(scenario)
    onChange(scenario)
  }

  return (
    <div className="dev-scenario-panel" role="region" aria-label="Panel de escenarios de prueba">
      <p className="dev-scenario-panel__title">
        <span aria-hidden="true"></span> Escenario Sandbox (dev)
      </p>
      <div className="dev-scenario-panel__options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`dev-scenario-panel__option dev-scenario-panel__option--${option.tone}${
              currentScenario === option.value ? ' dev-scenario-panel__option--active' : ''
            }`}
            onClick={() => handleClick(option.value)}
            aria-pressed={currentScenario === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default DevScenarioPanel