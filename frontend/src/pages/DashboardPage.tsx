export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label-md font-semibold uppercase tracking-[0.18em] text-primary-container">
              Bienvenido</p>
            <h1 className="mt-3 text-headline-lg font-bold text-on-surface">
              Panel principal
            </h1>
          </div>
          <div className="rounded-3xl bg-primary-container/10 px-5 py-3 text-primary-container">
            Estado: conectado
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-surface p-5 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
              Productos activos</p>
            <p className="mt-4 text-headline-lg font-semibold text-on-surface">128</p>
          </div>
          <div className="rounded-3xl bg-surface p-5 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
              Stock disponible</p>
            <p className="mt-4 text-headline-lg font-semibold text-on-surface">4,820</p>
          </div>
          <div className="rounded-3xl bg-surface p-5 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
              Proveedores</p>
            <p className="mt-4 text-headline-lg font-semibold text-on-surface">24</p>
          </div>
          <div className="rounded-3xl bg-surface p-5 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
              Órdenes pendientes</p>
            <p className="mt-4 text-headline-lg font-semibold text-on-surface">8</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Resumen rápido</h2>
          <p className="mt-4 text-body-md text-on-surface-variant">
            Aquí encontrarás una vista inicial de los principales indicadores de inventario y operaciones.
            Navega al menú para ver productos, stock y reportes.
          </p>
        </div>

        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Últimos movimientos</h2>
          <ul className="mt-4 space-y-4 text-body-md text-on-surface-variant">
            <li className="rounded-3xl bg-surface p-4 ring-1 ring-outline-variant">
              Venta confirmada: 12 unidades de Teclado MX-Blue.
            </li>
            <li className="rounded-3xl bg-surface p-4 ring-1 ring-outline-variant">
              Ajuste de stock: +20 unidades en adaptadores USB-C.
            </li>
            <li className="rounded-3xl bg-surface p-4 ring-1 ring-outline-variant">
              Nuevo proveedor agregado: InforTech S.A.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
