import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { authApi } from "@/services/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await authApi.login(email, password);
      await login(access_token);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Error al conectar con el servidor";
      setError(typeof msg === "string" ? msg : "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-low via-surface to-primary-fixed-dim text-on-background flex items-center justify-center px-4 py-10">
      <div className="grid max-w-5xl w-full gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* Panel izquierdo — info */}
        <div className="rounded-[32px] bg-on-secondary-fixed/90 p-10 shadow-soft-bloom-shadow ring-1 ring-primary-container/10 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container text-2xl font-bold">
              S
            </div>
            <div>
              <p className="text-label-sm uppercase tracking-[0.18em] text-primary-container">StockSync</p>
              <h1 className="mt-2 text-headline-xl font-bold text-surface-bright">
                Bienvenido de nuevo
              </h1>
            </div>
          </div>
          <p className="max-w-md text-body-lg text-surface-bright/85">
            Sistema de gestión de inventario para indumentaria. Controlá stock, ventas, compras y alertas desde un solo lugar.
          </p>
          <div className="mt-10 space-y-4">
            {[
              { icon: "inventory_2", text: "Gestión de productos y variantes por SKU" },
              { icon: "warehouse", text: "Kardex transaccional inmutable" },
              { icon: "point_of_sale", text: "Registro de ventas con validación de stock" },
              { icon: "local_shipping", text: "Órdenes de compra y recepción de mercadería" },
            ].map(({ icon, text }) => (
              <div key={icon} className="flex items-center gap-3 text-surface-bright/80">
                <span className="material-symbols-outlined text-primary-container">{icon}</span>
                <span className="text-body-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho — formulario */}
        <div className="rounded-[32px] bg-surface-container-lowest p-10 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <div className="mb-8">
            <p className="text-label-sm uppercase tracking-[0.18em] text-primary-container">Acceso seguro</p>
            <h2 className="mt-3 text-headline-lg font-semibold text-on-surface">Ingresá a tu cuenta</h2>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              Usá tu email y contraseña de StockSync.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-label-md font-medium text-on-surface-variant mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-label-md font-medium text-on-surface-variant mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-error-container/90 p-4 text-body-sm font-medium text-on-error-container">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary py-3 text-body-md font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Ingresando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
