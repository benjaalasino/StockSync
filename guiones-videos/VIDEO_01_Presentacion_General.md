# VIDEO 1 — Presentación General del Proyecto
**Duración estimada:** 2:30 – 3:00 min  
**Tono:** Académico-presentación, directo  
**Pantalla:** Slides / intro con logo StockSync

---

## [00:00 – 00:20] APERTURA

> *Pantalla: Logo StockSync + nombre del proyecto*

**Narrador:**
"StockSync es un sistema de gestión de inventario diseñado para comercios de indumentaria. Fue desarrollado como trabajo de campo integrador de la materia Ingeniería de Software II en el IUA, por el Grupo 5: Benjamín Alasino, Tomás Calvo, Joaquín Contreras y Martín González."

---

## [00:20 – 00:55] EL PROBLEMA

> *Pantalla: Diagrama simple — local de ropa, stock descontrolado*

**Narrador:**
"El problema que aborda StockSync es concreto: los comercios de indumentaria manejan productos con múltiples variantes —talle, color— y necesitan controlar el stock de cada combinación específica. La pregunta es: ¿cuántos remeras rojas talle M quedan? ¿Cuándo hay que reponer? ¿Quién hizo el último ajuste de inventario?

Sin un sistema, esto se maneja en planillas, con el riesgo de ventas en negativo, errores de carga y falta de trazabilidad."

---

## [00:55 – 01:35] LA SOLUCIÓN

> *Pantalla: Capturas de la app — Dashboard, Productos, Ventas*

**Narrador:**
"StockSync resuelve esto con cinco funcionalidades principales:

Primero, gestión de productos con generación automática de variantes por combinación de atributos —el sistema genera el producto cartesiano de talles por colores y asigna un SKU único a cada combinación.

Segundo, un Kardex transaccional e inmutable: cada movimiento de stock —compra, venta, ajuste— queda registrado con timestamp, usuario y tipo. Nunca se modifica ni se elimina.

Tercero, validación atómica de ventas: antes de confirmar una venta, el sistema bloquea la variante con SELECT FOR UPDATE para evitar que dos operaciones simultáneas dejen el stock en negativo.

Cuarto, alertas de punto de reorden: cada variante tiene un umbral configurable, y el sistema avisa cuando el stock baja de ese nivel.

Y quinto, control de acceso por roles: los administradores pueden ajustar stock, crear productos y gestionar usuarios. Los operadores solo pueden registrar ventas."

---

## [01:35 – 02:10] ENFOQUE EN CALIDAD

> *Pantalla: Diagrama del plan SQA, métricas*

**Narrador:**
"El foco del proyecto no está solo en las funcionalidades, sino en la calidad del software. Trabajamos con un Plan SQA siguiendo el estándar IEEE 730, que define métricas de código, cobertura de pruebas y trazabilidad de requerimientos.

El backend tiene una complejidad ciclomática promedio de 1.47, con todas las funciones en grado A según la herramienta Radon. El índice de mantenibilidad supera el umbral mínimo de 40 en todos los módulos."

---

## [02:10 – 02:45] STACK TECNOLÓGICO

> *Pantalla: Íconos del stack — Python, FastAPI, React, PostgreSQL, Docker*

**Narrador:**
"El stack elegido refleja decisiones técnicas concretas:

- Backend en Python 3.12 con FastAPI para una API REST rápida y autodocumentada.
- SQLAlchemy 2.0 como ORM con Alembic para migraciones versionadas de la base de datos.
- PostgreSQL 16 como motor relacional, necesario para las garantías de aislamiento transaccional.
- Frontend en TypeScript con React 18 y Vite.
- Todo orquestado con Docker Compose para garantizar reproducibilidad del entorno."

---

## [02:45 – 03:00] CIERRE

> *Pantalla: Logo + integrantes*

**Narrador:**
"En los siguientes videos vamos a ver el sistema en funcionamiento, profundizar en la arquitectura del código, y conocer el chatbot integrado que complementa la experiencia. Grupo 5 — Ingeniería de Software II — IUA 2026."

---
*FIN DEL VIDEO 1*
