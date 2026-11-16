/**
 * Nombre: roles
 * Descripción: Roles de la tienda y permisos de cada uno (control de acceso
 *              basado en roles a nivel de la interfaz). Es la única fuente de
 *              verdad: las rutas protegidas, el menú y los botones preguntan
 *              aquí si el usuario actual puede hacer algo.
 *
 * Quien no ha iniciado sesión se trata como "visitante": puede ver el
 * catálogo, buscar y armar su carrito, pero debe iniciar sesión para pagar.
 */

export const ROLES = {
  B2C: 'B2C',
  B2B: 'B2B',
  ADMIN: 'ADMIN',
}

/** Textos para mostrar cada rol en pantalla. */
export const ROLE_INFO = {
  B2C: {
    label: 'Cliente B2C',
    badge: 'B2C',
    description: 'Cliente particular. Compra con los precios al público.',
  },
  B2B: {
    label: 'Cliente B2B',
    badge: 'B2B',
    description: 'Empresa. Compra con precios mayoristas y condiciones comerciales propias.',
  },
  ADMIN: {
    label: 'Administrador',
    badge: 'Admin',
    description: 'Consulta órdenes, productos e inventario. No realiza compras.',
  },
}

export const PERMISSIONS = {
  VIEW_CATALOG: 'view_catalog',
  SEARCH: 'search',
  USE_CART: 'use_cart',
  CHECKOUT: 'checkout',
  VIEW_OWN_ORDERS: 'view_own_orders',
  VIEW_ALL_ORDERS: 'view_all_orders',
  VIEW_ADMIN_INFO: 'view_admin_info',
  ADMIN_ACTIONS: 'admin_actions',
}

const GUEST_PERMISSIONS = [PERMISSIONS.VIEW_CATALOG, PERMISSIONS.SEARCH, PERMISSIONS.USE_CART]

const CUSTOMER_PERMISSIONS = [
  PERMISSIONS.VIEW_CATALOG,
  PERMISSIONS.SEARCH,
  PERMISSIONS.USE_CART,
  PERMISSIONS.CHECKOUT,
  PERMISSIONS.VIEW_OWN_ORDERS,
]

const ROLE_PERMISSIONS = {
  [ROLES.B2C]: CUSTOMER_PERMISSIONS,
  [ROLES.B2B]: CUSTOMER_PERMISSIONS,
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_CATALOG,
    PERMISSIONS.SEARCH,
    PERMISSIONS.VIEW_ALL_ORDERS,
    PERMISSIONS.VIEW_ADMIN_INFO,
    PERMISSIONS.ADMIN_ACTIONS,
  ],
}

/**
 * Nombre: isValidRole
 * Descripción: Indica si un valor es uno de los roles de la tienda.
 */
export function isValidRole(role) {
  return Object.values(ROLES).includes(role)
}

/**
 * Nombre: hasPermission
 * Descripción: Indica si el usuario actual puede usar una funcionalidad.
 * Entradas: session: sesión activa o null (visitante); permission: uno de
 *           PERMISSIONS.
 * Salidas: boolean.
 * Excepciones: No lanza; un rol desconocido no tiene ningún permiso.
 */
export function hasPermission(session, permission) {
  if (!session) return GUEST_PERMISSIONS.includes(permission)
  return (ROLE_PERMISSIONS[session.role] ?? []).includes(permission)
}
