import { useEffect, useRef, useState } from 'react'
import { SANDBOX_SCENARIO } from '../features/payment/paymentContract'
import { setScenario } from '../features/payment/scenarioSelector'
import '../styles/DevScenarioPanel.css'

const OPTIONS = [
  {
    value: SANDBOX_SCENARIO.APPROVED,
    label: 'Pago aprobado',
    hint: 'PAYMENT_APPROVED',
    tone: 'success',
  },
  {
    value: SANDBOX_SCENARIO.DECLINED,
    label: 'Pago rechazado',
    hint: 'PAYMENT_DECLINED',
    tone: 'danger',
  },
  {
    value: SANDBOX_SCENARIO.ERROR,
    label: 'Error del servicio',
    hint: 'PAYMENT_ERROR',
    tone: 'warning',
  },
]

/**
 * Nombre: DevScenarioPanel
 * Descripción: Panel flotante del simulador Sandbox. Permite elegir con un
 *              clic qué resultado devolverá el servicio de pago, para poder
 *              demostrar los tres escenarios del enunciado: aprobado,
 *              rechazado y error del servicio.
 * Entradas:
 *   - currentScenario: escenario activo actual.
 *   - onChange: callback que recibe el nuevo escenario.
 *   - disable: bloquea el cambio mientras se procesa un pago.
 * Salidas: JSX del panel.
 * Excepciones: No hay.
 */
function DevScenarioPanel({ currentScenario, onChange, disabled = false }) {
  const [expanded, setExpanded] = useState(false)
  const panelRef = useRef(null)

  // Mientras está abierto, un toque fuera del panel o la tecla Escape lo
  // cierran. Los listeners solo existen mientras el panel está abierto.
  useEffect(() => {
    if (!expanded) return undefined

    function handlePointerDown(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setExpanded(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setExpanded(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [expanded])
  const active = OPTIONS.find((option) => option.value === currentScenario) ?? OPTIONS[0]

  function handleClick(scenario) {
    setScenario(scenario)
    onChange(scenario)
  }

  return (
    <div
      ref={panelRef}
      className={`dev-scenario-panel${expanded ? '' : ' dev-scenario-panel--collapsed'}`}
      role="region"
      aria-label="Simulador de escenarios de pago Sandbox"
    >
      <button
        type="button"
        className="dev-scenario-panel__toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls="dev-scenario-panel-options"
      >
        <span className="dev-scenario-panel__title">Simulador Sandbox</span>
        <span className={`dev-scenario-panel__current dev-scenario-panel__current--${active.tone}`}>
          {active.label}
        </span>
        <span className="dev-scenario-panel__chevron" aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {expanded && (
        <div id="dev-scenario-panel-options" className="dev-scenario-panel__body">
          <p className="dev-scenario-panel__help">
            Elige qué responderá el servicio de pago en el próximo intento.
          </p>
          <div className="dev-scenario-panel__options">
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`dev-scenario-panel__option dev-scenario-panel__option--${option.tone}${
                  currentScenario === option.value ? ' dev-scenario-panel__option--active' : ''
                }`}
                onClick={() => handleClick(option.value)}
                aria-pressed={currentScenario === option.value}
                disabled={disabled}
              >
                <span>{option.label}</span>
                <code className="dev-scenario-panel__code">{option.hint}</code>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DevScenarioPanel
