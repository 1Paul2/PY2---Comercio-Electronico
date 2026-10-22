import { useEffect } from 'react'
import { InstantSearch } from 'react-instantsearch'
import { NavLink } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import SearchHeader from '../features/catalog/SearchHeader'
import { POLICY_PAGES } from '../features/policies/policyPages'
import Footer from './Footer'
import '../styles/Policies.css'

/**
 * Nombre: scrollToSection
 * Descripción: Desplaza la página hasta una sección del documento. Se usa un
 *              botón en vez de un enlace "#id" porque la app usa HashRouter y
 *              ese tipo de enlace cambiaría la ruta.
 */
function scrollToSection(id) {
  const element = document.getElementById(id)
  if (!element) return
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  element.focus({ preventScroll: true })
}

/**
 * Nombre: PolicyLayout
 * Descripción: Plantilla común de las páginas informativas (términos,
 *              privacidad, devoluciones, envíos y preguntas frecuentes).
 *              Mantiene el header y el footer de la tienda, muestra un índice
 *              de secciones y enlaces a las demás políticas.
 * Entradas:
 *   - eyebrow: texto corto sobre el título (por ejemplo "Políticas").
 *   - title: título de la página.
 *   - intro: párrafo de introducción.
 *   - updatedAt: fecha de la última actualización, como texto.
 *   - sections: arreglo de { id, title, content } donde content es JSX.
 *   - children (opcional): contenido extra después de las secciones.
 * Salidas: JSX con la página completa.
 * Excepciones: No hay.
 */
function PolicyLayout({ eyebrow = 'Información de la tienda', title, intro, updatedAt, sections = [], children }) {
  // Al llegar desde el footer la página quedaría abajo; se empieza arriba.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [title])

  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      <SearchHeader redirectSearchTo="/productos" />

      <main className="policy-page">
        <header className="policy-page__header">
          <p className="policy-page__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {intro && <p className="policy-page__intro">{intro}</p>}
          {updatedAt && <p className="policy-page__updated">Última actualización: {updatedAt}</p>}
        </header>

        <div className="policy-page__layout">
          <aside className="policy-page__aside">
            {sections.length > 1 && (
              <nav className="policy-page__toc" aria-label="Contenido de la página">
                <p className="policy-page__aside-title">En esta página</p>
                <ol>
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button type="button" onClick={() => scrollToSection(section.id)}>
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <nav className="policy-page__related" aria-label="Otras políticas">
              <p className="policy-page__aside-title">Ayuda y políticas</p>
              <ul>
                {POLICY_PAGES.map((page) => (
                  <li key={page.path}>
                    <NavLink to={page.path}>{page.label}</NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="policy-page__content">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="policy-section"
                tabIndex={-1}
                aria-labelledby={`${section.id}-title`}
              >
                <h2 id={`${section.id}-title`}>{section.title}</h2>
                {section.content}
              </section>
            ))}
            {children}
          </article>
        </div>
      </main>

      <Footer />
    </InstantSearch>
  )
}

export default PolicyLayout
