# VIDEO 5 — Chatbot de StockSync
**Duración estimada:** 3:30 – 5:00 min  
**Tono:** Demo interactivo, conversacional  
**Pantalla:** Interfaz del chatbot en funcionamiento

---

> ⚠️ **NOTA PARA COMPLETAR:** Este guión tiene marcadores `[COMPLETAR: ...]` donde necesitás agregar detalles específicos de tu implementación. Compartí el código del chatbot para que pueda llenarlo con precisión técnica.

---

## [00:00 – 00:20] INTRO

> *Pantalla: Interfaz del chatbot abierta*

**Narrador:**
"StockSync incluye un chatbot integrado que permite interactuar con el sistema de inventario en lenguaje natural. En lugar de navegar por los menús para consultar el stock de una variante específica o revisar alertas, el usuario puede simplemente preguntarle al asistente."

---

## [00:20 – 01:00] TECNOLOGÍA DETRÁS DEL CHATBOT

> *Pantalla: [COMPLETAR: código/arquitectura del chatbot]*

**Narrador:**
"[COMPLETAR: describir stack — por ejemplo si usa Claude API, OpenAI, modelo local, RAG, etc.]

El chatbot se conecta a [COMPLETAR: API/modelo utilizado] y tiene acceso a [COMPLETAR: herramientas o endpoints que usa — ej: 'los mismos endpoints de la API REST de StockSync'].

[COMPLETAR: describir cómo funciona internamente — ej: 'interpreta el intent de la pregunta y decide qué endpoint consultar', o 'usa embeddings para buscar contexto', etc.]"

---

## [01:00 – 02:00] DEMO — CONSULTAS DE STOCK

> *Pantalla: Ventana de chat — escribiendo pregunta*

**Narrador:**
"Veamos el chatbot en acción. Escribimos: '¿Cuántas unidades de la Campera Cuero talle M color Negro quedan en stock?'"

> *Pantalla: Respuesta del chatbot*

"El chatbot [COMPLETAR: describir qué hace internamente — ej: 'identifica la variante por descripción, consulta el endpoint de stock summary, y devuelve la respuesta en lenguaje natural']."

**Ejemplo de respuesta del chatbot:**
"[COMPLETAR: poner la respuesta real que devuelve el chatbot]"

---

## [02:00 – 02:45] DEMO — ALERTAS Y RECOMENDACIONES

> *Pantalla: Pregunta en el chat*

**Narrador:**
"Otra consulta útil: '¿Qué productos necesitan reposición urgente?'"

> *Pantalla: Respuesta del chatbot con lista de variantes*

"El chatbot [COMPLETAR: describir cómo obtiene y presenta las alertas de low-stock]. Esto que antes requería ir a la sección de reportes y filtrar, ahora está disponible en lenguaje natural."

---

## [02:45 – 03:20] DEMO — [COMPLETAR: otro caso de uso del chatbot]

> *Pantalla: [COMPLETAR]*

**Narrador:**
"[COMPLETAR: tercer caso de uso — ej: registrar una venta por chat, consultar historial de movimientos, obtener resumen de ventas del día, etc.]"

---

## [03:20 – 03:50] ARQUITECTURA DE INTEGRACIÓN

> *Pantalla: Diagrama — Chat → [capa del chatbot] → API StockSync → PostgreSQL*

**Narrador:**
"Desde el punto de vista arquitectónico, el chatbot se integra como [COMPLETAR: ej: 'una capa adicional sobre la API REST existente', 'un servicio separado que consume la misma API', etc.].

El frontend [COMPLETAR: dónde está el componente de chat — ej: 'tiene un widget flotante en todas las páginas', 'tiene una página dedicada /chat', etc.].

[COMPLETAR: mencionar si hay manejo de contexto de conversación, historial de mensajes, autenticación del usuario en el chatbot, etc.]"

---

## [03:50 – 04:20] LIMITACIONES Y CONSIDERACIONES

> *Pantalla: [chat con una consulta que el bot no puede resolver]*

**Narrador:**
"El chatbot está diseñado para consultas de inventario y está limitado al alcance del sistema. Si se le pregunta algo fuera del dominio, [COMPLETAR: cómo responde el bot ante consultas fuera de dominio].

[COMPLETAR: cualquier otra limitación relevante — ej: no puede registrar ventas directamente, no tiene acceso a datos históricos mayores a X, etc.]"

---

## [04:20 – 04:40] VALOR QUE APORTA

> *Pantalla: comparación — menú tradicional vs chat*

**Narrador:**
"El chatbot reduce la curva de aprendizaje del sistema para usuarios nuevos. Un operador que no recuerda en qué sección está el reporte de alertas puede simplemente preguntar. Para el administrador, permite consultas rápidas sin interrumpir el flujo de trabajo."

---

## [04:40 – 05:00] CIERRE

**Narrador:**
"El chatbot de StockSync demuestra cómo integrar capacidades de lenguaje natural sobre un sistema CRUD existente sin modificar la arquitectura base. Los mismos endpoints que usa la interfaz visual son los que alimentan las respuestas del asistente, garantizando consistencia de datos."

---

## INSTRUCCIONES PARA COMPLETAR ESTE GUIÓN

Para terminar este guión necesito saber:

1. **¿Qué modelo/API usa el chatbot?** (Claude API, OpenAI, local, etc.)
2. **¿Qué puede hacer?** (consultas de stock, registrar ventas, ver alertas, etc.)
3. **¿Cómo está integrado?** (widget en el frontend, página separada, app aparte)
4. **¿Cómo funciona internamente?** (consulta la API REST, accede directo a BD, usa RAG, etc.)
5. **¿Tiene historial de conversación o es stateless?**

Compartí el código y lo completo con la información técnica exacta.

---
*FIN DEL VIDEO 5 (pendiente completar secciones marcadas)*
