# Laboratorio 4: Confianza Digital y Políticas Comerciales

**Estudiantes:** Poll Garro Vargas, Tayler Wynta Rodriguez, Keyner Cerdas Morales, Angelo Piedra Castro
**Curso:** Comercio electrónico GR 60
**Proyecto:** Maquinaria CR
**Fecha de entrega:** 24 de octubre de 2026

## Justificación de las Políticas

Las políticas de Maquinaria CR se redactaron a partir del funcionamiento real de la tienda y su catálogo, para que el cliente lea en ellas lo mismo que ve al comprar. 

En **Términos y Condiciones**, se detallan los precios en colones con el desglose de IVA (13%) y envío antes de pagar, el límite de stock del carrito, el precio mayorista con descuentos por volumen, los estados de la orden y la aceptación de los términos (registrada con su versión). 

En **Devoluciones**, al vender maquinaria nueva, reacondicionada y usada, los plazos se definieron según esa condición: los productos nuevos y reacondicionados se pueden devolver en 15 días; la maquinaria usada solo se acepta si no coincide con su ficha, porque su valor depende del estado en que se entregó. Se excluyen los repuestos instalados, la maquinaria usada y los pedidos especiales. 

En **Privacidad**, se describe solo lo que pide el checkout (nombre, apellidos, correo, teléfono y dirección), con quién se comparte y qué se guarda en el navegador, aclarando que no se guardan datos de tarjeta. 

Para **Envíos**, se definió una cobertura en las 7 provincias, tiempos de 1 a 3 días hábiles y un costo de ₡30 por kg con mínimo de ₡3 500, coherente con el cálculo del carrito, con restricciones para maquinaria pesada y zonas de difícil acceso.

Finalmente, las **Preguntas Frecuentes (FAQ)** responden a las dudas más comunes sobre compras, pagos, envíos, devoluciones y atención al cliente, para reducir la incertidumbre del cliente durante el proceso de compra.

## Decisiones de Diseño

- **Plantilla común (`PolicyLayout`):** Las cinco páginas informativas (Términos, Privacidad, Devoluciones, Envíos y Preguntas Frecuentes) reutilizan esta plantilla y definen su contenido como una lista de secciones, de la que se arma automáticamente el índice lateral. Esto garantiza una identidad visual consistente en todo el sitio.

- **Sin estilos nuevos:** Las tablas y avisos usan las clases que ya existían en la hoja de estilos (`Policies.css`), sin agregar estilos nuevos por cuenta de cada tarea. Las FAQ usan el componente nativo `<details>` de HTML, estilizado con la clase `.policy-faq` existente, para lograr el formato desplegable accesible sin JavaScript extra.

- **Consistencia de términos:** La versión de los términos (`TERMS_VERSION`) se toma de la misma constante que usa el checkout, para que nunca queden desalineadas. El checkbox de aceptación bloquea la compra si no se marca, muestra un mensaje de validación y guarda la versión aceptada dentro de la orden generada.

- **Navegación integrada:** Las páginas se enlazan entre sí (en el menú lateral) para pasar de una política a otra sin volver al pie de página. Los enlaces se abren en la misma pestaña desde el footer, pero en el checkout se abren en una nueva pestaña para no perder lo escrito en el formulario.

- **Responsive:** La plantilla adapta su diseño en pantallas móviles, moviendo el índice arriba del contenido y permitiendo que las tablas se desplacen horizontalmente dentro de su contenedor para no romper la página.