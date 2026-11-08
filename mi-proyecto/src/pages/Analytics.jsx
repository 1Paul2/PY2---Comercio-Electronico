import { useMemo, useState } from 'react'
import { InstantSearch } from 'react-instantsearch'
import { Link } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import SearchHeader from '../features/catalog/SearchHeader'
import Footer from '../components/Footer'
import { formatCRC } from '../features/catalog/format'
import { useSession } from '../context/useSession'
import { computeMetrics, describeEvent, filterEvents, getEventLabel } from '../features/analytics/metrics'
import '../styles/Analytics.css'

const RECENT_EVENTS_SHOWN = 12

/**
 * Nombre: formatDateTime
 * Descripción: Fecha y hora legibles en español de Costa Rica.
 */
function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * Nombre: formatDay
 * Descripción: Convierte "2026-11-07" en "7 nov" para el eje del gráfico.
 */
function formatDay(day) {
  const date = new Date(`${day}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? day
    : date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })
}

/**
 * Nombre: MetricCard
 * Descripción: Tarjeta de una métrica: número grande, etiqueta y una nota
 *              que da contexto al número.
 * Entradas: label, value, hint y destacada (resalta las cuatro métricas
 *           principales que pide el enunciado).
 */
function MetricCard({ label, value, hint, destacada = false }) {
  return (
    <article className={`metric-card${destacada ? ' metric-card--main' : ''}`}>
      <p className="metric-card__value">{value}</p>
      <p className="metric-card__label">{label}</p>
      {hint && <p className="metric-card__hint">{hint}</p>}
    </article>
  )
}

/**
 * Nombre: TopList
 * Descripción: Tabla corta de los valores más frecuentes, con una barra
 *              proporcional al más alto para comparar de un vistazo.
 * Entradas: title, items ({ label, count }), emptyText y unit.
 */
function TopList({ title, items, emptyText, unit }) {
  const max = items.reduce((top, item) => Math.max(top, item.count), 0)

  return (
    <section className="analytics-panel" aria-labelledby={`${title}-title`}>
      <h3 id={`${title}-title`}>{title}</h3>
      {items.length === 0 ? (
        <p className="analytics-empty">{emptyText}</p>
      ) : (
        <ol className="top-list">
          {items.map((item) => (
            <li key={item.label}>
              <span className="top-list__label" title={item.label}>{item.label}</span>
              <span className="top-list__bar" aria-hidden="true">
                <span style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%` }} />
              </span>
              <span className="top-list__count">
                {item.count} {unit}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/**
 * Nombre: Analytics
 * Descripción: Sección de métricas de uso de la tienda (laboratorio 5,
 *              requerimiento D). Lee los eventos que se registraron durante
 *              la navegación y muestra las cuatro métricas pedidas, el
 *              embudo de conversión, los listados más frecuentes, la
 *              actividad por día y los últimos eventos.
 *
 *              Todo sale de la actividad real: si nadie ha navegado, la
 *              página lo dice en vez de inventar cifras.
 * Entradas: No recibe props.
 * Salidas: JSX con la página completa.
 * Excepciones: No hay; computeMetrics nunca lanza.
 */
function Analytics() {
  const { session } = useSession()
  // Con sesión activa se puede separar "toda la actividad" de "la mía".
  const [soloMiActividad, setSoloMiActividad] = useState(false)
  const userId = soloMiActividad && session ? session.userId : null

  const metrics = useMemo(() => computeMetrics(userId), [userId])
  const recientes = useMemo(
    () => filterEvents(userId).slice(-RECENT_EVENTS_SHOWN).reverse(),
    [userId]
  )

  const maxDia = metrics.activityByDay.reduce((top, d) => Math.max(top, d.count), 0)
  const sinDatos = metrics.totalEvents === 0

  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      <SearchHeader redirectSearchTo="/productos" />

      <main className="analytics-page">
        <header className="analytics-page__header">
          <p className="analytics-page__eyebrow">Analytics</p>
          <h1>Métricas de uso</h1>
          <p className="analytics-page__intro">
            Resumen de la actividad registrada en esta tienda. Los datos se guardan en
            este navegador y provienen de acciones reales: buscar, ver productos,
            agregarlos al carrito y comprar.
          </p>

          <div className="analytics-page__meta">
            <span>
              <strong>{metrics.totalEvents}</strong> eventos registrados
            </span>
            <span>Último: {formatDateTime(metrics.lastEventAt)}</span>
            {session && (
              <label className="analytics-toggle">
                <input
                  type="checkbox"
                  checked={soloMiActividad}
                  onChange={(e) => setSoloMiActividad(e.target.checked)}
                />
                Ver solo mi actividad ({session.name})
              </label>
            )}
          </div>
        </header>

        {sinDatos ? (
          <section className="analytics-empty-state">
            <h2>Todavía no hay actividad registrada</h2>
            <p>
              Las métricas se construyen con lo que hagas en la tienda. Busca un producto,
              abre su detalle y agrégalo al carrito; al volver aquí vas a ver los datos.
            </p>
            <Link className="analytics-cta" to="/productos">
              Ir al catálogo
            </Link>
          </section>
        ) : (
          <>
            {/* Las cuatro métricas que pide el enunciado. */}
            <section className="analytics-section" aria-labelledby="principales-title">
              <h2 id="principales-title">Métricas principales</h2>
              <div className="metric-grid">
                <MetricCard
                  destacada
                  label="Productos visualizados"
                  value={metrics.productsViewed}
                  hint={`${metrics.uniqueProductsViewed} productos distintos`}
                />
                <MetricCard
                  destacada
                  label="Búsquedas realizadas"
                  value={metrics.searches}
                  hint={`${metrics.topSearches.length} términos distintos`}
                />
                <MetricCard
                  destacada
                  label="Agregados al carrito"
                  value={metrics.addedToCart}
                  hint={`${metrics.unitsAddedToCart} unidades en total`}
                />
                <MetricCard
                  destacada
                  label="Compras realizadas"
                  value={metrics.purchases}
                  hint={metrics.purchases > 0 ? `${formatCRC(metrics.revenue)} en total` : 'Sin compras aún'}
                />
              </div>
            </section>

            <section className="analytics-section" aria-labelledby="complementarias-title">
              <h2 id="complementarias-title">Detalle</h2>
              <div className="metric-grid metric-grid--small">
                <MetricCard label="Checkouts iniciados" value={metrics.checkoutsStarted} />
                <MetricCard label="Inicios de sesión" value={metrics.logins} />
                <MetricCard label="Unidades compradas" value={metrics.purchasedUnits} />
                <MetricCard
                  label="Ticket promedio"
                  value={metrics.purchases > 0 ? formatCRC(metrics.averageOrderValue) : '—'}
                />
              </div>
            </section>

            {/* Embudo: dónde se queda la gente entre mirar y comprar. */}
            <section className="analytics-section" aria-labelledby="embudo-title">
              <h2 id="embudo-title">Embudo de conversión</h2>
              <p className="analytics-section__hint">
                Porcentaje relativo al paso más amplio del embudo.
              </p>
              <ol className="funnel">
                {metrics.funnel.map((paso) => (
                  <li key={paso.step}>
                    <div className="funnel__head">
                      <span className="funnel__step">{paso.step}</span>
                      <span className="funnel__numbers">
                        <strong>{paso.count}</strong> · {paso.rate}%
                      </span>
                    </div>
                    <div className="funnel__bar" aria-hidden="true">
                      <span style={{ width: `${paso.rate}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="analytics-columns">
              <TopList
                title="Búsquedas más frecuentes"
                items={metrics.topSearches}
                emptyText="Todavía no se ha buscado nada."
                unit="veces"
              />
              <TopList
                title="Categorías más vistas"
                items={metrics.topCategories}
                emptyText="Todavía no se ha visto ningún producto."
                unit="vistas"
              />
              <TopList
                title="Productos más vistos"
                items={metrics.topProducts}
                emptyText="Todavía no se ha visto ningún producto."
                unit="vistas"
              />
            </div>

            {metrics.activityByDay.length > 0 && (
              <section className="analytics-section" aria-labelledby="actividad-title">
                <h2 id="actividad-title">Actividad por día</h2>
                <div className="day-chart">
                  {metrics.activityByDay.map((dia) => (
                    <div className="day-chart__col" key={dia.day}>
                      <span className="day-chart__count">{dia.count}</span>
                      <span
                        className="day-chart__bar"
                        style={{ height: `${maxDia > 0 ? Math.max((dia.count / maxDia) * 100, 4) : 4}%` }}
                        aria-hidden="true"
                      />
                      <span className="day-chart__label">{formatDay(dia.day)}</span>
                    </div>
                  ))}
                </div>
                <p className="analytics-section__hint">
                  Eventos de todo tipo registrados cada día.
                </p>
              </section>
            )}

            <section className="analytics-section" aria-labelledby="recientes-title">
              <h2 id="recientes-title">Actividad reciente</h2>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th scope="col">Evento</th>
                      <th scope="col">Detalle</th>
                      <th scope="col">Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recientes.map((evento) => (
                      <tr key={evento.id ?? `${evento.type}-${evento.timestamp}`}>
                        <td>{getEventLabel(evento.type)}</td>
                        <td className="analytics-table__detail">{describeEvent(evento) || '—'}</td>
                        <td>{formatDateTime(evento.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </InstantSearch>
  )
}

export default Analytics
