# VIDEO 2 — Demo de Funcionalidades
**Duración estimada:** 6:00 – 7:30 min  
**Tono:** Demo en vivo, pantalla compartida  
**Pantalla:** App corriendo en localhost:5173 + Swagger en localhost:8000/docs

---

## [00:00 – 00:20] INTRO

> *Pantalla: Terminal ejecutando `docker compose up --build`*

**Narrador:**
"Vamos a ver StockSync en funcionamiento. El sistema se levanta completo con un solo comando: docker compose up. Esto inicializa el backend con FastAPI en el puerto 8000, el frontend con React en el 5173, y aplica automáticamente las migraciones de base de datos con Alembic."

---

## [00:20 – 01:00] LOGIN Y AUTENTICACIÓN (REQ-F05)

> *Pantalla: LoginPage — formulario de login*

**Narrador:**
"La primera pantalla es el login. El sistema usa JWT: al autenticarse, el backend genera un token con tiempo de expiración configurable —por defecto 480 minutos. Ese token se almacena en localStorage y el cliente Axios lo inyecta automáticamente en el header Authorization de cada request posterior."

> *Acción: Ingresar con email y password de admin*

"Ingresamos como administrador. Si el rol del usuario es operator, algunas acciones van a estar bloqueadas en la interfaz y el backend las rechaza con HTTP 403."

---

## [01:00 – 01:50] DASHBOARD

> *Pantalla: DashboardPage*

**Narrador:**
"El dashboard muestra los indicadores principales: productos activos, estado del inventario, proveedores registrados y órdenes de compra pendientes. Desde acá también se accede rápidamente a las alertas de stock bajo."

> *Señalar sección de alertas*

"Si alguna variante tiene stock igual o menor al punto de reorden configurado, aparece acá. El endpoint que alimenta esta sección es GET /stock/alerts/low-stock, que hace una consulta SQL sumando los movimientos de Kardex y comparando con el campo reorder_point de cada variante."

---

## [01:50 – 03:20] PRODUCTOS Y VARIANTES (REQ-F01)

> *Pantalla: ProductsPage*

**Narrador:**
"Pasamos al módulo de productos. La lista muestra los productos con sus variantes expandidas, el SKU de cada una, precio de venta y stock actual."

> *Acción: Crear nuevo producto "Campera Cuero", SKU base "CAM-CUE"*

"Creamos un producto nuevo. El campo base_sku es el identificador padre —por ejemplo CAM-CUE para Campera de Cuero. Después, los SKUs hijos se generan combinando este base con los atributos."

> *Acción: Ir a 'Generar Variantes', seleccionar Talles [S, M, L] y Colores [Negro, Marrón]*

"La funcionalidad más importante aquí es la generación automática de variantes. Seleccionamos dos atributos: Talle con valores S, M y L, y Color con Negro y Marrón. El backend calcula el producto cartesiano —tres talles por dos colores— y genera seis variantes automáticamente."

> *Pantalla: Resultado — CAM-CUE-S-NEGRO, CAM-CUE-M-NEGRO, CAM-CUE-L-NEGRO, CAM-CUE-S-MARRON, etc.*

"Cada variante tiene su propio SKU construido concatenando el base_sku con los valores de atributo, tiene precio de venta, precio de costo, y el punto de reorden individual."

---

## [03:20 – 04:30] VENTAS Y KARDEX (REQ-F02, REQ-F03)

> *Pantalla: SalesPage*

**Narrador:**
"El módulo de ventas implementa un flujo en tres pasos. Primero se selecciona el cliente —con búsqueda en tiempo real, con debounce de 300ms para no saturar la API. Se puede crear el cliente inline si no existe."

> *Acción: Abrir modal de nueva venta, seleccionar cliente*

"Segundo paso: agregar los ítems. Elegimos una variante por SKU, cantidad y precio."

> *Acción: Agregar CAM-CUE-M-NEGRO x2 a $15.000*

"Tercer paso: confirmación. Al hacer submit, el backend ejecuta una transacción atómica. Primero bloquea las filas de las variantes con SELECT FOR UPDATE —esto evita que dos vendedores vendan el mismo stock simultáneamente. Si el stock alcanza, crea el registro de venta y por cada ítem genera un StockMovement de tipo SALE con quantity negativa."

> *Pantalla: Resultado exitoso + lista de ventas actualizada*

"Si el stock es insuficiente en cualquier ítem, el backend hace rollback completo y devuelve HTTP 409 Conflict con el detalle del error."

> *Pantalla: Swagger — GET /stock/movements/{variant_id}*

"El historial completo de movimientos de esa variante queda en el Kardex. Este es append-only: nunca se hace UPDATE ni DELETE sobre la tabla stock_movements. El stock actual siempre se calcula como la suma de todos los movimientos."

---

## [04:30 – 05:20] COMPRAS Y PROVEEDORES

> *Pantalla: StockPage o Swagger*

**Narrador:**
"El ciclo de abastecimiento funciona así: se crea una orden de compra en estado PENDING con las variantes y cantidades a reponer. La orden puede confirmarse y, cuando la mercadería llega físicamente, el administrador la recibe."

> *Pantalla: Swagger — POST /stock/purchases/{order_id}/receive*

"Al recibir la orden, el backend cambia el estado a RECEIVED y genera automáticamente los StockMovements de tipo PURCHASE para cada ítem. El stock se actualiza inmediatamente."

---

## [05:20 – 06:00] CLIENTES

> *Pantalla: ClientsPage*

**Narrador:**
"El módulo de clientes tiene búsqueda en tiempo real. Cada cliente tiene nombre, email, teléfono y dirección. Las bajas son siempre lógicas: se marca is_active en false, el registro nunca se elimina físicamente de la base de datos. Esto aplica también a productos y usuarios."

---

## [06:00 – 06:30] REPORTES Y ALERTAS

> *Pantalla: ReportsPage + endpoint low-stock*

**Narrador:**
"La sección de reportes centraliza las alertas de reorden y el historial de movimientos. Cada variante tiene configurado su punto de reorden, y el sistema corre la consulta de alertas bajo demanda. Desde acá se puede identificar qué productos necesitan reposición urgente antes de quedarse sin stock."

---

## [06:30 – 07:00] CIERRE

> *Pantalla: Swagger UI — lista de todos los endpoints*

**Narrador:**
"Toda la API está autodocumentada en Swagger UI en localhost:8000/docs. Cada endpoint muestra los schemas de request y response, los códigos de error posibles y los requerimientos de autenticación. Esto facilita tanto el testing manual como la integración con clientes externos."

---
*FIN DEL VIDEO 2*
