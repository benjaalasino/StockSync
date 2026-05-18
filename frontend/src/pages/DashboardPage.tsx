import { useProducts } from "@/hooks/useProducts";
import { useLowStockAlerts } from "@/hooks/useStock";
import { useSuppliers } from "@/hooks/useSuppliers";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function DashboardPage() {
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: alerts, isLoading: loadingAlerts } = useLowStockAlerts();
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();

  const totalVariants = products?.reduce((acc, p) => acc + p.variants.length, 0) ?? 0;
  const totalStock = products?.reduce(
    (acc, p) => acc + p.variants.reduce((v, variant) => v + variant.current_stock, 0),
    0
  ) ?? 0;

  const isLoading = loadingProducts || loadingAlerts || loadingSuppliers;

  const metrics = [
    {
      label: "Productos activos",
      value: isLoading ? "—" : (products?.length ?? 0).toString(),
      icon: "inventory_2",
      sub: `${totalVariants} variantes`,
    },
    {
      label: "Stock total",
      value: isLoading ? "—" : totalStock.toLocaleString("es-AR"),
      icon: "warehouse",
      sub: "unidades en inventario",
    },
    {
      label: "Proveedores",
      value: isLoading ? "—" : (suppliers?.length ?? 0).toString(),
      icon: "local_shipping",
      sub: "activos",
    },
    {
      label: "Alertas de stock",
      value: isLoading ? "—" : (alerts?.length ?? 0).toString(),
      icon: "warning",
      highlight: (alerts?.length ?? 0) > 0,
      sub: "bajo punto de reorden",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label-md font-semibold uppercase tracking-[0.18em] text-primary-container">Bienvenido</p>
            <h1 className="mt-2 text-headline-lg font-bold text-on-surface">Panel principal</h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-3xl bg-primary-container/20 px-4 py-2 text-body-sm text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Sistema en línea
          </span>
        </div>

        {/* Métricas */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={`rounded-3xl p-5 ring-1 ${
                m.highlight
                  ? "bg-error-container ring-error/30"
                  : "bg-surface shadow-soft-bloom-shadow ring-outline-variant"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">{m.label}</p>
                <span className={`material-symbols-outlined text-xl ${m.highlight ? "text-error" : "text-on-surface-variant/50"}`}>
                  {m.icon}
                </span>
              </div>
              <p className={`mt-4 text-headline-lg font-semibold ${m.highlight ? "text-error" : "text-on-surface"}`}>
                {m.value}
              </p>
              <p className="mt-1 text-body-sm text-on-surface-variant">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Productos recientes */}
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Productos recientes</h2>
          {loadingProducts ? (
            <LoadingSpinner label="Cargando productos..." />
          ) : !products?.length ? (
            <p className="mt-4 text-body-sm text-on-surface-variant">No hay productos cargados aún.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {products.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-2xl bg-surface p-4 ring-1 ring-outline-variant">
                  <div>
                    <p className="font-medium text-on-surface text-body-sm">{p.name}</p>
                    <p className="text-body-sm text-on-surface-variant">{p.base_sku} · {p.variants.length} vars.</p>
                  </div>
                  <span className="text-body-sm font-semibold text-primary">
                    {p.variants.reduce((a, v) => a + v.current_stock, 0)} u.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Alertas de stock bajo */}
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Alertas de stock bajo</h2>
          {loadingAlerts ? (
            <LoadingSpinner label="Verificando stock..." />
          ) : !alerts?.length ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary-container/10 p-4">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              <p className="text-body-sm text-on-surface">Todo el inventario está sobre el punto de reorden.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {alerts.slice(0, 6).map((a) => (
                <li key={a.variant_id} className="flex items-center justify-between rounded-2xl bg-error-container/50 p-4 ring-1 ring-error/20">
                  <div>
                    <p className="font-medium text-on-surface text-body-sm">{a.variant_sku}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      Reorden: {a.reorder_point} u.
                    </p>
                  </div>
                  <span className="rounded-full bg-error px-3 py-1 text-xs font-semibold text-on-error">
                    {a.current_stock} u.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
