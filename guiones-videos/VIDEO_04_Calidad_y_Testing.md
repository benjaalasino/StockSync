# VIDEO 4 — Calidad del Software y Testing
**Duración estimada:** 4:00 – 5:30 min  
**Tono:** Técnico-académico  
**Pantalla:** Terminal con pytest + VS Code con código de tests + métricas

---

## [00:00 – 00:20] INTRO

> *Pantalla: Logo StockSync + título "Plan SQA — IEEE 730"*

**Narrador:**
"Este video cubre el plan de aseguramiento de calidad del software de StockSync, desarrollado siguiendo el estándar IEEE 730. Vamos a ver las métricas de código, la suite de pruebas automatizadas y cómo estas garantizan el comportamiento correcto del sistema."

---

## [00:20 – 01:10] MÉTRICAS DE CÓDIGO — COMPLEJIDAD CICLOMÁTICA

> *Pantalla: Terminal — `radon cc app/ -s -a`*

**Narrador:**
"La primera métrica es la Complejidad Ciclomática, calculada con la herramienta Radon. Esta métrica indica cuántos caminos de ejecución independientes tiene una función. Menos complejidad significa código más fácil de testear y mantener."

> *Pantalla: Resultado del reporte cc_inicial.txt*

"El umbral que nos fijamos en el plan SQA es: CC máxima por función menor o igual a 10, correspondiente a grado A, B o C de Radon.

El resultado de la medición inicial: 126 bloques analizados, complejidad promedio 1.47. El método más complejo del sistema es create_sale en StockService con CC=5, que corresponde a la lógica de validación atómica de ventas. Aun así, todos los bloques están en grado A.

Esto indica que el código es directo, sin lógica de control excesivamente anidada."

---

## [01:10 – 01:50] MÉTRICAS DE CÓDIGO — ÍNDICE DE MANTENIBILIDAD

> *Pantalla: Terminal — `radon mi app/ -s`*

**Narrador:**
"La segunda métrica es el Índice de Mantenibilidad. Radon lo calcula combinando la complejidad ciclomática, las líneas de código y el volumen de Halstead. El umbral del proyecto es MI mínimo de 40 por módulo."

> *Pantalla: Resultado del reporte mi_inicial.txt*

"Todos los módulos superan el umbral. El módulo con MI más bajo es schemas/user.py con 55.21 —esto es esperable en schemas Pydantic, que tienen más declaraciones que lógica. Los módulos de servicios, que concentran la lógica de negocio más compleja, tienen MI entre 56 y 59."

---

## [01:50 – 03:00] SUITE DE PRUEBAS — CONFIGURACIÓN

> *Pantalla: backend/tests/conftest.py*

**Narrador:**
"Las pruebas automatizadas usan pytest con una base de datos SQLite en memoria. La fixture db crea todas las tablas al inicio de cada test y las elimina al final. Esto garantiza aislamiento total entre tests."

> *Pantalla: conftest.py — fixture db con SQLite*

"Usamos SQLite en lugar de PostgreSQL para los tests porque elimina la dependencia de infraestructura externa. Los tests se pueden correr en cualquier entorno sin Docker. La pragma FOREIGN_KEYS=ON activa la validación de claves foráneas, que SQLite desactiva por defecto."

> *Pantalla: Terminal — `pytest backend/tests/ -v`*

"Al correr pytest, los tests se ejecutan contra la base en memoria. Toda la suite corre en menos de dos segundos."

---

## [03:00 – 04:00] CASOS DE TEST — COBERTURA

> *Pantalla: backend/tests/test_stock_service.py*

**Narrador:**
"La suite cubre los tres módulos críticos del sistema."

**test_stock_service.py — casos relevantes:**

> *Señalar test_create_sale_insufficient_stock*

"test_create_sale_insufficient_stock: intenta vender más unidades de las disponibles y verifica que el servicio lanza HTTPException 409. Esto garantiza que REQ-F03 funciona correctamente."

> *Señalar test_create_sale_success*

"test_create_sale_success: carga stock inicial con un ajuste, registra una venta de 7 unidades, y verifica que el stock posterior sea 3. También verifica que se generó un StockMovement de tipo SALE."

> *Señalar test_receive_purchase_order_success*

"test_receive_purchase_order_success: crea una orden de compra, la recibe, y verifica que el stock de la variante aumentó en la cantidad correcta y que la orden pasó a estado RECEIVED."

> *Pantalla: backend/tests/test_product_service.py*

"test_generate_variants_success: configura dos tipos de atributos con dos valores cada uno y llama a generate_variants. Verifica que se generaron exactamente cuatro variantes —el producto cartesiano 2x2— con SKUs correctamente construidos."

---

## [04:00 – 04:40] TRAZABILIDAD DE REQUERIMIENTOS

> *Pantalla: Tabla RTM — Requirements Traceability Matrix*

**Narrador:**
"Cada caso de test está trazado a un requerimiento del plan SQA."

| Requerimiento | Test que lo cubre |
|---|---|
| REQ-F01 — Generación de variantes | test_generate_variants_success |
| REQ-F02 — Kardex inmutable | test_adjust_stock_success, test_receive_purchase_order_success |
| REQ-F03 — Validación atómica | test_create_sale_success, test_create_sale_insufficient_stock |
| REQ-F04 — Alertas de reorden | test_get_low_stock_alerts (en StockService) |
| REQ-F05 — RBAC | Dependencias require_admin en routers |

"Esta trazabilidad garantiza que si se rompe un requerimiento, hay al menos un test que lo detecta."

---

## [04:40 – 05:10] LINTER Y HERRAMIENTAS

> *Pantalla: Terminal — flake8 corriendo*

**Narrador:**
"El análisis estático del código corre con flake8 y Pylint. El linter detecta violaciones de estilo y posibles errores sin ejecutar el código. Lo configuramos para ignorar líneas mayores a 88 caracteres, compatible con el formateador black."

---

## [05:10 – 05:30] CIERRE

> *Pantalla: Resumen de métricas — tabla*

**Narrador:**
"En resumen: complejidad ciclomática promedio de 1.47 con todas las funciones en grado A, índice de mantenibilidad superior a 55 en todos los módulos, y una suite de tests que cubre los cinco requerimientos funcionales principales. El plan SQA nos permitió medir y controlar la calidad del código desde las primeras iteraciones del desarrollo."

---
*FIN DEL VIDEO 4*
