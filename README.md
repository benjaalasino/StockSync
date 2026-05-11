# StockSync — Sistema de Gestión de Inventario

Sistema de gestión de inventario para indumentaria desarrollado como trabajo de campo de **Ingeniería de Software II — IUA 2026**.

StockSync es un sistema de gestión de inventario orientado a comercios de indumentaria que resuelve el descontrol operativo causado
por la gestión manual o descentralizada del stock. El sistema implementa un modelo de Producto Padre / SKU Hijo que genera automáticamente
variantes a partir de combinaciones de atributos(talle, color, temporada), un Kardex transaccional inmutable donde el stock siempre se calcula
como la sumatoria de movimientos registrados,y un módulo de ventas con validación atómica que previene saldos negativos bajo concurrencia.
El acceso está controlado mediante RBAC con roles de Administrador y Operador.
Desarrollado como trabajo integrador de Ingeniería de Software II — IUA 2026, con foco en calidad de software: métricas de código, plan SQA,
trazabilidad de requerimientos y suite de pruebas automatizadas.


**Grupo 5:** Alasino Benjamin · Calvo Tomás · Contreras Joaquín · González Martín

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.12 + FastAPI |
| Frontend | TypeScript + React 18 + Vite |
| Base de datos | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 + Alembic |
| Autenticación | JWT (python-jose) |
| Contenedores | Docker + Docker Compose |

---

## Arquitectura

```
StockSync/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, DB, Seguridad/JWT
│   │   ├── models/        # Modelos SQLAlchemy
│   │   ├── schemas/       # Schemas Pydantic (validación)
│   │   ├── services/      # Lógica de negocio
│   │   └── api/v1/        # Routers FastAPI
│   └── alembic/           # Migraciones de BD
└── frontend/
    └── src/
        ├── types/          # Tipos TypeScript
        ├── services/       # Cliente HTTP (Axios)
        ├── pages/          # Vistas por módulo
        └── components/     # Componentes reutilizables
```

---

## Modelo de Datos

El modelo sigue el patrón **Producto Padre / SKU Hijo** para manejar variantes:

- **Product** → define el producto genérico (ej: "Remera Básica")
- **ProductVariant** → SKU específico generado combinando atributos (ej: "REM-BASE-M-ROJO")
- **StockMovement** (Kardex) → registro **inmutable** de cada movimiento. El stock actual se calcula como `SUM(quantity)` de todos los movimientos de una variante.

---

## Módulos Funcionales

| Módulo | Descripción | Req |
|--------|------------|-----|
| Catálogo | Gestión de productos padre y generación automática de SKUs hijo por matriz de atributos | REQ-F01 |
| Kardex | Registro inmutable de todos los movimientos de stock | REQ-F02 |
| Ventas | Validación atómica de stock + egreso con SELECT FOR UPDATE | REQ-F03 |
| Alertas | Notificación cuando stock ≤ punto de reorden | REQ-F04 |
| RBAC | Control de acceso por roles Admin / Operador | REQ-F05 |
| Compras | Órdenes de compra a proveedores, recepción genera entradas en Kardex | — |

---

## Levantar el proyecto con Docker

### Requisitos previos
- Docker Desktop instalado y corriendo

### Pasos

```bash
# Clonar el repo
git clone https://github.com/benjaalasino/Ing.-de-Software-II
cd Ing.-de-Software-II

# Levantar todos los servicios (BD + backend + frontend)
docker-compose up --build

# Primera vez: las migraciones corren automáticamente al iniciar el backend
```

| Servicio | URL |
|---------|-----|
| API (Swagger UI) | http://localhost:8000/docs |
| API (ReDoc) | http://localhost:8000/redoc |
| Frontend | http://localhost:5173 |
| PostgreSQL | localhost:5432 |

---

## Levantar en desarrollo (sin Docker)

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\activate           # Windows

# Instalar dependencias
pip install -r requirements.txt

# Copiar variables de entorno
cp .env.example .env
# Editar .env con la URL de tu PostgreSQL local

# Correr migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## API — Endpoints principales

### Autenticación
```
POST /api/v1/auth/login          # Login → JWT
GET  /api/v1/auth/me             # Perfil propio
```

### Productos
```
GET    /api/v1/products/                             # Listar productos con stock
POST   /api/v1/products/                             # Crear producto padre
POST   /api/v1/products/{id}/variants/generate       # Generar matriz de variantes
```

### Stock & Kardex
```
GET  /api/v1/stock/summary/{variant_id}              # Stock actual de una variante
GET  /api/v1/stock/movements/{variant_id}            # Historial Kardex
GET  /api/v1/stock/alerts/low-stock                  # Alertas punto de reorden
POST /api/v1/stock/adjust                            # Ajuste manual (solo Admin)
```

### Ventas y Compras
```
POST /api/v1/stock/sales                             # Registrar venta
POST /api/v1/stock/purchases                         # Crear orden de compra
POST /api/v1/stock/purchases/{id}/receive            # Confirmar recepción
```

---

## Roles (RBAC)

| Operación                         | Admin  | Operador |
|-----------------------------------|------- |----------|
| Ver productos y stock             |  ✅   |   ✅     |
| Registrar ventas                  |  ✅   |   ✅     |
| Crear órdenes de compra           |  ✅   |   ✅     |
| Crear/editar productos            |  ✅   |   ❌     |
| Ajustar stock manualmente         |  ✅   |   ❌     |
| Gestionar usuarios                |  ✅   |   ❌     |
| Confirmar recepción de compras    |  ✅   |   ❌     |
