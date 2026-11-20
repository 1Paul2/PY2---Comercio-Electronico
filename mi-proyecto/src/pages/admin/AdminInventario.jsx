import { useMemo, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { BRANCHES } from '../../features/inventory/branches'
import { useAdminProducts } from '../../features/admin/useAdminProducts'
import {
  getEffectiveStock,
  getStockOverride,
  resetProduct,
  setStock,
} from '../../features/admin/adminChanges'

const TODAS = 'TODAS'

/**
 * Nombre: EditorStock
 * Descripción: Modificación simulada de las existencias de un producto en
 *              una sucursal. Permite poner cero, que es un caso válido y el
 *              más útil para probar el bloqueo de compra por falta de
 *              inventario.
 */
function EditorStock({ product, onResultado }) {
  const [branchId, setBranchId] = useState(BRANCHES[0].id)
  const [valor, setValor] = useState('')

  const actual = getEffectiveStock(product, branchId)
  const tieneCambios = BRANCHES.some((b) => getStockOverride(product.objectID, b.id) !== null)

  const guardar = () => {
    const numero = Number(valor)
    const r = setStock(product, branchId, Number.isInteger(numero) ? numero : NaN)
    onResultado(
      r.ok
        ? { tipo: 'ok', texto: `Inventario actualizado en "${product.title}".` }
        : { tipo: 'error', texto: r.error }
    )
    if (r.ok) setValor('')
  }

  const restablecer = () => {
    const r = resetProduct(product.objectID)
    onResultado(
      r.ok
        ? { tipo: 'ok', texto: `"${product.title}" volvió a su inventario original.` }
        : { tipo: 'error', texto: r.error }
    )
  }

  return (
    <div className="admin-edit">
      <label className="admin-field">
        <span className="admin-field__label">Sucursal</span>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          {BRANCHES.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </label>
      <label className="admin-field">
        <span className="admin-field__label">Existencias actuales</span>
        <input type="number" value={actual} readOnly tabIndex={-1} />
      </label>
      <label className="admin-field">
        <span className="admin-field__label">Nuevo valor</span>
        <input
          type="number"
          min="0"
          step="1"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Ej. 0"
        />
      </label>
      <button
        type="button"
        className="admin-button admin-button--primary"
        onClick={guardar}
        disabled={valor === ''}
      >
        Guardar cambio
      </button>
      {tieneCambios && (
        <button type="button" className="admin-button admin-button--danger" onClick={restablecer}>
          Restablecer
        </button>
      )}
    </div>
  )
}

/**
 * Nombre: AdminInventario
 * Descripción: Disponibilidad por sucursal (proyecto 3). Muestra cuántas
 *              unidades hay de cada producto en San José, Alajuela y
 *              Cartago Centro, resaltando las sucursales sin existencias, y
 *              permite modificar el inventario de forma simulada.
 * Entradas: No recibe props.
 * Salidas: JSX con el resumen por sucursal y la tabla de productos.
 * Excepciones: No hay.
 */
function AdminInventario() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroSucursal, setFiltroSucursal] = useState(TODAS)
  const [soloAgotados, setSoloAgotados] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const { products, loading, error } = useAdminProducts(busqueda)

  // Existencias por producto y sucursal, ya con los cambios aplicados.
  const filas = useMemo(
    () =>
      products.map((p) => ({
        producto: p,
        porSucursal: BRANCHES.map((b) => ({
          branch: b,
          stock: getEffectiveStock(p, b.id),
          modificado: getStockOverride(p.objectID, b.id) !== null,
        })),
      })),
    [products]
  )

  const visibles = filas.filter((fila) => {
    if (!soloAgotados) return true
    return filtroSucursal === TODAS
      ? fila.porSucursal.some((s) => s.stock === 0)
      : fila.porSucursal.find((s) => s.branch.id === filtroSucursal)?.stock === 0
  })

  const totalesPorSucursal = BRANCHES.map((b) => ({
    branch: b,
    unidades: filas.reduce(
      (suma, fila) => suma + (fila.porSucursal.find((s) => s.branch.id === b.id)?.stock ?? 0),
      0
    ),
    agotados: filas.filter(
      (fila) => fila.porSucursal.find((s) => s.branch.id === b.id)?.stock === 0
    ).length,
  }))

  const producto = products.find((p) => p.objectID === seleccionado) ?? null
  const columnas = filtroSucursal === TODAS ? BRANCHES : BRANCHES.filter((b) => b.id === filtroSucursal)

  return (
    <AdminLayout
      title="Inventario"
      description="Disponibilidad de cada producto en las tres sucursales. Las sucursales sin existencias aparecen resaltadas."
    >
      {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
      {mensaje && (
        <p className={`admin-message admin-message--${mensaje.tipo}`} role="status">
          {mensaje.texto}
        </p>
      )}

      <div className="admin-cards">
        {totalesPorSucursal.map(({ branch, unidades, agotados }) => (
          <article className="admin-card" key={branch.id}>
            <p className="admin-card__value">{unidades}</p>
            <p className="admin-card__label">{branch.name}</p>
            <p className="admin-card__hint">
              {agotados === 0
                ? 'Sin productos agotados'
                : `${agotados} ${agotados === 1 ? 'producto agotado' : 'productos agotados'}`}
            </p>
          </article>
        ))}
        <article className="admin-card">
          <p className="admin-card__value">{filas.length}</p>
          <p className="admin-card__label">Productos consultados</p>
          <p className="admin-card__hint">Según la búsqueda</p>
        </article>
      </div>

      <section className="admin-panel">
        <div className="admin-filters">
          <label className="admin-field admin-field--grow">
            <span className="admin-field__label">Buscar</span>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, marca o categoría"
            />
          </label>

          <label className="admin-field">
            <span className="admin-field__label">Sucursal</span>
            <select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)}>
              <option value={TODAS}>Todas</option>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-field__label">Mostrar</span>
            <select
              value={soloAgotados ? 'agotados' : 'todos'}
              onChange={(e) => setSoloAgotados(e.target.value === 'agotados')}
            >
              <option value="todos">Todos los productos</option>
              <option value="agotados">Solo los agotados</option>
            </select>
          </label>
        </div>

        <p className="admin-panel__hint">
          {loading ? 'Consultando el inventario...' : `${visibles.length} productos`}
        </p>

        {!loading && visibles.length === 0 ? (
          <p className="admin-empty">No hay productos que coincidan con los filtros.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  {columnas.map((b) => (
                    <th key={b.id} scope="col" className="admin-table__num">{b.name}</th>
                  ))}
                  <th scope="col" className="admin-table__num">Total</th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map(({ producto: p, porSucursal }) => {
                  const mostradas = porSucursal.filter((s) =>
                    columnas.some((c) => c.id === s.branch.id)
                  )
                  const sinStock = mostradas.some((s) => s.stock === 0)
                  const total = porSucursal.reduce((suma, s) => suma + s.stock, 0)
                  return (
                    <tr key={p.objectID} className={sinStock ? 'is-empty-stock' : undefined}>
                      <td className="admin-table__main">
                        {p.title}
                        <span className="admin-table__sub">{p.objectID} · {p.category_facet}</span>
                      </td>
                      {mostradas.map((s) => (
                        <td key={s.branch.id} className="admin-table__num">
                          {s.stock === 0 ? (
                            <span className="admin-tag admin-tag--danger">Agotado</span>
                          ) : (
                            s.stock
                          )}
                          {s.modificado && <span className="admin-table__sub">modificado</span>}
                        </td>
                      ))}
                      <td className="admin-table__num">{total}</td>
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
            Poner una sucursal en cero permite comprobar que el checkout impide comprar ahí y
            explica el motivo. El cambio se guarda en este navegador, no en Algolia.
          </p>
          <EditorStock product={producto} onResultado={setMensaje} />
        </section>
      )}
    </AdminLayout>
  )
}

export default AdminInventario
