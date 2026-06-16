import { useState, useEffect } from "react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ClientsPage from "./pages/ClientsPage";
import SalesPage from "./pages/SalesPage";
import StockPage from "./pages/StockPage";
import ReportsPage from "./pages/ReportsPage";
import NotFoundPage from "./pages/NotFoundPage";
import { authApi } from "./services/api";
import type { User } from "./types";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: "home" },
  { label: "Clientes", path: "/clients", icon: "people" },
  { label: "Productos", path: "/products", icon: "inventory_2" },
  { label: "Ventas", path: "/sales", icon: "shopping_cart" },
  { label: "Stock", path: "/stock", icon: "warehouse" },
  { label: "Reportes", path: "/reports", icon: "assessment" },
];

function AppLayout({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const location = useLocation();
  const pageTitle = menuItems.find((item) => item.path === location.pathname)?.label || "StockSync";

  return (
    <div className="min-h-screen bg-background text-on-background">
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-on-secondary-fixed shadow-sm flex flex-col px-gutter py-gutter">
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary-container text-on-primary-container text-2xl font-bold">
            S
          </div>
          <div>
            <p className="text-body-sm font-semibold uppercase tracking-[0.2em] text-primary-container">
              StockSync
            </p>
            <p className="text-surface-variant text-sm">Panel de control</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
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
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl bg-surface p-5 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container font-semibold text-sm">
              {user?.full_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-on-surface">{user?.full_name ?? "—"}</p>
              <p className="text-sm text-on-surface-variant capitalize">{user?.role ?? "—"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-body-md font-semibold text-on-primary transition hover:bg-primary-container"
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
          <div className="rounded-3xl bg-surface p-3 text-on-surface-variant shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            Todo listo para explorar el menú de StockSync.
          </div>
        </header>

        <main className="p-8">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const authenticated = Boolean(localStorage.getItem("access_token"));
  return authenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem("access_token")));
  const [user, setUser] = useState<User | null>(null);

  // Restore user profile when already authenticated (e.g. page refresh)
  useEffect(() => {
    if (authenticated && !user) {
      authApi.me().then(setUser).catch(() => {
        // Token invalid — clear and redirect
        localStorage.removeItem("access_token");
        setAuthenticated(false);
      });
    }
  }, [authenticated, user]);

  const handleLogin = async () => {
    setAuthenticated(true);
    try {
      const u = await authApi.me();
      setUser(u);
    } catch {
      // ignore — layout will show placeholder
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setAuthenticated(false);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            authenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="products" element={<ProductsPage user={user} />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="stock" element={<StockPage user={user} />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
