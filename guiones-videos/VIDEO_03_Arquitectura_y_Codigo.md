# VIDEO 3 — Arquitectura y Código
**Duración estimada:** 6:00 – 8:00 min  
**Tono:** Técnico, explicativo  
**Pantalla:** VS Code / editor con el código abierto

---

## [00:00 – 00:25] INTRO

> *Pantalla: Estructura de carpetas en VS Code*

**Narrador:**
"En este video vamos a recorrer el código de StockSync y explicar las decisiones de arquitectura más importantes. El proyecto sigue una separación clara en capas: modelos de datos, schemas de validación, servicios con la lógica de negocio, y routers que exponen la API."

---

## [00:25 – 01:30] MODELO DE DATOS — PRODUCTO PADRE / SKU HIJO (REQ-F01)

> *Pantalla: backend/app/models/product.py*

**Narrador:**
"La decisión de diseño central del módulo de productos es la separación entre Producto Padre y SKU Hijo.

El modelo Product representa el producto genérico —por ejemplo, Remera Básica con SKU base REM-BASE. No tiene precio ni stock directamente.

El modelo ProductVariant es el SKU concreto: REM-BASE-M-ROJO. Este sí tiene precio de venta, precio de costo y punto de reorden. La relación entre variante y sus atributos es muchos a muchos, implementada con una tabla de asociación variant_attribute_values."

> *Pantalla: Tabla de asociación variant_attribute_values en el código*

"AttributeType define el tipo de atributo —Talle, Color— y AttributeValue los valores concretos —S, M, L, Rojo, Azul. Esta estructura es genérica: el sistema no tiene talles ni colores hardcodeados."

---

## [01:30 – 02:30] GENERACIÓN DE VARIANTES — PRODUCTO CARTESIANO (REQ-F01)

> *Pantalla: backend/app/services/product_service.py — método generate_variants*

**Narrador:**
"La generación automática de variantes está en el método generate_variants del ProductService. Recibe una lista de listas de IDs de atributos, y usa itertools.product para calcular todas las combinaciones posibles."

> *Código visible: `for combo in itertools.product(*attribute_combinations):`*

"Por ejemplo, si pasamos [[1,2,3], [4,5]] —tres talles y dos colores— el producto cartesiano genera seis combinaciones. Para cada una se construye el SKU con el método _build_sku, que concatena el base_sku del producto con los valores de atributo ordenados por ID."

> *Pantalla: _build_sku method*

"Si alguna combinación ya existe en la base de datos, se skipea silenciosamente para no generar duplicados. La función tiene complejidad ciclomática 4, la más alta del módulo, y aun así entra en grado A."

---

## [02:30 – 03:30] KARDEX INMUTABLE (REQ-F02)

> *Pantalla: backend/app/models/stock.py — clase StockMovement*

**Narrador:**
"El Kardex es la pieza más crítica del sistema. La tabla stock_movements es append-only por decisión de diseño: nunca se ejecuta UPDATE ni DELETE sobre ella. Cada movimiento registra la variante, el usuario que lo generó, el tipo de movimiento, la cantidad —positiva para entradas, negativa para egresos— y el timestamp en UTC."

> *Pantalla: StockService.get_current_stock*

"El stock actual de una variante no se almacena en ningún campo. Se calcula siempre con SELECT SUM(quantity) FROM stock_movements WHERE variant_id = X. Esto garantiza trazabilidad completa: podés reconstruir el estado del stock en cualquier punto histórico."

> *Pantalla: Enum MovementType*

"Los tipos de movimiento son: PURCHASE por compras, SALE por ventas, ADJUSTMENT_IN y ADJUSTMENT_OUT para ajustes manuales, y RETURN_IN / RETURN_OUT para devoluciones."

---

## [03:30 – 04:30] VALIDACIÓN ATÓMICA DE VENTAS (REQ-F03 + REQ-NF01)

> *Pantalla: backend/app/services/stock_service.py — método create_sale*

**Narrador:**
"La creación de ventas implementa el patrón más complejo del sistema. El objetivo es garantizar que si dos requests de venta llegan simultáneamente para el mismo SKU, una de ellas falle correctamente en lugar de dejar el stock en negativo."

> *Código visible: SELECT FOR UPDATE*

"Antes de validar el stock disponible, el servicio ejecuta una consulta con FOR UPDATE. Esto coloca un lock de escritura en la fila de la variante dentro de la transacción. PostgreSQL bloquea cualquier otro intento de modificar esa variante hasta que la transacción termine."

> *Código visible: if current_stock < item.quantity → raise HTTPException(409)*

"Si el stock calculado es menor a la cantidad solicitada en cualquier ítem, se lanza una HTTPException con código 409. SQLAlchemy hace rollback automático de toda la transacción. Si el stock alcanza para todos los ítems, se crean los registros Sale, SaleItem y los StockMovements de tipo SALE en una sola transacción atómica."

---

## [04:30 – 05:15] SEGURIDAD Y RBAC (REQ-F05)

> *Pantalla: backend/app/core/security.py*

**Narrador:**
"La autenticación usa JWT con python-jose. El token contiene el user_id y el rol del usuario. El módulo security.py define dos dependencias de FastAPI: get_current_user, que decodifica el token y devuelve el usuario, y require_admin, que además verifica que el rol sea admin."

> *Pantalla: router products.py — decoradores con Depends(require_admin)*

"Los endpoints que modifican datos críticos —crear productos, ajustar stock, recibir órdenes de compra— declaran require_admin como dependencia. Si el token corresponde a un operator, FastAPI devuelve 403 Forbidden antes de ejecutar cualquier lógica de negocio."

---

## [05:15 – 06:00] FRONTEND — CLIENTE HTTP Y TIPOS

> *Pantalla: frontend/src/services/api.ts*

**Narrador:**
"El frontend centraliza toda la comunicación con la API en un único archivo: services/api.ts. Crea una instancia de Axios con la base URL del backend y un interceptor de request que inyecta automáticamente el token JWT del localStorage en el header Authorization."

> *Pantalla: frontend/src/types/index.ts*

"Los tipos TypeScript en types/index.ts están sincronizados con los schemas Pydantic del backend. Esto garantiza que si el backend cambia una respuesta, el compilador de TypeScript detecta el error en el frontend."

---

## [06:00 – 06:45] DOCKER Y MIGRACIONES

> *Pantalla: docker-compose.yml + comando de alembic en Dockerfile*

**Narrador:**
"El entorno de deployment usa Docker Compose. El backend ejecuta al arrancar: alembic upgrade head para aplicar todas las migraciones pendientes, y después levanta uvicorn con reload activado para desarrollo.

Las migraciones de Alembic versionan la evolución del esquema de base de datos. Cada cambio de modelo genera una migración con un hash único. Esto permite hacer rollback a cualquier estado anterior del esquema."

---

## [06:45 – 07:00] CIERRE

> *Pantalla: Diagrama de capas — Router → Service → Model → DB*

**Narrador:**
"La arquitectura en capas garantiza que cada componente tenga una responsabilidad única. Los routers solo manejan HTTP. Los servicios contienen toda la lógica de negocio. Los modelos definen el esquema de datos. Esta separación facilita el testing, la mantenibilidad y la extensión del sistema."

---
*FIN DEL VIDEO 3*
