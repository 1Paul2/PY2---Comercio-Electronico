import { useState } from 'react'
import { InstantSearch } from 'react-instantsearch'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import SearchHeader from '../features/catalog/SearchHeader'
import Footer from '../components/Footer'
import { useSession } from '../context/useSession'
import { validateEmail } from '../features/checkout/validation'
import '../styles/Login.css'

/**
 * Nombre: validateLoginName
 * Descripción: Valida el nombre con el que el usuario quiere identificarse.
 */
function validateLoginName(value) {
  const trimmed = value.trim()
  if (!trimmed) return 'Escribe tu nombre.'
  if (trimmed.length < 2) return 'El nombre es demasiado corto.'
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'.-]+$/.test(trimmed)) return 'El nombre solo puede contener letras y espacios.'
  return null
}

/**
 * Nombre: Login
 * Descripción: Inicio de sesión simulado (laboratorio 5). Pide nombre y
 *              correo, sin contraseña ni servidor, para saber quién es el
 *              usuario activo y registrar el evento "login". Al terminar
 *              regresa a la página desde la que se llegó.
 * Entradas: No recibe props; lee de location.state la ruta de regreso.
 * Salidas: JSX con el formulario o, si ya hay sesión, los datos del usuario.
 * Excepciones: No hay.
 */
function Login() {
  const { session, login, logout } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.from ?? '/'

  const [values, setValues] = useState({ name: '', email: '' })
  const [submitted, setSubmitted] = useState(false)

  const errors = {
    name: validateLoginName(values.name),
    email: validateEmail(values.email),
  }
  const isValid = !errors.name && !errors.email

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (!isValid) {
      document.getElementById(errors.name ? 'login-name' : 'login-email')?.focus()
      return
    }
    login(values)
    navigate(returnTo, { replace: true })
  }

  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      <SearchHeader redirectSearchTo="/productos" />

      <main className="login-page">
        <div className="login-card">
          {session ? (
            <>
              <p className="login-card__eyebrow">Sesión activa</p>
              <h1>Hola, {session.name}</h1>
              <p className="login-card__text">
                Iniciaste sesión con <strong>{session.email}</strong>. Tus búsquedas,
                productos vistos y compras se guardan a tu nombre en este navegador.
              </p>
              <div className="login-card__actions">
                <Link className="login-card__button" to="/productos">
                  Ver el catálogo
                </Link>
                <button type="button" className="login-card__secondary" onClick={logout}>
                  Cerrar sesión
                </button>
              </div>
            </>
          ) : (
            <form noValidate onSubmit={handleSubmit}>
              <p className="login-card__eyebrow">Maquinaria CR</p>
              <h1>Iniciar sesión</h1>
              <p className="login-card__text">
                Es un inicio de sesión de prueba: no necesitas contraseña. Usamos tu nombre
                y correo para guardar tu actividad solo en este navegador.
              </p>

              <div className={`login-field${submitted && errors.name ? ' login-field--error' : ''}`}>
                <label htmlFor="login-name">Nombre</label>
                <input
                  id="login-name"
                  type="text"
                  autoComplete="name"
                  maxLength={60}
                  value={values.name}
                  onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
                  aria-invalid={Boolean(submitted && errors.name)}
                  aria-describedby={submitted && errors.name ? 'login-name-error' : undefined}
                  placeholder="Ej: María Rodríguez"
                />
                {submitted && errors.name && (
                  <p id="login-name-error" className="login-field__error" role="alert">{errors.name}</p>
                )}
              </div>

              <div className={`login-field${submitted && errors.email ? ' login-field--error' : ''}`}>
                <label htmlFor="login-email">Correo electrónico</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
                  aria-invalid={Boolean(submitted && errors.email)}
                  aria-describedby={submitted && errors.email ? 'login-email-error' : undefined}
                  placeholder="correo@ejemplo.com"
                />
                {submitted && errors.email && (
                  <p id="login-email-error" className="login-field__error" role="alert">{errors.email}</p>
                )}
              </div>

              <button type="submit" className="login-card__button login-card__submit">
                Entrar
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </InstantSearch>
  )
}

export default Login
