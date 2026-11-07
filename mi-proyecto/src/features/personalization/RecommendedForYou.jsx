import { useMemo, useState } from 'react'
import ProductCarousel from '../catalog/ProductCarousel'
import { usePersonalHistory } from './usePersonalHistory'
import { useProductSearch } from './productQueries'
import { buildProductRequest, buildRecommendationTabs, excludeAndLimit } from './recommendations'
import '../../styles/Personalization.css'

const RECOMMENDATION_LIMIT = 12

/**
 * Nombre: RecommendedForYou
 * Descripción: "Inspirado en tu historial". Recomienda productos de las
 *              categorías que el usuario más ha visto y de su última
 *              búsqueda (ver recommendations.js). Las pestañas permiten
 *              cambiar de interés sin recargar. Nunca muestra productos que
 *              el usuario ya vio. Sin historial no se muestra.
 * Entradas: No recibe parámetros.
 * Salidas: JSX con el carrusel de recomendaciones o null.
 * Excepciones: No hay.
 */
function RecommendedForYou() {
  const { history } = usePersonalHistory()
  const tabs = useMemo(() => buildRecommendationTabs(history), [history])
  const viewedIds = useMemo(() => (history?.products ?? []).map((item) => item.objectID), [history])
  const [selectedTabId, setSelectedTabId] = useState('all')

  const activeTab = tabs.find((tab) => tab.id === selectedTabId) ?? tabs[0]
  const request = activeTab ? buildProductRequest(activeTab, viewedIds, RECOMMENDATION_LIMIT) : null
  const { status, hits } = useProductSearch(request)
  const recommendations = excludeAndLimit(hits, viewedIds, RECOMMENDATION_LIMIT)

  if (!activeTab || status === 'error') return null

  const toolbar = (
    <div className="personal-tabs-area">
      {tabs.length > 1 && (
        <div className="personal-tabs" role="group" aria-label="Elegir tipo de recomendación">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`personal-tab${tab.id === activeTab.id ? ' personal-tab--active' : ''}`}
              aria-pressed={tab.id === activeTab.id}
              onClick={() => setSelectedTabId(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {status === 'loading' && <p className="personal-note">Buscando recomendaciones…</p>}
      {status === 'ready' && recommendations.length === 0 && (
        <p className="personal-note">Ya viste todo lo que tenemos aquí. Prueba con otra pestaña.</p>
      )}
    </div>
  )

  return (
    <ProductCarousel
      title="Inspirado en tu historial"
      subtitle={activeTab.reason}
      toolbar={toolbar}
      hits={recommendations}
      className="personal-section"
    />
  )
}

export default RecommendedForYou
