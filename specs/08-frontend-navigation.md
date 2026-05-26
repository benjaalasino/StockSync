# 08 — Frontend: navegación (App.tsx)

## Cambios en `frontend/src/App.tsx`

### 1. Agregar imports de las nuevas páginas

```tsx
import ClientsPage from './pages/ClientsPage'
import SalesPage from './pages/SalesPage'
// ProductsPage ya existe, se reemplaza el archivo pero el import no cambia
```

### 2. Actualizar los items del sidebar

Reemplazar el array de navegación actual por:

```tsx
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/clients',   label: 'Clientes',  icon: '👤' },
  { path: '/products',  label: 'Productos', icon: '📦' },
  { path: '/sales',     label: 'Ventas',    icon: '🛒' },
]
```

> Si el sidebar usa texto plano sin emojis, simplemente mantener el estilo existente con los tres sectores nuevos.

### 3. Agregar las rutas en el Router

Dentro del bloque de rutas protegidas (donde ya están `/dashboard`, `/products`, etc.):

```tsx
<Route path="/clients" element={<ClientsPage />} />
<Route path="/sales"   element={<SalesPage />} />
```

La ruta `/products` ya existe y apunta a `ProductsPage` — no hace falta cambiarla, solo reemplazar el contenido del archivo como indica la spec `06`.

### 4. Ruta por defecto

Si la ruta `/` redirige a algún lugar, asegurarse que siga funcionando (generalmente redirige a `/dashboard`).

---

## Estructura de rutas resultante

```
/login          → LoginPage       (pública)
/dashboard      → DashboardPage   (protegida)
/clients        → ClientsPage     (protegida) ← nueva
/products       → ProductsPage    (protegida) ← reemplazada con datos reales
/sales          → SalesPage       (protegida) ← nueva
*               → NotFoundPage
```

---

## Nota sobre el sidebar activo

El sidebar probablemente marca el ítem activo comparando `location.pathname` con el `path` de cada ítem. Al agregar las rutas nuevas con los paths exactos (`/clients`, `/sales`), el resaltado debería funcionar automáticamente si ya está implementado con `useLocation()` o `NavLink`.
