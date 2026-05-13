# StockSync — Contexto del Proyecto

## Qué es

Sistema de gestión de inventario para comercios de indumentaria. Trabajo de campo integrador de **Ingeniería de Software II — IUA 2026**, Grupo 5: Alasino Benjamin, Calvo Tomás, Contreras Joaquín, González Martín.

Repo: https://github.com/benjaalasino/StockSync
cl

El foco del proyecto no está solo en las funcionalidades sino en la **calidad del software**: métricas de código, plan SQA (IEEE 730), trazabilidad de requerimientos y pruebas automatizadas.

---

## Stack

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy 2.0 + Alembic
- **Frontend**: TypeScript + React 18 + Vite + Axios + TanStack Query
- **Base de datos**: PostgreSQL 16
- **Auth**: JWT con python-jose + passlib/bcrypt
- **Infraestructura**: Docker + Docker Compose

---

## Estructura del proyecto

```
StockSync/
├── backend/
│   ├── app/
│   │   ├── core/           # config.py, database.py, security.py
│   │   ├── models/         # SQLAlchemy: user, product, stock, supplier
│   │   ├── schemas/        # Pydantic: auth, user, product, stock
│   │   ├── services/       # Lógica de negocio: auth_service, product_service, stock_service
│   │   └── api/v1/         # Routers: auth, users, products, stock
│   ├── alembic/            # Migraciones de BD
│   ├── tests/              # pytest
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── types/          # Tipos TypeScript (index.ts)
│   │   ├── services/       # api.ts — cliente Axios centralizado
│   │   ├── pages/          # Vistas por módulo (a construir)
│   │   └── components/     # Componentes reutilizables (a construir)
│   ├── index.html
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Modelo de datos — decisiones clave

### Producto Padre / SKU Hijo (REQ-F01)

- `Product` = producto genérico (ej: "Remera Básica", SKU base: "REM-BASE")
- `ProductVariant` = SKU específico generado combinando atributos (ej: "REM-BASE-M-ROJO")
- `AttributeType` = tipo de atributo ("Talle", "Color")
- `AttributeValue` = valor concreto ("S", "M", "L", "Rojo", "Azul")
- La generación de variantes usa producto cartesiano (`itertools.product`) sobre las combinaciones de atributos

### Kardex inmutable (REQ-F02)

- `StockMovement` es append-only. **Nunca se hace UPDATE ni DELETE** sobre esta tabla
- El stock actual se calcula siempre como `SUM(quantity)` de todos los movimientos de una variante
- `quantity` positivo = ingreso, negativo = egreso
- Tipos: PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, RETURN_IN, RETURN_OUT

### Validación atómica de ventas (REQ-F03 + REQ-NF01)

- Las ventas usan `SELECT FOR UPDATE` para bloquear la fila de la variante y prevenir race conditions
- Si el stock es insuficiente, se hace rollback y se devuelve HTTP 409
- Implementado en `stock_service.create_sale()`

### RBAC (REQ-F05)

- Roles: `admin` y `operator`
- Las dependencias `get_current_user` y `require_admin` en `security.py` protegen los endpoints
- Operaciones restringidas a Admin: crear/editar/eliminar productos, ajustar stock, gestionar usuarios, confirmar recepciones

### Alertas de punto de reorden (REQ-F04)

- Cada `ProductVariant` tiene un campo `reorder_point`
- El endpoint `GET /stock/alerts/low-stock` devuelve variantes donde `stock_actual <= reorder_point`

---

## Requerimientos del proyecto

| ID       | Descripción                                                                   |
| -------- | ----------------------------------------------------------------------------- |
| REQ-F01  | Producto Padre con generación automática de SKUs Hijo por matriz de atributos |
| REQ-F02  | Kardex transaccional inmutable con timestamp, usuario, tipo y cantidad        |
| REQ-F03  | Venta con validación de disponibilidad antes del commit, sin saldos negativos |
| REQ-F04  | Alerta de punto de reorden cuando stock ≤ umbral definido por Admin           |
| REQ-F05  | RBAC: ajustes de inventario y eliminación lógica bloqueados para no-Admin     |
| REQ-NF01 | Aislamiento transaccional Read Committed, prevención de lecturas sucias       |
| REQ-NF02 | Consultas de disponibilidad de SKU < 300ms en percentil 95                    |

---

## Hitos del trabajo de campo

| #   | Fecha | Entregable                                                      | Estado |
| --- | ----- | --------------------------------------------------------------- | ------ |
| 1   | 29/04 | Conformación de grupos + idea                                   | ✅     |
| 2   | 05/05 | Propuesta de proyecto (PDF)                                     | ✅     |
| 3   | 20/05 | Plan SQA + métricas iniciales (LOC, CC, MI) + linter            | ⏳     |
| 4   | 03/06 | Plan de pruebas + casos + reporte de defectos (cobertura ≥ 60%) | ⏳     |
| 5   | 16/06 | Entrega final + RTM + wireframes + defensa oral                 | ⏳     |

---

## Cómo levantar

```bash
docker compose up --build
```

- Swagger UI: http://localhost:8000/docs
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432

---

## Lo que está implementado vs. lo que falta

### Backend — completo

- Todos los modelos, schemas, servicios y routers están implementados
- La API es funcional y testeable desde Swagger UI

### Frontend — estructura base lista, páginas pendientes

Falta construir las páginas React en `src/pages/`:

- `auth/` — Login
- `dashboard/` — Resumen + alertas de stock bajo
- `products/` — Catálogo, creación de productos y generación de variantes
- `sales/` — Registro de ventas
- `purchases/` — Órdenes de compra y recepción de mercadería

La capa de comunicación con la API ya está en `src/services/api.ts` con todos los métodos necesarios.

---

## Convenciones del proyecto

- **Commits**: formato `[REQ-F01] Descripción de lo que hace el commit`
- **Rama principal**: `main`
- **Flujo**: GitFlow — features en ramas `feature/nombre`, PRs hacia `develop`
- **Eliminación de registros**: siempre lógica (`is_active = False`), nunca DELETE físico
- **Stock**: nunca modificar directamente; siempre crear un `StockMovement`
