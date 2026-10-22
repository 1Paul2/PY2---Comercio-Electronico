/**
 * Nombre: policyPages
 * Descripción: Lista única de las páginas informativas de la tienda
 *              (políticas y preguntas frecuentes). La usan el footer y la
 *              plantilla de políticas para mostrar los enlaces, de modo que
 *              una ruta nueva solo se agrega aquí y en App.jsx.
 */
export const POLICY_PAGES = [
  { path: '/terminos', label: 'Términos y condiciones' },
  { path: '/privacidad', label: 'Política de privacidad' },
  { path: '/devoluciones', label: 'Política de devoluciones' },
  { path: '/envios', label: 'Política de envíos' },
  { path: '/preguntas-frecuentes', label: 'Preguntas frecuentes' },
]

/**
 * Versión vigente de los términos y condiciones. Se guarda en cada orden
 * junto con la aceptación del cliente; si los términos cambian, se sube la
 * versión para saber cuáles aceptó cada comprador.
 */
export const TERMS_VERSION = '2026-10'
