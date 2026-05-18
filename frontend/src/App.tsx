import { BrowserRouter, NavLink, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import StockPage from "@/pages/StockPage";
import SalesPage from "@/pages/SalesPage";
import PurchasesPage from "@/pages/PurchasesPage";
import ReportsPage from "@/pages/ReportsPage";
import NotFoundPage from "@/pages/NotFoundPage";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: "home" },
  { label: "Productos", path: "/products", icon: "inventory_2" },
  { label: "Stock", path: "/stock", icon: "warehouse" },
  { label: "Ventas", path: "/sales", icon: "point_of_sale" },
  { label: "Compras", path: "/purchases", icon: "local_shipping" },
  { label: "Reportes", path: "/reports", icon: "assessment" },
];

function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const pageTitle = menuItems.find((item) => location.pathname.startsWith(item.path))?.label ?? "StockSync";

  return (
    <div className="min-h-screen bg-background text-on-background">
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-on-secondary-fixed shadow-sm flex flex-col px-gutter py-gutter">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary-container text-on-primary-container text-2xl font-bold">
            S
          </div>
          <div>
            <p className="text-body-sm font-semibold uppercase tracking-[0.2em] text-primary-container">StockSync</p>
            <p className="text-surface-variant text-sm">Panel de control</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-3xl px-4 py-3 transition ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-surface-bright/80 hover:bg-on-secondary-fixed-variant hover:text-surface-bright"
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl bg-surface p-5 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container font-bold text-lg">
              {user?.full_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-on-surface text-sm">{user?.full_name}</p>
              <p className="text-xs text-on-surface-variant capitalize">{isAdmin ? "Administrador" : "Operador"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-2xl bg-primary px-4 py-2.5 text-body-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="ml-[260px] min-h-screen">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-outline-variant bg-background/95 px-8 py-4 backdrop-blur-md">
          <div>
            <p className="text-label-sm uppercase tracking-[0.18em] text-secondary-container">Navegación</p>
            <h1 className="text-headline-md font-semibold text-on-surface">{pageTitle}</h1>
          </div>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
