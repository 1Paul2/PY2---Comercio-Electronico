import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { useAdminProducts } from '../../features/admin/useAdminProducts'
import {
  CHANGE_TYPES,
  getPriceOverride,
  resetProduct,
  setPrice,
} from '../../features/admin/adminChanges'
import { formatCRC } from '../../features/catalog/format'
import { formatB2BConditions, normalizeDiscounts } from '../../features/pricing/pricing'

/**
 * Nombre: EditorPrecio
 * Descripción: Formulario de modificación simulada del precio de un
 *              producto. Muestra el valor vigente, pide el nuevo y avisa el
 *              resultado. Si el producto ya tiene un cambio, ofrece
 *              restablecerlo al valor del índice.
 * Entradas: product: producto; onResultado: callback con el mensaje.
 */
function EditorPrecio({ product, onResultado }) {
  const [tipo, setTipo] = useState(CHANGE_TYPES.PRICE_B2C)
  const [valor, setValor] = useState('')

  const modificado =
    getPriceOverride(product.objectID, CHANGE_TYPES.PRICE_B2C) !== null ||
    getPriceOverride(product.objectID, CHANGE_TYPES.PRICE_B2B) !== null

  const guardar = () => {
    const numero = Number(valor)
    const r = setPrice(product, tipo, Number.isInteger(numero) ? numero : NaN)
    onResultado(
      r.ok
        ? { tipo: 'ok', texto: `Precio actualizado en "${product.title}".` }
        : { tipo: 'error', texto: r.error }
    )
    if (r.ok) setValor('')
  }

  const restablecer = () => {
    const r = resetProduct(product.objectID)
    onResultado(
      r.ok
        ? { tipo: 'ok', texto: `"${product.title}" volvió a sus valores originales.` }
        : { tipo: 'error', texto: r.error }
    )
  }

  return (
    <div className="admin-edit">
      <label className="admin-field">
        <span className="admin-field__label">Precio a modificar</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value={CHANGE_TYPES.PRICE_B2C}>Precio B2C</option>
          <option value={CHANGE_TYPES.PRICE_B2B}>Precio B2B</option>
        </select>
      </label>
      <label className="admin-field">
        <span className="admin-field__label">Nuevo valor (colones)</span>
        <input
          type="number"
          min="1"
          step="1"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Ej. 210000"
        />
      </label>
      <button type="button" className="admin-button admin-button--primary" onClick={guardar} disabled={!valor}>
        Guardar cambio
      </button>
      {modificado && (
        <button type="button" className="admin-button admin-button--danger" onClick={restablecer}>
          Restablecer
        </button>
      )}
    </div>
  )
}

/**
 * Nombre: AdminProductos
 * Descripción: Consulta del catálogo para el administrador (proyecto 3).
 *              Muestra de cada producto el precio B2C y el B2B, la cantidad
 *              mínima y los descuentos por volumen, y permite modificar un
 *              precio de forma simulada. Las filas con un valor modificado
 *              quedan resaltadas y se indica cuál era el valor original.
 * Entradas: No recibe props.
 * Salidas: JSX con el buscador y la tabla de productos.
 * Excepciones: No hay.
 */
function AdminProductos() {
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const { products, loading, error } = useAdminProducts(busqueda)

  const producto = products.find((p) => p.objectID === seleccionado) ?? null

  return (
    <AdminLayout
      title="Productos"
      description="Precios por tipo de cliente y condiciones comerciales de cada producto del catálogo."
    >
      {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
      {mensaje && (
        <p className={`admin-message admin-message--${mensaje.tipo}`} role="status">
          {mensaje.texto}
        </p>
      )}

      <section className="admin-panel">
        <div className="admin-filters">
          <label className="admin-field admin-field--grow">
            <span className="admin-field__label">Buscar en el catálogo</span>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, marca o categoría"
            />
          </label>
        </div>

        <p className="admin-panel__hint">
          {loading ? 'Consultando el catálogo...' : `${products.length} productos`}
        </p>

        {!loading && products.length === 0 ? (
          <p className="admin-empty">No se encontraron productos con ese criterio.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Categoría</th>
                  <th scope="col" className="admin-table__num">Precio B2C</th>
                  <th scope="col" className="admin-table__num">Precio B2B</th>
                  <th scope="col" className="admin-table__num">Mínimo B2B</th>
                  <th scope="col">Descuentos por volumen</th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const overrideB2C = getPriceOverride(p.objectID, CHANGE_TYPES.PRICE_B2C)
                  const overrideB2B = getPriceOverride(p.objectID, CHANGE_TYPES.PRICE_B2B)
                  const minimo = p.pricing?.b2b?.min_order_quantity ?? 1
                  const descuentos = normalizeDiscounts(p.pricing?.b2b?.volume_discounts)
                  return (
                    <tr key={p.objectID} className={p.adminModified ? 'is-modified' : undefined}>
                      <td className="admin-table__main">
                        {p.title}
                        <span className="admin-table__sub">{p.objectID} · {p.brand}</span>
                      </td>
                      <td>{p.category_facet ?? '—'}</td>
                      <td className="admin-table__num">
                        {formatCRC(p.pricing?.b2c?.price_crc)}
                        {overrideB2C !== null && (
                          <span className="admin-table__sub">modificado</span>
                        )}
                      </td>
                      <td className="admin-table__num">
                        {formatCRC(p.pricing?.b2b?.price_crc)}
                        {overrideB2B !== null && (
                          <span className="admin-table__sub">modificado</span>
                        )}
                      </td>
                      <td className="admin-table__num">{minimo}</td>
                      <td>{formatB2BConditions(minimo, descuentos)}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-button admin-button--small"
                          onClick={() => {
                            setSeleccionado(p.objectID === seleccionado ? null : p.objectID)
                            setMensaje(null)
                          }}
                        >
                          {p.objectID === seleccionado ? 'Cerrar' : 'Modificar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {producto && (
        <section className="admin-panel">
          <h2 className="admin-panel__title">Modificación simulada: {producto.title}</h2>
          <p className="admin-panel__hint">
            El cambio se guarda en este navegador y se aplica al catálogo, al carrito y al
            checkout. No se modifica el índice de Algolia, porque escribir en él desde la
            aplicación exigiría publicar una llave con permiso de escritura.
          </p>
          <EditorPrecio product={producto} onResultado={setMensaje} />
        </section>
      )}
    </AdminLayout>
  )
}

export default AdminProductos
