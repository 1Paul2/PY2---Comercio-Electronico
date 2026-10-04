# Maquinaria CR

Catálogo y carrito de compras de maquinaria pesada y repuestos. Proyecto del curso IC-8063 Comercio Electrónico (TEC).

Construido con React 19, Vite, React Router y Algolia (búsqueda instantánea).

## Ejecutar localmente

```bash
cd mi-proyecto
npm install
npm run dev
```

Otros comandos: `npm run lint`, `npm run build` y `npm run deploy` (publica en GitHub Pages).

## Carrito de compras

### Estado global

El carrito usa **Context API + `useReducer`** (`src/context/CartContext.jsx`). Cualquier componente accede al carrito con el hook `useCart()` (`src/context/useCart.js`), sin pasar props entre componentes.

Cada línea del carrito guarda: `id`, `name`, `price`, `image`, `quantity`, `maxStock` y `weight_kg`. El subtotal de cada línea se calcula como `price × quantity`.

### Estimación del envío (punto 2.7)

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

**Comportamiento al disminuir desde 1 unidad (punto 2.4):** la cantidad nunca baja de 1. Si el producto tiene 1 unidad y se presiona **−**, el producto **no** se elimina automáticamente ni queda en 0: se abre una confirmación *"¿Eliminar producto?"*. El producto solo se elimina si el usuario confirma; si cancela, queda con 1 unidad. El botón **Eliminar** usa la misma confirmación.

### Persistencia

El carrito se guarda en `localStorage` (clave `maquinaria-cr-cart`) cada vez que cambia, y se recupera al recargar la página. Solo se guardan los productos y sus cantidades; los montos se recalculan siempre a partir de ellos. Si el dato guardado está corrupto o incompleto, los items inválidos se descartan y la aplicación sigue funcionando.
