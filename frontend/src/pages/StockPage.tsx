import { useEffect, useState } from "react";
import { productsApi } from "@/services/api";
import type { ProductVariant } from "@/types";

interface VariantRow extends ProductVariant {
  productName: string;
  status: "Crítico" | "Bajo" | "Estable";
}

function getStatus(stock: number, reorder: number): "Crítico" | "Bajo" | "Estable" {
  if (stock <= reorder / 2) return "Crítico";
  if (stock <= reorder) return "Bajo";
  return "Estable";
}

const statusOrder = { Crítico: 0, Bajo: 1, Estable: 2 };

export default function StockPage() {
  const [rows, setRows] = useState<VariantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"Todos" | "Crítico" | "Bajo" | "Estable">("Todos");

  useEffect(() => {
    (async () => {
      try {
        const products = await productsApi.list();
        const flat: VariantRow[] = products.flatMap((p) =>
          p.variants.map((v) => ({
            ...v,
            productName: p.name,
            status: getStatus(v.current_stock ?? 0, v.reorder_point),
          }))
        );
        flat.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        setRows(flat);
      } catch {
        setError("Error al cargar el inventario.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = filter === "Todos" ? rows : rows.filter((r) => r.status === filter);
  const counts = {
    Crítico: rows.filter((r) => r.status === "Crítico").length,
    Bajo: rows.filter((r) => r.status === "Bajo").length,
    Estable: rows.filter((r) => r.status === "Estable").length,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Stock</p>
        <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">Estado actual de inventario</h1>
        {!loading && (
          <p className="mt-1 text-sm text-on-surface-variant">
            {rows.length} variantes · {counts.Crítico} críticas · {counts.Bajo} bajas · {counts.Estable} estables
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {(["Todos", "Crítico", "Bajo", "Estable"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === f
                  ? "bg-primary text-on-primary"
                  : "bg-surface text-on-surface-variant ring-1 ring-outline-variant hover:bg-surface-container-highest"
              }`}
            >
              {f}
              {f !== "Todos" && ` (${counts[f]})`}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-error-container/80 p-4 text-sm text-on-error-container">{error}</div>
      )}

      {loading ? (
        <div className="rounded-3xl bg-surface p-8 text-center text-on-surface-variant ring-1 ring-outline-variant">
          Cargando inventario...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-surface p-8 text-center text-on-surface-variant ring-1 ring-outline-variant">
          No hay variantes con ese estado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
                    {item.productName}
                  </p>
                  <p className="mt-1 font-mono text-sm text-on-surface-variant">{item.sku}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  item.status === "Crítico"
                    ? "bg-error text-on-error"
                    : item.status === "Bajo"
                    ? "bg-secondary-container text-secondary"
                    : "bg-primary-container text-on-primary-container"
                }`}>
                  {item.status}
                </span>
              </div>
              <p className="mt-4 text-headline-md font-semibold text-on-surface">
                {item.current_stock ?? 0} unidades
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Punto de reorden: {item.reorder_point} u.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
