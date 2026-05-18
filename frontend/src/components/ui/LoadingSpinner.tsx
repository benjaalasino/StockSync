export function LoadingSpinner({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-container border-t-primary" />
      <p className="text-body-sm text-on-surface-variant">{label}</p>
    </div>
  );
}
