import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearHistory } from '../history/history'
import { repeatSearch, usePersonalHistory } from './usePersonalHistory'
import RecentSearches from './RecentSearches'
import RecentlyViewed from './RecentlyViewed'
import RecommendedForYou from './RecommendedForYou'
import '../../styles/Personalization.css'

/**
 * Nombre: ClearHistoryButton
 * Descripción: "Borrar historial" con confirmación en el mismo lugar
 *              (sin ventana emergente): pide "¿Borrar todo?" antes de borrar.
 */
function ClearHistoryButton() {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button type="button" className="personal-link-button" onClick={() => setConfirming(true)}>
        Borrar historial
      </button>
    )
  }

  return (
    <div className="personal-confirm" role="group" aria-label="Confirmar borrado del historial">
      <span>¿Borrar productos vistos y búsquedas?</span>
      <button
        type="button"
        className="personal-confirm__yes"
        onClick={() => {
          clearHistory()
          setConfirming(false)
        }}
      >
        Sí, borrar
      </button>
      <button type="button" className="personal-confirm__no" onClick={() => setConfirming(false)}>
        Cancelar
      </button>
    </div>
  )
}

/**
 * Nombre: PersonalHome
 * Descripción: Sección personalizada del inicio (laboratorio 5, requerimiento C).
 *              Con sesión: saludo, búsquedas recientes, "Seguí donde lo
 *              dejaste" y "Inspirado en tu historial", todo calculado con el
 *              historial real del usuario. Sin sesión: invitación a iniciarla.
 * Entradas: No recibe parámetros.
 * Salidas: JSX con la sección.
 * Excepciones: No hay.
 */
function PersonalHome() {
  const { session, history } = usePersonalHistory()
  const navigate = useNavigate()

  if (!session) {
    return (
      <section className="personal-home">
        <div className="personal-invite">
          <div>
            <h2>Tu tienda, a tu medida</h2>
            <p>Iniciá sesión para ver tus productos recientes y recomendaciones hechas para vos.</p>
          </div>
          <Link to="/login" state={{ from: '/' }} className="personal-invite__button">
            Iniciar sesión
          </Link>
        </div>
      </section>
    )
  }

  const firstName = session.name.split(' ')[0]
  const hasActivity = history.products.length > 0 || history.searches.length > 0

  function handleSearch(query) {
    repeatSearch(query)
    navigate(`/productos?q=${encodeURIComponent(query)}`)
  }

  return (
    <section className="personal-home" aria-labelledby="personal-home-title">
      <div className="personal-home__intro">
        <div>
          <h2 id="personal-home-title">Hola, {firstName}</h2>
          <p>
            {hasActivity
              ? 'Esto es lo que preparamos según lo que viste y buscaste.'
              : 'Todavía no tenemos actividad tuya. Explorá el catálogo y acá vas a ver tus productos recientes y recomendaciones.'}
          </p>
        </div>
        {hasActivity ? (
          <ClearHistoryButton />
        ) : (
          <Link to="/productos" className="personal-invite__button">
            Explorar el catálogo
          </Link>
        )}
      </div>

      <RecentSearches onSelect={handleSearch} />
      <RecentlyViewed title="Seguí donde lo dejaste" subtitle="Los últimos productos que viste" />
      <RecommendedForYou />
    </section>
  )
}

export default PersonalHome
