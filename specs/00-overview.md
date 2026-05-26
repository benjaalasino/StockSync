# StockSync — Plan de implementación: Clientes · Productos · Ventas

## Objetivo

Agregar el sector **Clientes** al sistema y conectar las páginas de **Productos** y **Ventas** con la base de datos real (hoy usan datos hardcodeados). Las ventas quedan asociadas a un cliente, con posibilidad de crear el cliente inline durante la carga.

## Archivos de especificación

| Archivo | Qué cubre |
|---|---|
| `01-database.md` | Migración Alembic: tabla `clients` + columna `client_id` en `sales` |
| `02-backend-client.md` | Modelo, schema, service y router de Clientes |
| `03-backend-sale.md` | Modificaciones a Sale para soportar `client_id` |
| `04-frontend-types-api.md` | Tipos TypeScript y métodos en `api.ts` |
| `05-frontend-clients-page.md` | Página `/clients` completa |
| `06-frontend-products-page.md` | Página `/products` con datos reales |
| `07-frontend-sales-page.md` | Página `/sales` con flujo de creación y cliente inline |
| `08-frontend-navigation.md` | Sidebar y rutas en `App.tsx` |

## Orden de ejecución recomendado

1. `01-database.md` — primero, porque todo depende de la BD
2. `02-backend-client.md` — modelo antes que el resto del backend
3. `03-backend-sale.md` — depende del modelo Client
4. `04-frontend-types-api.md` — base para todas las páginas
5. `05`, `06`, `07`, `08` — pueden hacerse en paralelo o en cualquier orden

## Reglas generales del proyecto

- **Eliminación**: siempre lógica (`is_active = False`), nunca `DELETE` físico
- **Stock**: nunca modificar directamente; siempre crear un `StockMovement`
- **Commits**: formato `[REQ-Fxx] Descripción`
- **Migraciones**: usar Alembic, no modificar tablas a mano
- **RBAC**: operaciones de escritura sensibles requieren rol `admin`
