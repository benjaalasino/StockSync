import { useState, useEffect } from "react";
import { salesApi, stockApi } from "../services/api";
import type { Sale, StockSummary } from "../types";

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [alerts, setAlerts] = useState<StockSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([salesApi.list(), stockApi.lowStockAlerts()])
      .then(([s, a]) => {
        setSales(s);
        setAlerts(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeSales = sales.filter((s) => !s.is_cancelled);

  // Total items sold across all sales
  const totalItemsSold = activeSales.reduce(
    (sum, s) => sum + s.items.reduce((ss, i) => ss + i.quantity, 0),
    0
  );

  // Total revenue
  const totalRevenue = activeSales.reduce(
    (sum, s) =>
      sum + s.items.reduce((ss, i) => ss + Number(i.unit_price) * i.quantity, 0),
    0
  );

  // Top 5 most-sold SKUs
  const skuSales: Record<number, { qty: number }> = {};
  for (const sale of activeSales) {
    for (const item of sale.items) {
      if (!skuSales[item.variant_id]) skuSales[item.variant_id] = { qty: 0 };
      skuSales[item.variant_id].qty += item.quantity;
    }
  }
  const topSkus = Object.entries(skuSales)
    .sort(([, a], [, b]) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Reportes</p>
        <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">
          Información de rendimiento
        </h1>
        <p className="mt-4 max-w-2xl text-body-md text-on-surface-variant">
          Datos reales de inventario, ventas y alertas para tomar decisiones rápidas.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Ventas */}
        <div className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Ventas</h2>
          {loading ? (
            <p className="mt-3 text-body-md text-on-surface-variant">Cargando...</p>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-surface-container-lowest px-4 py-3 ring-1 ring-outline-variant">
                <span className="text-sm text-on-surface-variant">Total ventas</span>
                <span className="font-semibold text-on-surface">{activeSales.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-surface-container-lowest px-4 py-3 ring-1 ring-outline-variant">
                <span className="text-sm text-on-surface-variant">Ítems vendidos</span>
                <span className="font-semibold text-on-surface">{totalItemsSold}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-primary-container/10 px-4 py-3 ring-1 ring-primary-container/20">
                <span className="text-sm text-on-surface-variant">Facturación total</span>
                <span className="font-semibold text-primary-container">
                  ${totalRevenue.toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rotación — top SKUs */}
        <div className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Top SKUs vendidos</h2>
          {loading ? (
            <p className="mt-3 text-body-md text-on-surface-variant">Cargando...</p>
          ) : topSkus.length === 0 ? (
            <p className="mt-3 text-body-md text-on-surface-variant">
              Sin ventas registradas.
            </p>
          ) : (
            <ol className="mt-4 space-y-2">
              {topSkus.map(([variantId, { qty }], idx) => (
                <li
                  key={variantId}
                  className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3 ring-1 ring-outline-variant"
                >
                  <span className="w-5 text-center text-xs font-bold text-on-surface-variant">
                    {idx + 1}
                  </span>
                  <span className="flex-1 font-mono text-xs text-on-surface">
                    Variante #{variantId}
                  </span>
                  <span className="text-sm font-semibold text-on-surface">{qty} u.</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Alertas de stock */}
        <div className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Alertas de stock</h2>
          {loading ? (
            <p className="mt-3 text-body-md text-on-surface-variant">Cargando...</p>
          ) : alerts.length === 0 ? (
            <p className="mt-3 text-body-md text-on-surface-variant">
              ✅ Sin alertas — todos los SKUs sobre el punto de reorden.
            </p>
          ) : (
            <div className="mt-4 space-y-2 max-h-[260px] overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.variant_id}
                  className="flex items-center justify-between rounded-2xl bg-error/10 px-4 py-2.5 ring-1 ring-error/20"
                >
                  <span className="font-mono text-xs text-on-surface">{alert.variant_sku}</span>
                  <span className="text-xs font-semibold text-error">
                    {alert.current_stock}/{alert.reorder_point}
                  </span>
                </div>
              ))}
            </div>
          )}
          {alerts.length > 0 && (
            <p className="mt-3 text-xs text-on-surface-variant">
              {alerts.length} SKU{alerts.length !== 1 ? "s" : ""} bajo el punto de reorden.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
