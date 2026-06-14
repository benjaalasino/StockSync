export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Reportes</p>
        <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">Información de rendimiento</h1>
        <p className="mt-4 max-w-2xl text-body-md text-on-surface-variant">
          Visualiza los datos clave de inventario, ventas y compras para tomar decisiones rápidas.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Ventas mensuales</h2>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Aumenta la visibilidad de los productos más vendidos y las tendencias de consumo.
          </p>
        </div>
        <div className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Rotación</h2>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Revisa qué líneas de producto necesitan reabastecimiento urgente.
          </p>
        </div>
        <div className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Alertas</h2>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Controla los avisos de stock bajo para evitar quiebres de inventario.
          </p>
        </div>
      </div>
    </div>
  );
}
