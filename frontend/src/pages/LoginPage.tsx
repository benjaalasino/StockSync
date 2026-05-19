import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/services/api";

interface LoginPageProps {
  onLogin: (userName: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("admin@stocksync.com");
  const [password, setPassword] = useState("Password2026!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await authApi.login(email, password);
      localStorage.setItem("access_token", access_token);
      const user = await authApi.me();
      localStorage.setItem("user_name", user.full_name);
      localStorage.setItem("user_role", user.role);
      onLogin(user.full_name);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Usuario o contraseña incorrectos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-low via-surface to-primary-fixed-dim text-on-background flex items-center justify-center px-4 py-10">
      <div className="grid max-w-6xl gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[32px] bg-on-secondary-fixed-variant/90 p-10 shadow-soft-bloom-shadow ring-1 ring-primary-container/10 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container text-2xl">
              S
            </div>
            <div>
              <p className="text-label-sm uppercase tracking-[0.18em] text-primary-container">StockSync</p>
              <h1 className="mt-2 text-headline-xl font-bold text-surface-bright">Bienvenido de nuevo</h1>
            </div>
          </div>

          <p className="max-w-md text-body-lg text-surface-bright/85">
            Gestiona inventario, productos y reportes desde un espacio moderno.
            Usa las credenciales de acceso para ingresar al sistema.
          </p>

          <div className="mt-10 rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <p className="text-label-md font-semibold text-on-surface">Credenciales de acceso</p>
            <div className="mt-4 space-y-3 text-body-md text-on-surface-variant">
              <p><span className="font-semibold text-on-surface">Admin:</span> admin@stocksync.com / Password2026!</p>
              <p><span className="font-semibold text-on-surface">Operador:</span> operador@stocksync.com / Operador2026!</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-surface-container-lowest p-10 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <div className="mb-8">
            <p className="text-label-sm uppercase tracking-[0.18em] text-primary-container">Acceso seguro</p>
            <h2 className="mt-3 text-headline-lg font-semibold text-on-surface">Ingresa a tu panel</h2>
            <p className="mt-3 text-body-md text-on-surface-variant">
              Autenticación real contra la base de datos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block text-label-md font-medium text-on-surface-variant">
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface outline-none transition focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                required
              />
            </label>

            <label className="block text-label-md font-medium text-on-surface-variant">
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface outline-none transition focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                required
              />
            </label>

            {error && (
              <div className="rounded-2xl bg-error-container/90 p-4 text-sm font-medium text-on-error-container">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary py-3 text-body-md font-semibold text-on-primary transition hover:bg-primary-container disabled:opacity-60"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
