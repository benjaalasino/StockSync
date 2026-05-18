import { useProducts } from "@/hooks/useProducts";
import { useLowStockAlerts } from "@/hooks/useStock";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCurrency } from "@/lib/format";

export default function ReportsPage() {
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: alerts, isLoading: loadingAlerts } = useLowStockAlerts();

  const totalVariants = products?.reduce((a, p) => a + p.variants.length, 0) ?? 0;
  const totalStock = products?.reduce((a, p) => a + p.variants.reduce((b, v) => b + v.current_stock, 0), 0) ?? 0;
  const zeroStock = products?.flatMap((p) => p.variants).filter((v) => v.current_stock === 0) ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Reportes</p>
        <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">Información de rendimiento</h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Resumen de indicadores clave del inventario.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resumen general */}
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant space-y-4">
          <h2 className="text-headline-md font-semibold text-on-surface">Resumen general</h2>
          {loadingProducts ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3">
              {[
                { label: "Productos", value: products?.length ?? 0 },
                { label: "Variantes (SKUs)", value: totalVariants },
                { label: "Unidades totales", value: totalStock.toLocaleString("es-AR") },
                { label: "Sin stock", value: zeroStock.length, highlight: zeroStock.length > 0 },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-center rounded-2xl bg-surface-container px-4 py-3">
                  <span className="text-body-sm text-on-surface-variant">{label}</span>
                  <span className={`font-semibold text-body-md ${highlight ? "text-error" : "text-on-surface"}`}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas de reorden */}
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant space-y-4">
          <h2 className="text-headline-md font-semibold text-on-surface">
            Alertas de reorden
            {(alerts?.length ?? 0) > 0 && (
              <span className="ml-2 rounded-full bg-error px-2 py-0.5 text-xs text-on-error">{alerts!.length}</span>
            )}
          </h2>
          {loadingAlerts ? (
            <LoadingSpinner />
          ) : !alerts?.length ? (
            <div className="flex items-center gap-3 rounded-2xl bg-primary-container/10 p-4">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              <p className="text-body-sm text-on-surface">Todo el inventario está sobre el punto de reorden.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.map((a) => (
                <div key={a.variant_id} className="flex items-center justify-between rounded-2xl bg-error-container/40 p-3 text-body-sm">
                  <div>
                    <p className="font-mono font-semibold text-on-surface">{a.variant_sku}</p>
                    <p className="text-on-surface-variant">Reorden: {a.reorder_point}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.current_stock === 0 ? "bg-error text-on-error" : "bg-secondary-container text-on-surface"}`}>
                    {a.current_stock} u.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SKUs sin stock */}
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant space-y-4">
          <h2 className="text-headline-md font-semibold text-on-surface">SKUs sin stock</h2>
          {loadingProducts ? (
            <LoadingSpinner />
          ) : !zeroStock.length ? (
            <div className="flex items-center gap-3 rounded-2xl bg-primary-container/10 p-4">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              <p className="text-body-sm text-on-surface">Ningún SKU tiene stock en cero.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {zeroStock.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-2xl bg-error-container/40 p-3 text-body-sm">
                  <p className="font-mono text-on-surface">{v.sku}</p>
                  <span className="text-body-sm text-on-surface-variant">{formatCurrency(v.sale_price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
