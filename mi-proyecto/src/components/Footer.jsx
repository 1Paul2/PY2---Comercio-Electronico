import { Link } from 'react-router-dom'
import { POLICY_PAGES } from '../features/policies/policyPages'
import '../styles/Footer.css'

/**
 * Nombre: Footer
 * Descripción: Renderiza el pie de página del sitio con la marca, navegación,
 * categorías, enlaces de ayuda y políticas, y datos de contacto.
 * Entradas: No recibe parámetros.
 * Salidas: JSX con el footer visible en la aplicación.
 * Excepciones: No hay.
 */
function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__container">
        <div className="site-footer__col">
          <h2 className="site-footer__brand">
            Maquinaria <span className="highlight">CR</span>
          </h2>
          <p className="site-footer__about">
            Soluciones integrales en repuestos y maquinaria pesada. Calidad, respaldo y garantía para optimizar tus proyectos.
          </p>
        </div>

        <div className="site-footer__col">
          <h3 className="site-footer__title">Navegación</h3>
          <ul className="site-footer__links">
            <li><Link to="/">› Inicio</Link></li>
            <li><Link to="/productos">› Productos</Link></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h3 className="site-footer__title">Categorías</h3>
          <ul className="site-footer__links">
            <li><Link to="/productos?categoria=Excavadora">Excavadoras</Link></li>
            <li><Link to="/productos?categoria=Bulldozer">Bulldozer</Link></li>
            <li><Link to="/productos?categoria=Cargador%20de%20Ruedas">Cargador de Ruedas</Link></li>
            <li><Link to="/productos?categoria=Mezcladora%20de%20Concreto">Mezcladora de Concreto</Link></li>
          </ul>
        </div>

        <div className="site-footer__col">
          <h3 className="site-footer__title">Ayuda y políticas</h3>
          <ul className="site-footer__links">
            {POLICY_PAGES.map((page) => (
              <li key={page.path}><Link to={page.path}>{page.label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="site-footer__col">
          <h3 className="site-footer__title">Contacto</h3>
          <ul className="site-footer__contact">
            <li> <span>San José, Costa Rica</span></li>
            <li> <span>+506 8000-0000</span></li>
            <li> <span>info@maquinariacr.com</span></li>
            <li> <span>Lun - Vie: 7:30 AM - 5:00 PM</span></li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="site-footer__bottom-container">
          <p>&copy; {new Date().getFullYear()} Maquinaria CR. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer