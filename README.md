# Maquinaria CR

Catálogo, carrito y proceso de compra de maquinaria pesada y repuestos. Proyecto del curso **IC-8063 Comercio Electrónico** (TEC).

Construido con React 19, Vite, React Router (HashRouter) y Algolia para la búsqueda instantánea.

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

`buildOrder()` arma la orden con el número, la fecha, los datos del comprador y de entrega, los productos con cantidades y precios, subtotal, IVA, envío, total, moneda, y **ambos estados en `PENDING`**. Lanza un error si faltan datos o los montos no cuadran: antes que construir una orden corrupta y mandarla a cobrar, falla de forma visible.

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
    │   └── payment/         contrato, sandbox, cliente, mensajes
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
