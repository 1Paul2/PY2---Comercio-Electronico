# Maquinaria CR

Catálogo, carrito y proceso de compra de maquinaria pesada y repuestos. Proyecto del curso **IC-8063 Comercio Electrónico** (TEC).

Construido con React 19, Vite, React Router (HashRouter) y Algolia para la búsqueda instantánea.

| Recurso | Enlace |
|---|---|
| Repositorio | https://github.com/1Paul2/PY2---Comercio-Electronico |
| Aplicación desplegada | https://1paul2.github.io/PY2---Comercio-Electronico/ |
| Índices de Algolia | `grupo-07_products` (330 productos), `grupo-07_users` (6 usuarios), `grupo-07_orders` (órdenes) |

---

## Proyecto III: entorno B2B, roles, precios e inventario

Esta sección documenta lo que pide el enunciado del Proyecto III. La tienda
sigue haciendo todo lo de los proyectos anteriores (catálogo, búsqueda,
carrito, checkout con pago Sandbox, historial y personalización) y agrega una
capa empresarial: usuarios con rol, precios y condiciones B2B, inventario por
sucursal, órdenes consultables y un panel administrativo.

### Arquitectura

| Pieza | Responsabilidad |
|---|---|
| **Algolia `grupo-07_products`** | Catálogo. Cada producto trae `pricing.b2c` (precio público), `pricing.b2b` (precio mayorista, pedido mínimo y descuentos por volumen) y `locations` (existencias por sucursal). Se consulta con la llave de solo búsqueda. |
| **Algolia `grupo-07_users`** | Usuarios iniciales y su rol. Es la fuente del inicio de sesión simulado: solo entra quien está en este índice y tiene un rol válido. Se carga con `npm run seed-users`. |
| **Algolia `grupo-07_orders`** | Índice especializado de órdenes. Lo leen "Mis órdenes" y el panel (filtrado por `customer.userId` o por `orderNumber`). Se carga con `npm run seed-orders` (órdenes de ejemplo) y `npm run upload-orders` (órdenes generadas en la tienda). |
| **localStorage** | Persistencia local del navegador: sesión activa (`ecom_session`), carrito, órdenes generadas en el checkout (`maquinaria-cr-orders-v1`), sucursal elegida, cambios administrativos simulados (`maquinaria-cr-admin-changes-v1`), eventos e historial. |

**Por qué la app no escribe en Algolia.** Escribir en un índice exige la llave
de administración. Si la app la usara, quedaría dentro del paquete que
descarga cualquier visitante y cualquiera podría borrar o alterar los índices.
Por eso el navegador solo **lee** Algolia (llave de solo búsqueda) y las
escrituras se hacen con scripts de Node que leen la llave de `mi-proyecto/.env`
(no versionado):

1. Cada compra genera la orden y la guarda en `localStorage`.
2. "Mis órdenes" y el panel juntan esas órdenes con las del índice
   `grupo-07_orders`; si un número de orden está en ambos, gana la copia local
   (es la más reciente).
3. Para llevar las órdenes nuevas al índice, el administrador pulsa
   **Exportar órdenes de este navegador** en *Panel → Órdenes* y ejecuta
   `npm run upload-orders -- ordenes-AAAA-MM-DD.json`. El script valida cada
   orden, usa el número de orden como `objectID` (subirla dos veces la
   actualiza, no la duplica) y no borra las demás órdenes del índice.

Si Algolia no responde, las pantallas lo avisan y muestran al menos las
órdenes guardadas en el navegador.

### Usuarios y roles

**Usuarios disponibles** (índice `grupo-07_users`, archivo `mi-proyecto/data/users/users.json`):

| Usuario | Correo | Rol | Empresa |
|---|---|---|---|
| Ana Mora Solís | ana.mora@correo.cr | B2C | — |
| José Pablo Quesada | jp.quesada@correo.cr | B2C | — |
| Carlos Vargas Rojas | compras@constructoratica.cr | B2B | Constructora Tica S.A. (3-101-456789) |
| Daniela Chaves Ureña | proveeduria@agrovalle.cr | B2B | Agroindustrial del Valle S.A. (3-101-778812) |
| Laura Jiménez Castro | admin@maquinariacr.com | ADMIN | — |
| Pedro Ruiz Arias | pedro.ruiz@correo.cr | `INVITADO` (inválido) | — |

Pedro existe a propósito para probar el caso "usuario sin rol válido": está en
el índice, pero su rol no es B2C, B2B ni ADMIN y la app no le permite entrar.

**Inicio de sesión simulado.** En `/login` se elige un usuario de la lista
(cargada desde Algolia) o se escribe su correo. No hay contraseñas ni registro
de cuentas. Al entrar se guarda la sesión en `ecom_session` con el id, nombre,
correo, rol y empresa. El encabezado muestra siempre el usuario actual, la
empresa (si es B2B), una etiqueta con el rol y el botón *Salir*. El cliente
vuelve a la página que quería abrir; el administrador va a su panel.

**Permisos (RBAC en la interfaz).** `mi-proyecto/src/features/session/roles.js`
es la única fuente de verdad: define los permisos de cada rol y la función
`hasPermission(session, permiso)`. El componente `RequireRole` protege cada
ruta con un permiso; el menú y los botones también consultan `hasPermission`.

| Funcionalidad | Visitante | B2C | B2B | ADMIN |
|---|---|---|---|---|
| Consultar catálogo y buscar | ✓ | ✓ | ✓ | ✓ |
| Agregar productos al carrito | ✓ | ✓ | ✓ | — |
| Checkout | — (pide iniciar sesión) | ✓ | ✓ | — |
| Consultar órdenes propias (`/mis-ordenes`) | — | ✓ | ✓ | — |
| Consultar todas las órdenes (`/admin/ordenes`) | — | — | — | ✓ |
| Información administrativa (`/admin/*`) | — | — | — | ✓ |
| Administración simulada | — | — | — | ✓ |

- Sin sesión, una ruta protegida lleva a `/login` y, al entrar, regresa a ella.
- Con sesión pero sin permiso, lleva a `/acceso-denegado`, que explica por qué.
- El carrito pertenece al usuario: al cerrar sesión o cambiar de usuario se
  vacía (en un equipo compartido nadie ve el carrito de otro). Si un visitante
  arma su carrito e inicia sesión, se conserva y se recalcula con su tarifa.
  El administrador no tiene carrito.

**Comportamiento de cada rol.**

- **B2C:** ve y paga el precio público, compra desde 1 unidad y usa el proceso
  de compra existente.
- **B2B:** ve y paga el precio mayorista, debe respetar el pedido mínimo de
  cada producto, recibe descuento por volumen y su empresa queda en la orden.
- **ADMIN:** ve el catálogo con precio público como referencia, no compra y
  tiene un panel con identidad visual propia (barra lateral oscura) para que
  quede claro que no está en la vista de compra.

### Precios y condiciones B2B

`mi-proyecto/src/features/pricing/pricing.js` decide el precio según el rol y
lo usan el catálogo, el detalle, el carrito, el checkout y la orden, así que el
precio mostrado y el guardado siempre coinciden.

- **Precio B2C:** `pricing.b2c.price_crc`. Lo ven el cliente B2C, el visitante
  y el administrador.
- **Precio B2B:** `pricing.b2b.price_crc`, siempre menor que el B2C en los 330
  productos. Ejemplo: *Kit de Orugas para Komatsu D85*, B2C ₡4 900 000 y B2B
  ₡4 312 000.

**Condiciones comerciales B2B elegidas.**

1. **Pedido mínimo por producto** (`pricing.b2b.min_order_quantity`): 1, 2, 3
   o 5 unidades según el producto. Justificación: una venta mayorista solo
   tiene sentido por volumen; el mínimo evita que una empresa pague el precio
   rebajado por una sola pieza.
2. **Descuento por volumen** (`pricing.b2b.volume_discounts`): tramos como
   "5% desde 4 unidades, 10% desde 10". Se aplica el tramo más alto que
   alcance la cantidad. Justificación: premia las compras grandes, que es lo
   que busca un cliente empresarial.

**Reglas de validación.**

- El detalle arranca la cantidad en el mínimo B2B y el botón "−" no deja bajar
  de ahí; la tarjeta del catálogo dice "Agregar N al carrito".
- El carrito y el checkout muestran las condiciones ("Pedido mínimo 2 · 5%
  desde 4 u.") y bloquean continuar si una línea está por debajo del mínimo.
- Si un visitante con 1 unidad inicia sesión como B2B, el carrito sube la
  cantidad al mínimo y lo avisa.
- Si el precio que corresponde al rol falta o no es un número mayor que 0, el
  producto se muestra como "Precio no disponible" y no se puede comprar (no se
  usa el otro precio como respaldo).
- `buildOrder` repite las validaciones de precio, mínimo y stock antes de
  guardar la orden.

### Multi-inventario y sucursales

Se reutilizó el inventario que el catálogo trae desde el Proyecto I:
`locations: [{ site, stock_quantity }]`. Las sucursales están en
`mi-proyecto/src/features/inventory/branches.js`:

| Sucursal | Dirección |
|---|---|
| San José | Paseo Colón, San José |
| Alajuela | Radial Francisco J. Orlich, Alajuela |
| Cartago Centro | Avenida 1, Cartago Centro |

Ejemplo real (`REP-BD-010`): San José 12, Alajuela 3, Cartago Centro 5.

**Disponibilidad.** El detalle del producto muestra las existencias por
sucursal y el total. En el checkout el cliente elige la sucursal de retiro o
despacho; cada opción indica cuántos productos de la compra puede surtir
("1 de 1 producto disponible") y, al elegirla, se muestra por producto
"Disponible: N unidades · Cantidad: M".

**Validación de cantidades.**

- No se puede agregar más unidades de las que hay en total.
- Si la sucursal elegida tiene menos de lo pedido, se informa ("Pediste 4
  unidades, pero en Alajuela solo hay 3...") y no se puede pagar.
- Si la sucursal no tiene el producto, se informa ("La sucursal Alajuela no
  tiene ... disponible. Elige otra sucursal...").
- Un producto sin existencias en ninguna sucursal aparece como "Agotado" y no
  se puede agregar.
- La sucursal elegida queda en la orden y se recuerda para la próxima compra.

### Órdenes

La orden se arma en `mi-proyecto/src/features/orders/buildOrder.js`. Forma del
registro (orden real generada en las pruebas; se abrevian la imagen y los
datos de contacto):

```json
{
  "orderNumber": "MCR-20261120-V55QDDZH",
  "createdAt": "2026-11-20T16:30:15.298Z",
  "customer": {
    "userId": "u-b2b-02", "name": "Daniela Chaves Ureña",
    "email": "proveeduria@agrovalle.cr", "role": "B2B", "roleLabel": "Cliente B2B",
    "company": { "name": "Agroindustrial del Valle S.A.", "legalId": "3-101-778812", "sector": "Agroindustria", "contact": "...", "phone": "..." }
  },
  "priceType": "B2B",
  "commercialConditions": {
    "priceType": "B2B", "label": "Condiciones B2B (mayorista)",
    "rules": ["Precio mayorista B2B de cada producto.", "Pedido mínimo por producto según su ficha; validado antes de pagar.", "Ningún producto alcanzó un descuento por volumen."]
  },
  "branch": { "id": "cartago", "name": "Cartago Centro", "address": "Avenida 1, Cartago Centro" },
  "buyer": { "fullName": "...", "email": "...", "phone": "..." },
  "delivery": { "province": "...", "canton": "...", "address": "...", "extraInfo": "" },
  "items": [{
    "id": "REP-BD-010", "name": "Kit de Orugas para Komatsu D85", "image": "https://...",
    "quantity": 2, "priceType": "B2B", "listPrice": 4312000, "unitPrice": 4312000,
    "discountPct": 0, "discountAmount": 0, "lineSubtotal": 8624000,
    "minQuantity": 2, "branchStock": 5,
    "conditions": "Pedido mínimo 2 · 5% desde 4 u. · 10% desde 10 u."
  }],
  "currency": "CRC", "subtotal": 8624000, "iva": 1121120, "shippingCost": 3500, "total": 9748620,
  "paymentMethod": { "brand": "Visa", "last4": "4242" },
  "termsAcceptance": { "accepted": true, "version": "2026-10", "acceptedAt": "2026-11-20T16:30:15.298Z" },
  "orderStatus": "CONFIRMED", "paymentStatus": "APPROVED"
}
```

Además se guardan `payment` (respuesta del Sandbox), `paymentAttempts` y
`updatedAt`. En una compra con descuento, por ejemplo 4 unidades del mismo
producto, la línea queda con `listPrice` 4 312 000, `discountPct` 0.05 y
`unitPrice` 4 096 400.

Con esto la orden conserva todo lo que pide el enunciado: número, fecha,
usuario, rol, datos del cliente y de la empresa, productos, cantidades, precio
de lista y precio aplicado, sucursal, subtotal, impuestos, envío, total, estado
de la orden y estado del pago. `commercialConditions` y `priceType` dejan claro
con qué condiciones se hizo la compra. De la tarjeta solo se guardan la marca y
los últimos 4 dígitos.

**Consulta posterior.**

- El cliente ve sus órdenes en `/mis-ordenes` (también por número:
  `/mis-ordenes?orden=MCR-...`). Si el número no existe se muestra "No
  encontramos la orden ...".
- El administrador ve todas en `/admin/ordenes`.

### Administración

Disponible solo para el rol ADMIN en `/admin`:

| Sección | Qué permite |
|---|---|
| **Inicio** | Resumen del panel y historial de cambios simulados, con opción de restablecer todo. |
| **Órdenes** | Todas las órdenes (Algolia y este navegador) con número, fecha, cliente, tipo de cliente, empresa, sucursal, total, estado de la orden y del pago. Filtros por tipo de cliente, estados y texto. **Ver detalle** muestra líneas, precio de lista y aplicado, descuento, condiciones comerciales, empresa, sucursal y montos. **Exportar órdenes de este navegador** descarga el JSON para `npm run upload-orders`. |
| **Productos** | Precio B2C, precio B2B, pedido mínimo y descuentos por volumen de cada producto. |
| **Inventario** | Existencias de cada producto por sucursal, con las sucursales en cero resaltadas. |
| **Métricas** | Métricas de uso calculadas con los eventos registrados (laboratorio 5). |

**Operaciones simuladas.**

- **Modificar un precio** (B2C o B2B) en *Productos*.
- **Modificar el inventario** de una sucursal en *Inventario*.

Cada cambio guarda el valor anterior, el nuevo y la fecha en
`maquinaria-cr-admin-changes-v1`. El panel confirma qué se modificó, resalta
las filas cambiadas y permite restablecerlas. El cambio se aplica sobre los
datos de Algolia al leerlos, así que se ve en el catálogo, el detalle, el
carrito, el checkout y la orden de ese navegador, sin tocar el índice.

**Restricciones de acceso.** Un cliente que abre `/admin` (o cualquier
`/admin/*`) va a `/acceso-denegado`. El administrador no puede usar el carrito
ni el checkout.

### Manejo de errores

| Situación | Comportamiento |
|---|---|
| Usuario inválido | "No encontramos un usuario con ese correo..." y no inicia sesión. |
| Usuario sin rol válido | "Pedro Ruiz Arias no tiene un rol válido en la tienda..." y no inicia sesión; una sesión guardada con rol alterado se descarta. |
| Cliente intenta entrar al panel | Redirige a `/acceso-denegado` con la explicación. |
| Producto sin inventario | "Agotado"; no se puede agregar. |
| Cantidad superior al inventario | Se informa la cantidad disponible y no se puede pagar. |
| Sucursal sin disponibilidad | Se informa y se sugiere otra sucursal. |
| Cantidad inferior al mínimo B2B | Se informa el mínimo y no se puede continuar. |
| Precio o información comercial inválida | "Precio no disponible: este producto no se puede comprar por ahora." |
| Orden inexistente | "No encontramos la orden ...". |
| Algolia no responde | Se avisa y se muestran los datos locales disponibles; el login ofrece *Reintentar*. |

### Pruebas

Escenarios ejecutados el 20 de noviembre de 2026 sobre la rama `dev` con la
app en local, automatizados con un navegador (Edge) y revisados en pantalla.
Producto usado: `REP-BD-010`.

| # | Escenario | Pasos | Resultado |
|---|---|---|---|
| 1 | Inicio de sesión B2C | Entrar como ana.mora@correo.cr | El encabezado muestra "Ana" y la etiqueta B2C. ✓ |
| 2 | Inicio de sesión B2B | Entrar como compras@constructoratica.cr | Muestra "Carlos", "Constructora Tica S.A." y B2B. ✓ |
| 3 | Inicio de sesión Admin | Entrar como admin@maquinariacr.com | Abre `/admin`. ✓ |
| 4 | Precio B2C | Detalle de `REP-BD-010` como Ana | ₡4 900 000. ✓ |
| 5 | Precio B2B | Mismo producto como Carlos | ₡4 312 000 por unidad (tarjeta: "₡4 312 000 B2B"). ✓ |
| 6 | Condición B2B | Detalle como Carlos | La cantidad arranca en 2 y "−" está deshabilitado; con 4 unidades se aplica 5%. Un carrito con 1 unidad no deja pagar. ✓ |
| 7 | Selección de sucursal | Checkout | Tres sucursales con la disponibilidad de la compra. ✓ |
| 8 | Validación de inventario | 4 unidades con Alajuela (3 en existencia) | "solo hay 3"; no deja pagar. ✓ |
| 9 | Orden B2C | Compra de Ana en San José | Orden con rol B2C, precio ₡4 900 000, sucursal San José, pago aprobado. ✓ |
| 10 | Orden B2B | Compra de Carlos, 4 u. en San José | Orden con rol B2B, empresa, precio de lista ₡4 312 000, aplicado ₡4 096 400 (5%), sucursal San José. ✓ |
| 11 | Consulta administrativa de órdenes | Admin en `/admin/ordenes` | Aparecen las dos órdenes nuevas con todas las columnas. ✓ |
| 12 | Restricción de acceso | B2C y B2B abren `/admin`; Admin abre `/carrito` y `/checkout` | Todos llegan a `/acceso-denegado`. ✓ |

Pruebas adicionales: usuario inválido, usuario sin rol, orden inexistente,
producto agotado, sucursal sin existencias, cambio de precio por el admin
reflejado en detalle/carrito/orden (mismo total que el resumen), y ninguna
pantalla con desplazamiento horizontal a 360, 390, 820, 1024 y 1280 px para
visitante, B2C, B2B y administrador.

### Inteligencia artificial

Se usó Claude Code como asistente de programación. Cada integrante debe
agregar aquí los prompts de su parte con el mismo formato.

**1. Revisión del proyecto contra el enunciado**

- *Problema:* saber si la rama `dev` cumplía todo el enunciado antes de la entrega.
- *Prompt:* "revisa que este completo el py3" (adjuntando el PDF del enunciado).
- *Resultado:* revisión de los datos de los tres índices de Algolia y prueba
  automatizada de los 12 escenarios en el navegador: todos funcionaban. Se
  detectó que faltaba esta documentación, que `main` estaba desactualizada y
  que las órdenes nuevas no llegaban al índice de órdenes.
- *Modificaciones del estudiante:* pidió corregir todo lo que fallara desde
  `dev` en una rama nueva, con un commit por archivo y él como único autor, y
  cambiar el nombre de la rama a `fix/revision`.
- *Solución adoptada:* la descrita en el siguiente punto.

**2. Corrección de las fallas encontradas**

- *Problema:* encabezado que se salía de la pantalla en tablet, catálogo que
  no reaccionaba a una búsqueda o categoría nueva en la dirección (enlaces del
  pie de página, botón atrás), órdenes nuevas fuera del índice
  `grupo-07_orders`, poca información de cada orden en el panel y
  documentación faltante.
- *Prompt:* "arregla todo lo que puedas de acuerdo con el documento desde el
  dev ... y mejora lo que puedas ... lo vas probando".
- *Resultado:* encabezado que pasa a dos filas hasta 1279 px (probado con los
  cinco usuarios), catálogo que se actualiza al cambiar `?q` o `?categoria`,
  exportación de órdenes y script `upload-orders`, detalle de
  la orden en el panel, alineación de números en las tablas del panel y esta
  sección del README.
- *Modificaciones del estudiante:* revisión de los cambios antes de los commits.
- *Solución adoptada:* escribir en Algolia solo con un script local, nunca
  desde el navegador, para no exponer la llave de administración.

---

## Historial de navegación por usuario

La aplicación conserva los productos vistos y las búsquedas recientes de cada
usuario para recuperar su actividad al volver a ingresar.

El historial se guarda en `localStorage` con la clave `ecom_history_<userId>`.
El identificador proviene de `ecom_session` y es estable para el mismo correo.
Sin sesión iniciada no se guarda historial. Cerrar sesión conserva los datos;
otra cuenta utiliza una clave independiente. No se importa el historial global
anterior porque no se puede identificar a su propietario.

`mi-proyecto/src/features/history/history.js` expone `getHistory(userId?)`,
`rememberProduct(product)` y `rememberSearch(query)`. La lectura sin argumento
usa el usuario activo. Cada lista admite 10 entradas, con la más reciente
primero. Volver a consultar un producto lo mueve al inicio; las búsquedas se
comparan sin distinguir mayúsculas y normalizando espacios. Los fallos de
almacenamiento no interrumpen la tienda.

Ejemplo de estructura (ilustrativo; no se inserta como dato de prueba):

```json
{
  "products": [{
    "objectID": "producto-123",
    "title": "Excavadora",
    "image_url": "/imagen.jpg",
    "brand": "Marca",
    "category_facet": "Excavadoras",
    "price_crc": 6200000,
    "viewedAt": "2026-11-07T18:00:00.000Z"
  }],
  "searches": [{
    "query": "excavadora",
    "searchedAt": "2026-11-07T18:01:00.000Z"
  }]
}
```

Los productos se guardan cuando su detalle carga correctamente. Las búsquedas
se guardan al enviarlas, elegir una sugerencia de producto o dejar de escribir
durante un segundo en el catálogo. El autocompletado conserva además su caché
de búsquedas enviadas, separada por usuario. Para consultar el historial completo
desde otras secciones de la aplicación se utiliza `getHistory()`.

### Comprobar el historial

1. Iniciar sesión con A, buscar y abrir varios productos.
2. En DevTools → Application → Local Storage, capturar `ecom_session` y
   `ecom_history_<userId>` con acciones reales.
3. Repetir una consulta y una visita: deben moverse al inicio sin duplicarse.
4. Superar 10 entradas por lista: deben conservarse las últimas 10.
5. Recargar y comprobar persistencia. Entrar con B y comprobar historial
   independiente; regresar a A y comprobar que recupera sus datos.

## Personalización

Con el historial de cada usuario la tienda muestra contenido hecho para esa
persona. Todo se calcula con datos reales de su actividad (`getHistory()`):
no hay productos fijos de relleno, y si un bloque no tiene datos no se muestra.

| Elemento | Dónde | Datos que usa | Interacción |
|---|---|---|---|
| **Seguí donde lo dejaste** | Inicio | Productos vistos, del más reciente al más antiguo | ✕ en cada tarjeta para quitarlo; "Borrar historial" con confirmación |
| **Inspirado en tu historial** | Inicio | Categorías más vistas y última búsqueda | Pestañas *Para ti*, una por categoría y una por la última búsqueda |
| **Tus búsquedas recientes** | Inicio y catálogo (con el buscador vacío) | Búsquedas recientes | Tocar repite la búsqueda; ✕ la quita |
| **Vistos recientemente** | Detalle de producto (sin el producto actual) y carrito vacío | Productos vistos | ✕ en cada tarjeta |
| **Completa tu compra** | Carrito | Categorías de los productos del carrito | Agregar desde la tarjeta |

Sin sesión, el inicio muestra una invitación a iniciarla, porque el historial
solo se guarda para usuarios identificados.

### Estrategia de recomendación

Las reglas están en `mi-proyecto/src/features/personalization/recommendations.js`
como funciones puras:

1. Cada producto visto suma puntos a su categoría. Los recientes pesan más:
   el último visto vale 10 puntos y el más antiguo 1 (`rankCategories`).
2. Las 3 categorías con más puntos son los intereses del usuario. *Para ti*
   las combina y cada una tiene su pestaña.
3. La última búsqueda agrega una pestaña que busca ese texto en Algolia. Si el
   usuario solo ha buscado, es la única recomendación.
4. Nunca se recomiendan productos que el usuario ya vio, ni en el carrito los
   que ya están en él.
5. Cada bloque explica por qué aparece: *"Porque viste Excavadoras y Grúas"*,
   *"Según tu búsqueda «caterpillar»"*, *"Porque tienes Excavadoras en tu carrito"*.

El historial guarda una copia mínima de cada producto. Para mostrar la tarjeta
con precio y stock actualizados, los productos se vuelven a pedir a Algolia
por su `objectID` (`productQueries.js`). Los bloques se actualizan sin recargar:
`history.js` emite el evento `ecom-history-updated` en cada cambio.

### Comprobar la personalización

1. Sin sesión, el inicio muestra la invitación. Iniciar sesión.
2. Buscar dos términos y abrir productos de dos categorías distintas.
3. Volver al inicio: aparecen las búsquedas, los productos vistos y las
   recomendaciones con su motivo. Cambiar de pestaña y quitar un producto.
4. Agregar un producto al carrito: aparece *Completa tu compra*.
5. Entrar con otro correo: no hay datos de la cuenta anterior.

### Recursos del proyecto

| Recurso | Enlace |
|---|---|
| Repositorio | https://github.com/1Paul2/PY2---Comercio-Electronico |
| Aplicación desplegada | https://1paul2.github.io/PY2---Comercio-Electronico/ |
| Índice de Algolia | `grupo-07_products` (330 productos) |

---

## Ejecutar localmente

```bash
cd mi-proyecto
npm install
npm run dev
```

La búsqueda necesita credenciales de Algolia en `mi-proyecto/.env` (no versionado):

```bash
VITE_ALGOLIA_APP_ID=...
VITE_ALGOLIA_SEARCH_KEY=...     # search-only, pública por diseño

ALGOLIA_APP_ID=...              # solo para el seed, en local
ALGOLIA_ADMIN_KEY=...           # NUNCA en el repo ni en el bundle
```

Otros comandos: `npm run lint`, `npm run build`, `npm run preview`, `npm run deploy` (publica en GitHub Pages) y `npm run seed-algolia` (indexa `data/` en Algolia).

Índices del Proyecto III (usan `ALGOLIA_ADMIN_KEY`, solo en local):

| Comando | Qué hace |
|---|---|
| `npm run seed-users` | Carga `data/users/users.json` en `grupo-07_users`. |
| `npm run seed-orders` | Reemplaza el contenido de `grupo-07_orders` con las órdenes de ejemplo. |
| `npm run upload-orders -- <archivo.json>` | Agrega o actualiza en `grupo-07_orders` las órdenes exportadas desde *Panel → Órdenes*, sin borrar las demás. Con `--dry` solo valida. |

---

## Rutas

| Ruta | Pantalla |
|---|---|
| `/` | Inicio, con categorías destacadas |
| `/productos` | Catálogo con búsqueda, facetas y paginación |
| `/producto/:id` | Detalle del producto |
| `/carrito` | Carrito de compras |
| `/checkout` | Proceso de compra |
| `/confirmacion` | Resultado de la transacción |
| `/login` | Inicio de sesión simulado |
| `/mis-ordenes` | Órdenes del cliente (B2C y B2B) |
| `/admin` | Panel administrativo: inicio |
| `/admin/ordenes` | Todas las órdenes, con detalle y exportación |
| `/admin/productos` | Precios y condiciones B2B; modificación simulada de precios |
| `/admin/inventario` | Existencias por sucursal; modificación simulada de inventario |
| `/admin/metricas` | Métricas de uso |
| `/acceso-denegado` | Aviso cuando el rol no puede entrar a una sección |
| `*` | Página 404 |

---

## Cómo probar los tres escenarios de pago

> Esto es lo primero que conviene mirar al evaluar el Proyecto II.

El servicio de pagos es un **Sandbox simulado**: no hay pasarela real ni se usan datos financieros reales. Hay dos formas de provocar cada resultado:

**1. Panel "Simulador Sandbox"** — flotante y contraído por defecto, con tres botones: *Pago aprobado*, *Pago rechazado* y *Error del servicio*. Funciona **también en el sitio publicado**, sin herramientas de desarrollo.

> Aparece en **/checkout y /confirmacion, y solo con productos en el carrito**. Es consecuencia de la validación del punto 1: con el carrito vacío el checkout no monta el formulario. Para verlo: agregar un producto desde el catálogo y entrar al checkout.

**2. Parámetro en la URL:**

```
#/checkout?scenario=APPROVED     → pago aprobado
#/checkout?scenario=DECLINED     → pago rechazado
#/checkout?scenario=ERROR        → el servicio no responde
```

La prioridad es: parámetro de la URL → último escenario elegido en el panel (`sessionStorage`) → `APPROVED` por defecto.

| Escenario | Qué hace la aplicación |
|---|---|
| **Aprobado** | Registra el pago, confirma la orden, vacía el carrito y muestra la confirmación con número de orden y resumen |
| **Rechazado** | Informa el motivo, **no** confirma la orden, conserva el carrito y ofrece reintentar |
| **Error** | Informa el problema, **no** presenta la compra como completada, conserva el carrito y ofrece reintentar |

---

## Carrito de compras

### Estado global

El carrito usa **Context API + `useReducer`** (`src/context/CartContext.jsx`). Cualquier componente accede al carrito con el hook `useCart()` (`src/context/useCart.js`), sin pasar props entre componentes.

Cada línea del carrito guarda: `id`, `name`, `price`, `image`, `quantity`, `maxStock` y `weight_kg`. El subtotal de cada línea se calcula como `price × quantity`.

### Estimación del envío

El envío se estima con `max(₡3.500, peso total × ₡30/kg)` cuando el carrito tiene productos; un carrito vacío tiene ₡0 de envío. El peso total suma `weight_kg × quantity` por cada línea y se redondea hacia arriba al colón entero.

Los parámetros de esta regla son:

- Tarifa: ₡30 por kg.
- Peso predeterminado: 5 kg por unidad cuando el producto no incluye `facets.weight_kg`.
- Mínimo: ₡3.500 por pedido.

Es una estimación para el proyecto, no una cotización de transportista: el catálogo incluye maquinaria pesada, algunos repuestos no tienen peso registrado y no se solicita destino para calcular rutas. El mínimo evita que pedidos pequeños tengan un costo logístico insignificante. No se aplica envío gratis por monto, porque el umbral tendría que superar precios de maquinaria mayores a ₡75 millones y no sería una regla útil para esa categoría. Los costos reales se deben confirmar según destino y logística disponible.

### Agregar productos

- Se puede agregar desde el **catálogo** (botón en cada tarjeta) y desde el **detalle del producto** (con la cantidad elegida).
- Si el producto no está en el carrito, se agrega con cantidad 1 (o la cantidad elegida en el detalle).
- Si el producto ya está en el carrito, **se suma la cantidad a la línea existente**; nunca se crea una línea duplicada.
- La cantidad no puede superar el stock disponible (suma del stock de todas las sedes). Si se llega al tope, se muestra un aviso y el botón del catálogo indica "Máximo en carrito".
- Retroalimentación visual al agregar: el botón muestra "✓ Agregado", el contador del header hace una animación y se abre el mini carrito lateral con el resumen.

### Modificar cantidades

Desde la página del carrito (`/carrito`), cada producto tiene los controles **+**, **−** y **Eliminar**.

**Comportamiento al disminuir desde 1 unidad:** la cantidad nunca baja de 1. Si el producto tiene 1 unidad y se presiona **−**, el producto **no** se elimina automáticamente ni queda en 0: se abre una confirmación *"¿Eliminar producto?"*. El producto solo se elimina si el usuario confirma; si cancela, queda con 1 unidad. El botón **Eliminar** usa la misma confirmación.

### Persistencia

El carrito se guarda en `localStorage` (clave `maquinaria-cr-cart`) cada vez que cambia, y se recupera al recargar la página. Solo se guardan los productos y sus cantidades; los montos se recalculan siempre a partir de ellos. Si el dato guardado está corrupto o incompleto, los items inválidos se descartan y la aplicación sigue funcionando.

---

## Checkout

Se inicia desde el carrito y **valida que haya al menos un producto**. Entrar directo a `/checkout` con el carrito vacío no muestra el formulario, sino una explicación y un enlace al catálogo.

Es **una sola página en tres secciones numeradas**, con indicador de etapa permanente (`Carrito → Checkout → Confirmación`). Se eligió así porque en compras de monto alto el usuario revisa y corrige varias veces, y una página única le deja volver sobre cualquier campo sin navegar hacia atrás.

| Sección | Campos |
|---|---|
| 1. Información del comprador | `firstName`, `lastName`, `email`, `phone` |
| 2. Información de entrega | `province`, `canton`, `address`, `extraInfo` |
| 3. Revisión final | Resumen completo y botón "Confirmar compra" |

### Validaciones

En `src/features/checkout/validation.js`, una función por campo:

| Campo | Regla |
|---|---|
| Nombre / Apellido | Obligatorio, mínimo 2 caracteres, solo letras, espacios, tildes, `'`, `.`, `-` |
| Correo | Obligatorio, formato válido |
| Teléfono | 8 dígitos, o 11 con el código `506`; debe empezar con 2, 4, 5, 6, 7 u 8 |
| Provincia | Obligatoria, de la lista oficial |
| Cantón | Obligatorio y **debe pertenecer a la provincia elegida** |
| Dirección | Obligatoria, entre 10 y 250 caracteres |
| Información adicional | Opcional, máximo 300 caracteres |

El usuario no puede avanzar con errores: el botón no navega y se marcan todos los campos inválidos a la vez.

### Borrador del formulario

`useCheckoutPersistence` guarda lo que se va escribiendo en **`sessionStorage`**, no en `localStorage`. La distinción es intencional: el carrito debe sobrevivir al cierre del navegador, pero los datos personales del comprador **no** deben quedar guardados en el equipo. Si el usuario recarga por accidente no pierde lo escrito; si cierra el navegador, sus datos se van.

---

## La orden

`src/features/orders/` construye y gestiona la orden.

**Número de orden:** `MCR-AAAAMMDD-XXXXXXXX` — por ejemplo `MCR-20261017-AMP8CMCG`. El prefijo identifica la tienda, la fecha ubica la orden en el tiempo y el sufijo aleatorio evita colisiones.

`buildOrder()` arma la orden con el número, la fecha, los datos del comprador y de entrega, los productos con cantidades y precios, subtotal, IVA, envío, total, moneda, la aceptación de los términos y condiciones (`termsAcceptance` con la versión aceptada y la fecha) y **ambos estados en `PENDING`**. Lanza un error si faltan datos, no se aceptaron los términos o los montos no cuadran: antes que construir una orden corrupta y mandarla a cobrar, falla de forma visible.

La orden se guarda en `localStorage` (`orderStorage.js`) para que la confirmación sobreviva a una recarga y el reintento no obligue a llenar el formulario otra vez.

### Estados

Se manejan **por separado** el estado de la orden y el del pago, porque describen cosas distintas (`orderStatus.js`):

| Estado de la orden | Significado |
|---|---|
| `PENDING` | La orden está registrada y espera un pago aprobado |
| `CONFIRMED` | El pago fue aprobado y la compra quedó confirmada |
| `FAILED` | El último intento de pago fue rechazado |

| Estado del pago | Significado |
|---|---|
| `PENDING` | Todavía no se ha procesado |
| `APPROVED` | El servicio aprobó el cobro |
| `DECLINED` | El emisor no autorizó el cobro |
| `ERROR` | El servicio no respondió correctamente; no se realizó el cobro |

`applyPaymentResult.js` es el único lugar donde la orden cambia de estado:

| Resultado | Orden | Pago | Efecto |
|---|---|---|---|
| `PAYMENT_APPROVED` | → `CONFIRMED` | `APPROVED` | Guarda el `transactionId` y **vacía el carrito** |
| `PAYMENT_DECLINED` | → `FAILED` | `DECLINED` | Conserva el carrito, permite reintentar |
| `PAYMENT_ERROR` | **sigue `PENDING`** | `ERROR` | Conserva el carrito, permite reintentar |

La última fila es deliberada: un error del servicio no dice nada sobre la orden. Marcarla como fallida afirmaría algo que no sabemos. Es la diferencia entre *"te lo negaron"* y *"no pudimos preguntar"*.

---

## Servicio de pago Sandbox

`src/features/payment/` separa el "proveedor externo" de nuestro lado de la frontera. Si mañana se usara una pasarela real, solo cambiaría `paymentSandbox.js`.

**Lo que se envía** (`buildPaymentRequest`):

```js
{ orderId: "MCR-20261017-AMP8CMCG", amount: 9314700, currency: "CRC", scenario: "APPROVED" }
```

La solicitud lleva **solo lo necesario para cobrar**: no se envían nombre, correo, teléfono ni dirección. Un proveedor de pagos no tiene por qué recibir los datos personales del comprador.

**Lo que se recibe:**

```js
{
  result: "PAYMENT_APPROVED",        // APPROVED | DECLINED | ERROR
  orderId, amount, currency,
  transactionId: "SBX-5F1Z95S7TM",   // null cuando hay error
  reasonCode: null,                  // motivo cuando no se aprueba
  processedAt: "2026-10-17T21:55:13.902Z",
  message: "Pago aprobado."
}
```

El contrato se valida **en ambas direcciones** (`paymentContract.js`):

- `validatePaymentRequest()` revisa la solicitud antes de enviarla.
- `isValidPaymentResponse()` revisa la respuesta y que **corresponda a la solicitud**: mismo `orderId`, mismo monto, misma moneda.
- `normalizePaymentResponse()` convierte en `PAYMENT_ERROR` cualquier respuesta que no cumpla el contrato.

Regla de fondo: **ante la duda, nunca se aprueba.**

El escenario `ERROR` **lanza una excepción** en vez de devolver una respuesta, porque eso es lo que realmente ocurre cuando un servicio se cae. `paymentClient.js` la captura y la convierte en una respuesta `PAYMENT_ERROR` válida, de modo que el resto de la aplicación siempre trabaja con datos bien formados.

El Sandbox simula latencia de red de 800–1500 ms, para que el estado de carga sea observable.

---

## Manejo de errores

| Caso | Qué hace la aplicación |
|---|---|
| Error de validación | Mensaje específico bajo cada campo; el botón no avanza |
| Carrito vacío | *"No hay productos para comprar…"* con enlace al catálogo |
| Pago rechazado | Explica el motivo y el siguiente paso; conserva el carrito; permite reintentar |
| Error del servicio | *"No se realizó ningún cobro"*; conserva el carrito; permite reintentar |
| Error inesperado | `ErrorBoundary` muestra *"¡Ups! Algo salió mal"* con opción de reintentar |

`paymentMessages.js` traduce cada código técnico (`DECLINED_BY_ISSUER`, `SERVICE_UNAVAILABLE`, `INVALID_REQUEST`, `INVALID_RESPONSE`) a dos frases: qué pasó y qué puede hacer el usuario. **El código técnico nunca aparece en pantalla.**

Los mensajes de error dicen explícitamente *"No se realizó ningún cobro"*: ante un fallo de pago, lo primero que el usuario necesita saber es si le cobraron.

Además: el botón de confirmar desaparece mientras el pago se procesa (evita el doble cobro), y `useWarnBeforeLeave` advierte si se intenta cerrar la pestaña durante el cobro.

---

## Estructura del proyecto

```
mi-proyecto/
├── data/                    24 archivos JSON, uno por categoría
├── scripts/seed-algolia.mjs indexación en Algolia
└── src/
    ├── pages/               una por ruta; delgadas, solo componen
    ├── features/
    │   ├── catalog/         búsqueda, filtros, tarjeta, detalle
    │   ├── checkout/        validaciones, provincias/cantones, borrador
    │   ├── orders/          número, construcción, estados, persistencia
    │   ├── payment/         contrato, sandbox, cliente, mensajes
    │   ├── session/         sesión simulada del usuario
    │   ├── activity/        registro de eventos (ecom_events)
    │   ├── history/         historial por usuario
    │   └── personalization/ recomendaciones y bloques personalizados
    ├── components/          piezas transversales (header, footer, toasts)
    ├── context/             carrito y tema
    └── styles/              un .css por componente + tokens en global.css
```

Se agrupa **por dominio, no por tipo de archivo**: todo lo que sabe qué es un producto vive en `features/catalog/`; todo lo que sabe qué es un pago, en `features/payment/`. Los datos están partidos en 24 archivos JSON por categoría para que varias personas puedan agregar productos sin conflictos de merge; el script de indexación los concatena antes de subirlos.

---

## Flujo de trabajo con Git

```
main  ←  dev  ←  feature/*
```

El trabajo se hace en ramas de feature y entra a `dev` por **Pull Request**. `main` se actualiza desde `dev` cuando una entrega está lista y verificada.

```bash
git checkout dev && git pull
git checkout -b feature/mi-cambio
# ... trabajar, commitear ...
git push -u origin feature/mi-cambio
# abrir PR hacia dev en GitHub
```

Antes de desplegar, verificar que `npm run lint` y `npm run build` pasen limpios. El `base` de Vite en `vite.config.js` debe coincidir con el nombre del repositorio, o el sitio publicado carga en blanco.
