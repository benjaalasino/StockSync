import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="rounded-[32px] bg-surface-container-lowest p-10 text-center shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Oops</p>
        <h1 className="mt-4 text-headline-xl font-semibold text-on-surface">Página no encontrada</h1>
        <p className="mt-4 max-w-md text-body-md text-on-surface-variant">
          La ruta que buscas no existe. Vuelve al panel para continuar navegando.
        </p>
        <Link
          className="mt-8 inline-flex rounded-2xl bg-primary px-6 py-3 text-body-md font-semibold text-on-primary transition hover:bg-primary-container"
          to="/dashboard"
        >
          Ir a panel
        </Link>
      </div>
    </div>
  );
}
