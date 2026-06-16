import { useState, useEffect } from "react";
import { productsApi, stockApi, salesApi } from "../services/api";
import type { Product, StockSummary, Sale } from "../types";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockSummary[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productsApi.list(), stockApi.lowStockAlerts(), salesApi.list()])
      .then(([p, a, s]) => {
        setProducts(p);
        setAlerts(a);
        setSales(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeProducts = products.filter((p) => p.is_active);
  const totalSkuStock = activeProducts
    .flatMap((p) => p.variants.filter((v) => v.is_active))
    .reduce((sum, v) => sum + (v.current_stock ?? 0), 0);
  const activeSales = sales.filter((s) => !s.is_cancelled);
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: "Productos activos",
      value: loading ? "—" : String(activeProducts.length),
      icon: "inventory_2",
    },
    {
      label: "SKUs en stock",
      value: loading ? "—" : totalSkuStock.toLocaleString("es-AR"),
      icon: "warehouse",
    },
    {
      label: "Alertas de stock",
      value: loading ? "—" : String(alerts.length),
      icon: "warning",
      highlight: alerts.length > 0,
    },
    {
      label: "Ventas registradas",
      value: loading ? "—" : String(activeSales.length),
      icon: "shopping_cart",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label-md font-semibold uppercase tracking-[0.18em] text-primary-container">
              Bienvenido
            </p>
            <h1 className="mt-3 text-headline-lg font-bold text-on-surface">
              Panel principal
            </h1>
          </div>
          <div className="rounded-3xl bg-primary-container/10 px-5 py-3 text-primary-container">
            Estado: conectado
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-3xl p-5 shadow-soft-bloom-shadow ring-1 ${
                stat.highlight
                  ? "bg-error/10 ring-error/30"
                  : "bg-surface ring-outline-variant"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
                  {stat.label}
                </p>
                <span
                  className={`material-symbols-outlined text-xl ${
                    stat.highlight ? "text-error" : "text-on-surface-variant"
                  }`}
                >
                  {stat.icon}
                </span>
              </div>
              <p
                className={`mt-4 text-headline-lg font-semibold ${
                  stat.highlight ? "text-error" : "text-on-surface"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Alertas de stock bajo</h2>
          {loading ? (
            <p className="mt-4 text-body-md text-on-surface-variant">Cargando...</p>
          ) : alerts.length === 0 ? (
            <p className="mt-4 text-body-md text-on-surface-variant">
              ✅ Sin alertas activas — todos los SKUs están sobre el punto de reorden.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {alerts.slice(0, 6).map((alert) => (
                <li
                  key={alert.variant_id}
                  className="flex items-center justify-between rounded-3xl bg-error/10 px-4 py-3 ring-1 ring-error/20"
                >
                  <span className="font-mono text-sm text-on-surface">{alert.variant_sku}</span>
                  <span className="text-sm font-semibold text-error">
                    {alert.current_stock} / {alert.reorder_point} u.
                  </span>
                </li>
              ))}
              {alerts.length > 6 && (
                <p className="pt-1 text-sm text-on-surface-variant">
                  +{alerts.length - 6} más en la página de Stock.
                </p>
              )}
            </ul>
          )}
        </div>

        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Últimas ventas</h2>
          {loading ? (
            <p className="mt-4 text-body-md text-on-surface-variant">Cargando...</p>
          ) : recentSales.length === 0 ? (
            <p className="mt-4 text-body-md text-on-surface-variant">
              No hay ventas registradas aún.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentSales.map((sale) => {
                const totalItems = sale.items.reduce((s, i) => s + i.quantity, 0);
                const totalValue = sale.items.reduce(
                  (s, i) => s + Number(i.unit_price) * i.quantity,
                  0
                );
                const date = new Date(sale.created_at).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                });
                return (
                  <li
                    key={sale.id}
                    className="rounded-3xl bg-surface p-4 ring-1 ring-outline-variant"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-on-surface">
                          Venta #{sale.id}
                          {sale.client_name && (
                            <span className="ml-2 text-on-surface-variant">— {sale.client_name}</span>
                          )}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {date} · {totalItems} {totalItems === 1 ? "ítem" : "ítems"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-on-surface">
                        ${totalValue.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
