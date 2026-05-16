export default function StockPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Stock</p>
        <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">Estado actual de inventario</h1>
        <p className="mt-4 max-w-2xl text-body-md text-on-surface-variant">
          Revisa niveles críticos y mantiene el inventario actualizado con vista rápida a los artículos con mayor rotación.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { name: "Cables HDMI", remaining: 14, status: "Bajo" },
          { name: "Baterías AA", remaining: 82, status: "Estable" },
          { name: "Cargadores móviles", remaining: 6, status: "Crítico" },
        ].map((item) => (
          <div key={item.name} className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <div className="flex items-center justify-between gap-4">
              <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">{item.name}</p>
              <span className={`rounded-full px-3 py-1 text-[0.75rem] font-semibold ${item.status === "Crítico" ? "bg-error text-on-error" : item.status === "Bajo" ? "bg-secondary-container text-secondary" : "bg-primary-container text-on-primary-container"}`}>
                {item.status}
              </span>
            </div>
            <p className="mt-6 text-headline-lg font-semibold text-on-surface">{item.remaining} unidades</p>
          </div>
        ))}
      </div>
    </div>
  );
}
