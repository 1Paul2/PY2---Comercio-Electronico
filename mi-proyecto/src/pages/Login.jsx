import { useCallback, useEffect, useState } from 'react'
import { InstantSearch } from 'react-instantsearch'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { searchClient } from '../features/catalog/searchClient'
import SearchHeader from '../features/catalog/SearchHeader'
import Footer from '../components/Footer'
import RoleBadge from '../components/RoleBadge'
import { useSession } from '../context/useSession'
import { validateEmail } from '../features/checkout/validation'
import { fetchUsers } from '../features/session/usersIndex'
import { ROLES, ROLE_INFO, isValidRole } from '../features/session/roles'
import '../styles/Login.css'

const LOAD_ERROR_MESSAGE =
  'No pudimos consultar los usuarios de la tienda. Revisa tu conexión e inténtalo de nuevo.'

/**
 * Nombre: getHomeForRole
 * Descripción: Página a la que se lleva al usuario después de iniciar sesión
 *              si no venía de ninguna otra: el administrador va a su panel.
 */
function getHomeForRole(role) {
  return role === ROLES.ADMIN ? '/admin' : '/productos'
}

/**
 * Nombre: CompanyDetails
 * Descripción: Datos de la empresa de un cliente B2B.
 */
function CompanyDetails({ company }) {
  return (
    <dl className="login-company">
      <div>
        <dt>Empresa</dt>
        <dd>{company.name}</dd>
      </div>
      <div>
        <dt>Cédula jurídica</dt>
        <dd>{company.legalId}</dd>
      </div>
      {company.sector && (
        <div>
          <dt>Sector</dt>
          <dd>{company.sector}</dd>
        </div>
      )}
      {company.contact && (
        <div>
          <dt>Contacto</dt>
          <dd>{company.contact}</dd>
        </div>
      )}
    </dl>
  )
}

/**
 * Nombre: ActiveSession
 * Descripción: Tarjeta con los datos del usuario que ya inició sesión.
 */
function ActiveSession({ session, onLogout }) {
  const isAdmin = session.role === ROLES.ADMIN
  return (
    <>
      <p className="login-card__eyebrow">Sesión activa</p>
      <h1>Hola, {session.name}</h1>
      <div className="login-card__role">
        <RoleBadge role={session.role} full />
        <span>{ROLE_INFO[session.role].description}</span>
      </div>
      <p className="login-card__text">
        Iniciaste sesión con <strong>{session.email}</strong>.
      </p>
      {session.company && <CompanyDetails company={session.company} />}
      <div className="login-card__actions">
        {isAdmin ? (
          <Link className="login-card__button" to="/admin">
            Ir al panel administrativo
          </Link>
        ) : (
          <>
            <Link className="login-card__button" to="/productos">
              Ver el catálogo
            </Link>
            <Link className="login-card__secondary" to="/mis-ordenes">
              Mis órdenes
            </Link>
          </>
        )}
        <button type="button" className="login-card__secondary" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </>
  )
}

/**
 * Nombre: Login
 * Descripción: Inicio de sesión simulado. Los usuarios vienen del índice de
 *              usuarios de Algolia: se puede elegir uno de la lista o escribir
 *              su correo. No hay contraseña. Solo entran los usuarios que
 *              existen y tienen un rol válido (B2C, B2B o ADMIN); en los demás
 *              casos se explica por qué no se puede entrar.
 * Entradas: No recibe props; lee de location.state la ruta de regreso.
 * Salidas: JSX con el formulario o, si ya hay sesión, los datos del usuario.
 * Excepciones: No hay; los errores de conexión se muestran como mensaje.
 */
function Login() {
  const { session, login, logout } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.from

  const [users, setUsers] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [loginError, setLoginError] = useState(null)

  // Los estados se actualizan cuando responde Algolia, no durante el efecto.
  const requestUsers = useCallback(() => {
    fetchUsers().then(
      (loadedUsers) => {
        setUsers(loadedUsers)
        setLoadStatus('ready')
      },
      () => setLoadStatus('error')
    )
  }, [])

  useEffect(() => {
    if (!session) requestUsers()
  }, [session, requestUsers])

  function retryLoadUsers() {
    setLoadStatus('loading')
    requestUsers()
  }

  const emailError = validateEmail(email)

  /**
   * Nombre: enterAs
   * Descripción: Valida el usuario elegido e inicia la sesión. Si el usuario
   *              no existe o no tiene un rol válido, muestra el motivo.
   */
  function enterAs(user) {
    if (!user) {
      setLoginError(
        'No encontramos un usuario con ese correo. Revisa que esté bien escrito o elige uno de la lista.'
      )
      return
    }
    if (!isValidRole(user.role)) {
      setLoginError(
        `${user.name} no tiene un rol válido en la tienda, por eso no puede iniciar sesión. Comunícate con el administrador.`
      )
      return
    }
    setLoginError(null)
    login(user)
    navigate(returnTo ?? getHomeForRole(user.role), { replace: true })
  }

  function handleSubmit(event) {
    event.preventDefault()
    setEmailTouched(true)
    if (emailError) {
      document.getElementById('login-email')?.focus()
      return
    }
    if (loadStatus !== 'ready') {
      setLoginError(LOAD_ERROR_MESSAGE)
      return
    }
    const normalized = email.trim().toLowerCase()
    enterAs(users.find((user) => user.email === normalized) ?? null)
  }

  return (
    <InstantSearch searchClient={searchClient} indexName="grupo-07_products">
      <SearchHeader redirectSearchTo="/productos" />

      <main className="login-page">
        <div className={`login-card${session ? '' : ' login-card--wide'}`}>
          {session ? (
            <ActiveSession session={session} onLogout={logout} />
          ) : (
            <>
              <p className="login-card__eyebrow">Maquinaria CR</p>
              <h1>Iniciar sesión</h1>
              <p className="login-card__text">
                Es un inicio de sesión de prueba, sin contraseña. Elige uno de los usuarios
                registrados o escribe su correo. Los precios, el menú y lo que puedes hacer en
                la tienda cambian según el rol del usuario.
              </p>

              {loginError && (
                <p className="login-card__alert" role="alert">
                  {loginError}
                </p>
              )}

              <section aria-labelledby="login-users-title">
                <h2 id="login-users-title" className="login-section-title">
                  Usuarios registrados
                </h2>
                {loadStatus === 'loading' && (
                  <p className="login-card__status" role="status">
                    Cargando usuarios...
                  </p>
                )}
                {loadStatus === 'error' && (
                  <div className="login-card__status login-card__status--error" role="alert">
                    <p>{LOAD_ERROR_MESSAGE}</p>
                    <button type="button" className="login-card__secondary" onClick={retryLoadUsers}>
                      Reintentar
                    </button>
                  </div>
                )}
                {loadStatus === 'ready' && (
                  <ul className="login-users">
                    {users.map((user) => (
                      <li key={user.userId}>
                        <button type="button" className="login-user" onClick={() => enterAs(user)}>
                          <span className="login-user__top">
                            <span className="login-user__name">{user.name}</span>
                            <RoleBadge role={user.role} />
                          </span>
                          <span className="login-user__meta">
                            {user.company ? user.company.name : user.email}
                          </span>
                          {user.description && (
                            <span className="login-user__description">{user.description}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <form noValidate onSubmit={handleSubmit} className="login-form">
                <h2 className="login-section-title">O entra con tu correo</h2>
                <div className={`login-field${emailTouched && emailError ? ' login-field--error' : ''}`}>
                  <label htmlFor="login-email">Correo electrónico</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setLoginError(null)
                    }}
                    aria-invalid={Boolean(emailTouched && emailError)}
                    aria-describedby={emailTouched && emailError ? 'login-email-error' : undefined}
                    placeholder="correo@ejemplo.com"
                  />
                  {emailTouched && emailError && (
                    <p id="login-email-error" className="login-field__error" role="alert">
                      {emailError}
                    </p>
                  )}
                </div>

                <button type="submit" className="login-card__button login-card__submit">
                  Entrar
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </InstantSearch>
  )
}

export default Login
