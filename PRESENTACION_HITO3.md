# StockSync — Presentación del Proyecto
## Ingeniería de Software II — IUA 2026 | Grupo 5

**Integrantes:** Alasino Benjamín · Calvo Tomás · Contreras Joaquín · González Martín
**Hito actual:** Hito 3 — Plan SQA + Métricas de Calidad
**Fecha:** Mayo 2026

---

## 1. ¿Qué es StockSync?

StockSync es un sistema de gestión de inventario para comercios de indumentaria. Permite a los comercios registrar sus productos, controlar el stock en tiempo real mediante un Kardex transaccional, registrar ventas y compras, y recibir alertas cuando el stock cae por debajo del umbral definido.

El foco del proyecto no está solo en las funcionalidades sino en la **calidad del software**: aplicación de métricas de código (CC, MI, LOC), plan SQA basado en IEEE 730, trazabilidad de requerimientos y suite de pruebas automatizadas.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Python 3.12 + FastAPI + SQLAlchemy 2.0 + Alembic |
| Base de datos | PostgreSQL 16 |
| Autenticación | JWT (python-jose) + bcrypt (passlib) |
| Frontend | TypeScript + React 18 + Vite + Axios + TanStack Query |
| Infraestructura | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Calidad de código | Ruff (linter/formatter) + pytest + pytest-cov |

---

## 3. Arquitectura del Sistema

```
StockSync/
├── backend/
│   ├── app/
│   │   ├── core/         # Configuración, base de datos, seguridad JWT
│   │   ├── models/       # Entidades SQLAlchemy (ORM)
│   │   ├── schemas/      # Contratos de API con Pydantic
│   │   ├── services/     # Lógica de negocio
│   │   └── api/v1/       # Endpoints REST (FastAPI Routers)
│   ├── alembic/          # Migraciones de base de datos
│   └── tests/            # Suite de pruebas (pytest)
└── frontend/
    └── src/
        ├── services/     # Cliente Axios centralizado (api.ts)
        └── types/        # Tipado TypeScript
```

El backend sigue una arquitectura en capas: **Router → Service → Model**, con validación de datos en la capa de schemas (Pydantic) antes de llegar a la lógica de negocio.

---

## 4. Requerimientos y Trazabilidad

| ID | Descripción | Estado |
|----|-------------|--------|
| REQ-F01 | Producto Padre con generación automática de SKUs Hijo por matriz de atributos | ✅ Implementado |
| REQ-F02 | Kardex transaccional inmutable con timestamp, usuario, tipo y cantidad | ✅ Implementado |
| REQ-F03 | Venta con validación de disponibilidad antes del commit, sin saldos negativos | ✅ Implementado |
| REQ-F04 | Alerta de punto de reorden cuando stock ≤ umbral definido por Admin | ✅ Implementado |
| REQ-F05 | RBAC: ajustes de inventario y eliminación lógica bloqueados para no-Admin | ✅ Implementado |
| REQ-NF01 | Aislamiento transaccional Read Committed, prevención de lecturas sucias | ✅ Implementado |
| REQ-NF02 | Consultas de disponibilidad de SKU < 300ms en percentil 95 | ⏳ Pendiente de medición |

---

## 5. Decisiones de Diseño Clave

### 5.1 Modelo Producto Padre / SKU Hijo (REQ-F01)

Se separó el concepto de producto en dos entidades:
- **`Product`** (Producto Padre): define el artículo genérico con un SKU base. Ej: "Remera Básica" → `REM-BASE`.
- **`ProductVariant`** (SKU Hijo): combinación única de atributos. El SKU se genera concatenando el base con los valores: `REM-BASE-M-ROJO`.
- **`AttributeType`** / **`AttributeValue`**: permiten definir atributos dinámicos como Talle (S, M, L) y Color (Rojo, Azul).
- La generación de variantes usa **producto cartesiano** (`itertools.product`) sobre los grupos de atributos, creando todas las combinaciones posibles en un solo request.

### 5.2 Kardex Inmutable (REQ-F02)

La tabla `StockMovement` es **append-only**: nunca se hace `UPDATE` ni `DELETE`. El stock actual de cualquier variante se calcula como `SUM(quantity)` de todos sus movimientos históricos.

Tipos de movimiento implementados:
- `PURCHASE` — Ingreso por orden de compra
- `SALE` — Egreso por venta
- `ADJUSTMENT_IN` / `ADJUSTMENT_OUT` — Ajuste manual (solo Admin)
- `RETURN_IN` / `RETURN_OUT` — Devoluciones

### 5.3 Venta Atómica con Control de Concurrencia (REQ-F03 + REQ-NF01)

El proceso de venta implementa `SELECT FOR UPDATE` sobre la variante antes de registrar el egreso. Esto bloquea la fila durante la transacción y previene *race conditions* en escenarios de venta concurrente. Si el stock es insuficiente, se hace rollback y se retorna **HTTP 409 Conflict**.

### 5.4 RBAC — Control de Acceso por Rol (REQ-F05)

Dos roles: `admin` y `operator`. Las dependencias de FastAPI `get_current_user` y `require_admin` en `security.py` actúan como guardias a nivel de endpoint. Operaciones restringidas a Admin:
- Crear/editar/eliminar productos y variantes
- Ajustar stock manualmente
- Gestionar usuarios
- Confirmar recepciones de órdenes de compra
- Crear categorías, atributos y proveedores

La eliminación de registros es siempre **lógica** (`is_active = False`), nunca física.

### 5.5 Alertas de Punto de Reorden (REQ-F04)

Cada `ProductVariant` tiene un campo `reorder_point` configurable. El endpoint `GET /api/v1/stock/alerts/low-stock` devuelve todas las variantes cuyo stock actual (calculado desde el Kardex) es menor o igual al umbral definido.

---

## 6. API REST — Endpoints Implementados

### Autenticación (`/api/v1/auth`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/login` | Login con credenciales → retorna JWT |
| POST | `/register` | Registro de nuevo usuario |

### Usuarios (`/api/v1/users`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/me` | Perfil del usuario autenticado |
| GET | `/` | Listar usuarios (Admin) |

### Productos (`/api/v1/products`)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/` | Listar productos con stock actual | Todos |
| POST | `/` | Crear producto padre | Admin |
| GET | `/{id}` | Detalle de producto con variantes | Todos |
| PATCH | `/{id}` | Actualizar producto | Admin |
| DELETE | `/{id}` | Eliminación lógica | Admin |
| POST | `/{id}/variants` | Agregar variante individual | Admin |
| POST | `/{id}/variants/generate` | Generar matriz de variantes (REQ-F01) | Admin |
| PATCH | `/variants/{id}` | Actualizar precios/punto de reorden | Admin |
| GET | `/categories` | Listar categorías | Todos |
| POST | `/categories` | Crear categoría | Admin |
| GET | `/attributes` | Listar tipos de atributos | Todos |
| POST | `/attributes` | Crear tipo de atributo | Admin |
| POST | `/attributes/values` | Agregar valor a atributo | Admin |

### Stock (`/api/v1/stock`)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/summary/{variant_id}` | Stock actual de una variante | Todos |
| GET | `/movements/{variant_id}` | Historial Kardex (REQ-F02) | Todos |
| GET | `/alerts/low-stock` | Variantes bajo punto de reorden (REQ-F04) | Todos |
| POST | `/adjust` | Ajuste manual de stock (REQ-F05) | Admin |
| POST | `/sales` | Registrar venta (REQ-F03) | Todos |
| POST | `/purchases` | Crear orden de compra | Todos |
| POST | `/purchases/{id}/receive` | Confirmar recepción (actualiza Kardex) | Admin |
| GET | `/suppliers` | Listar proveedores | Todos |
| POST | `/suppliers` | Crear proveedor | Admin |

Documentación interactiva disponible en Swagger UI: `http://localhost:8000/docs`

---

## 7. Pruebas Automatizadas

La suite de pruebas utiliza **pytest** con base de datos SQLite en memoria (aislamiento por test). Se aplica el patrón **AAA (Arrange · Act · Assert)** en todos los casos.

### Cobertura actual

| Módulo | Cobertura |
|--------|-----------|
| `app/models/` | ~92–94% |
| `app/schemas/` | ~97–100% |
| `app/services/auth_service.py` | 77% |
| `app/services/product_service.py` | 91% |
| `app/services/stock_service.py` | 78% |
| **TOTAL** | **72%** ✅ |

> Umbral mínimo requerido: 60% — **superado**.

### Casos de prueba implementados (22 en total)

**auth_service (2 tests)**
- Creación exitosa de usuario con contraseña hasheada
- Rechazo de email duplicado (HTTP 400)

**product_service (14 tests)**
- Crear categoría exitosa / rechazo de nombre duplicado
- Crear producto exitoso / rechazo de SKU duplicado
- Actualizar producto / producto no encontrado (HTTP 404)
- Eliminación lógica de producto (verificación de `is_active = False`)
- Construcción de SKU por combinación de atributos
- Agregar variante individual / rechazo de duplicado
- Generación de matriz de variantes (2 talles × 2 colores = 4 variantes)
- Actualizar precios de variante

**stock_service (6 tests)**
- Stock inicial en cero (sin movimientos en Kardex)
- Ajuste de stock: genera movimiento `ADJUSTMENT_IN` y actualiza saldo
- Venta con stock insuficiente (HTTP 409)
- Venta exitosa: descuento correcto en Kardex
- Crear orden de compra con estado `PENDING`
- Confirmar recepción: cambia estado a `RECEIVED` e ingresa stock al Kardex

---

## 8. Pipeline de Integración Continua (CI)

GitHub Actions ejecuta automáticamente dos jobs en cada push a `develop` y en todo PR hacia `develop` o `main`:

1. **Lint** — Ruff verifica el estilo del código (PEP 8 + reglas adicionales)
2. **Tests & Coverage** — pytest corre la suite completa y falla si la cobertura cae por debajo del 60%

El reporte de cobertura se sube como artefacto del pipeline.

---

## 9. Estado Actual del Proyecto

### ✅ Completado

- Todos los modelos de base de datos (SQLAlchemy)
- Schemas de validación (Pydantic)
- Servicios de negocio (auth, products, stock)
- API REST completa y documentada (Swagger)
- Autenticación JWT + RBAC
- Suite de 22 pruebas automatizadas con 72% de cobertura
- Linter (Ruff) sin errores
- Pipeline CI en GitHub Actions

### ⏳ Pendiente (Hitos 4 y 5)

- **Frontend**: páginas React (Login, Dashboard, Catálogo, Ventas, Compras)
- **Plan de pruebas completo**: casos de prueba formales + reporte de defectos (Hito 4)
- **RTM** (Requirement Traceability Matrix) actualizado
- **Wireframes** formales de la interfaz
- **Medición de REQ-NF02**: benchmark de latencia en consultas de stock
- **Defensa oral** (Hito 5)

---

## 10. Cómo Ejecutar el Proyecto

```bash
# Levantar todos los servicios con Docker
docker compose up --build

# Accesos:
# API + Swagger UI:  http://localhost:8000/docs
# Frontend:          http://localhost:5173
# PostgreSQL:        localhost:5432

# Ejecutar tests manualmente (desde /backend):
pip install -r requirements-dev.txt
pytest -v --cov=app
```

---

*Repositorio: https://github.com/benjaalasino/StockSync*
