import { useEffect, useState } from "react";
import { productsApi, stockApi, suppliersApi } from "@/services/api";
import type { Product, StockSummary, Supplier } from "@/types";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [alerts, setAlerts] = useState<StockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [prods, sups, alts] = await Promise.all([
          productsApi.list(),
          suppliersApi.list(),
          stockApi.lowStockAlerts(),
        ]);
        setProducts(prods);
        setSuppliers(sups);
        setAlerts(alts);
      } catch {
        setError("Error al cargar datos del dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalStock = products.reduce(
    (acc, p) => acc + p.variants.reduce((a, v) => a + (v.current_stock ?? 0), 0),
    0
  );

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label-md font-semibold uppercase tracking-[0.18em] text-primary-container">Bienvenido</p>
            <h1 className="mt-3 text-headline-lg font-bold text-on-surface">Panel principal</h1>
          </div>
          <div className="rounded-3xl bg-primary-container/10 px-5 py-3 text-primary-container">
            {loading ? "Cargando..." : "Estado: conectado"}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-error-container/80 p-4 text-sm text-on-error-container">{error}</div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-surface p-5 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">Productos activos</p>
            <p className="mt-4 text-headline-lg font-semibold text-on-surface">
              {loading ? "—" : products.filter((p) => p.is_active).length}
            </p>
          </div>
          <div className="rounded-3xl bg-surface p-5 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">Stock total</p>
            <p className="mt-4 text-headline-lg font-semibold text-on-surface">
              {loading ? "—" : totalStock.toLocaleString("es-AR")}
            </p>
          </div>
          <div className="rounded-3xl bg-surface p-5 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">Proveedores</p>
            <p className="mt-4 text-headline-lg font-semibold text-on-surface">
              {loading ? "—" : suppliers.length}
            </p>
          </div>
          <div className="rounded-3xl bg-surface p-5 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">Alertas de stock</p>
            <p className={`mt-4 text-headline-lg font-semibold ${alerts.length > 0 ? "text-error" : "text-on-surface"}`}>
              {loading ? "—" : alerts.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Productos recientes</h2>
          {loading ? (
            <p className="mt-4 text-body-md text-on-surface-variant">Cargando...</p>
          ) : products.length === 0 ? (
            <p className="mt-4 text-body-md text-on-surface-variant">No hay productos aún.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {products.slice(0, 4).map((p) => (
                <li key={p.id} className="rounded-3xl bg-surface p-4 ring-1 ring-outline-variant">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-on-surface">{p.name}</span>
                    <span className="text-sm text-on-surface-variant">{p.base_sku}</span>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {p.variants.length} variantes ·{" "}
                    {p.variants.reduce((a, v) => a + (v.current_stock ?? 0), 0)} u. en stock
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
          <h2 className="text-headline-md font-semibold text-on-surface">Alertas de stock bajo</h2>
          {loading ? (
            <p className="mt-4 text-body-md text-on-surface-variant">Cargando...</p>
          ) : alerts.length === 0 ? (
            <p className="mt-4 text-body-md text-on-surface-variant">Sin alertas activas. ¡Todo en orden!</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {alerts.slice(0, 5).map((a) => (
                <li key={a.variant_id} className="rounded-3xl bg-surface p-4 ring-1 ring-outline-variant">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-on-surface">{a.variant_sku}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      a.current_stock <= a.reorder_point / 2
                        ? "bg-error text-on-error"
                        : "bg-secondary-container text-secondary"
                    }`}>
                      {a.current_stock <= a.reorder_point / 2 ? "Crítico" : "Bajo"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {a.current_stock} u. disponibles · punto de reorden: {a.reorder_point}
                  </p>
                </li>
              ))}
              {alerts.length > 5 && (
                <p className="text-sm text-on-surface-variant text-center">+{alerts.length - 5} más en Stock</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
