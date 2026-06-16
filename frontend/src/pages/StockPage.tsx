import { useState, useEffect } from "react";
import { productsApi, stockApi } from "../services/api";
import type { Product, ProductVariant, StockMovement, User } from "../types";

type Tab = "todos" | "bajo";

type FlatVariant = ProductVariant & { productName: string; productBrand: string | null };

function stockStatus(stock: number, reorderPoint: number): {
  label: string;
  cls: string;
} {
  if (stock === 0) return { label: "Agotado", cls: "bg-error text-on-error" };
  if (stock <= reorderPoint) return { label: "Crítico", cls: "bg-error/80 text-on-error" };
  if (stock <= reorderPoint * 2) return { label: "Bajo", cls: "bg-secondary-container text-secondary" };
  return { label: "Estable", cls: "bg-primary-container text-on-primary-container" };
}

const MOVEMENT_LABELS: Record<string, string> = {
  PURCHASE: "Compra",
  SALE: "Venta",
  ADJUSTMENT_IN: "Ajuste (+)",
  ADJUSTMENT_OUT: "Ajuste (−)",
  RETURN_IN: "Dev. entrada",
  RETURN_OUT: "Dev. salida",
};

export default function StockPage({ user }: { user: User | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("todos");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [movements, setMovements] = useState<Record<number, StockMovement[]>>({});
  const [loadingMovements, setLoadingMovements] = useState<Record<number, boolean>>({});
  const [adjustModal, setAdjustModal] = useState<FlatVariant | null>(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: "", notes: "" });
  const [adjusting, setAdjusting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = () => {
    setLoading(true);
    productsApi
      .list()
      .then(setProducts)
      .catch(() => setError("Error al cargar el inventario"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const flatVariants: FlatVariant[] = products
    .filter((p) => p.is_active)
    .flatMap((p) =>
      p.variants
        .filter((v) => v.is_active)
        .map((v) => ({ ...v, productName: p.name, productBrand: p.brand }))
    );

  const displayed =
    tab === "bajo"
      ? flatVariants.filter((v) => v.current_stock <= v.reorder_point)
      : flatVariants;

  const toggleKardex = async (variantId: number) => {
    if (expandedId === variantId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(variantId);
    if (!movements[variantId]) {
      setLoadingMovements((prev) => ({ ...prev, [variantId]: true }));
      try {
        const data = await stockApi.movements(variantId);
        setMovements((prev) => ({ ...prev, [variantId]: data }));
      } catch {
        showToast("Error al cargar el Kardex", "error");
      } finally {
        setLoadingMovements((prev) => ({ ...prev, [variantId]: false }));
      }
    }
  };

  const openAdjust = (variant: FlatVariant) => {
    setAdjustModal(variant);
    setAdjustForm({ quantity: "", notes: "" });
  };

  const handleAdjust = async () => {
    if (!adjustModal) return;
    const qty = Number(adjustForm.quantity);
    if (!qty || isNaN(qty)) {
      showToast("Ingresá una cantidad válida (positiva = entrada, negativa = salida)", "error");
      return;
    }
    setAdjusting(true);
    try {
      await stockApi.adjust({
        variant_id: adjustModal.id,
        quantity: qty,
        notes: adjustForm.notes || "Ajuste manual",
      });
      showToast(`Stock ajustado en ${qty > 0 ? "+" : ""}${qty} unidades`, "success");
      setAdjustModal(null);
      // Invalidate cached movements so Kardex reloads
      setMovements((prev) => {
        const next = { ...prev };
        delete next[adjustModal.id];
        return next;
      });
      fetchProducts();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al ajustar stock", "error");
    } finally {
      setAdjusting(false);
    }
  };

  const isAdmin = user?.role === "admin";

  if (loading)
    return <div className="p-6 text-on-surface-variant">Cargando inventario...</div>;
  if (error)
    return <div className="p-6 text-error">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-3xl px-6 py-4 text-sm font-semibold shadow-soft-bloom-shadow ${
            toast.type === "success"
              ? "bg-primary-container text-on-primary-container"
              : "bg-error text-on-error"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Stock</p>
            <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">
              Estado actual de inventario
            </h1>
            <p className="mt-2 text-body-md text-on-surface-variant">
              {flatVariants.length} SKUs activos ·{" "}
              {flatVariants.filter((v) => v.current_stock <= v.reorder_point).length} con stock bajo
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setAdjustModal(flatVariants[0] ?? null)}
              className="shrink-0 rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-container"
            >
              + Ajustar stock
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          {(["todos", "bajo"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                tab === t
                  ? "bg-primary text-on-primary"
                  : "bg-surface text-on-surface-variant ring-1 ring-outline-variant hover:bg-surface-variant"
              }`}
            >
              {t === "todos" ? `Todos (${flatVariants.length})` : `Stock bajo (${flatVariants.filter((v) => v.current_stock <= v.reorder_point).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Variant table */}
      {displayed.length === 0 ? (
        <div className="rounded-3xl bg-surface p-8 text-center text-on-surface-variant ring-1 ring-outline-variant">
          {tab === "bajo" ? "No hay SKUs con stock bajo. ¡Todo bien!" : "No hay variantes activas."}
        </div>
      ) : (
        <div className="rounded-[28px] bg-surface-container-lowest shadow-soft-bloom-shadow ring-1 ring-outline-variant overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-outline-variant bg-surface">
              <tr className="text-left text-on-surface-variant text-xs uppercase tracking-[0.12em]">
                <th className="px-5 py-3 font-semibold">SKU</th>
                <th className="px-5 py-3 font-semibold">Producto</th>
                <th className="px-5 py-3 font-semibold">Atributos</th>
                <th className="px-5 py-3 text-right font-semibold">Stock</th>
                <th className="px-5 py-3 text-right font-semibold">Reorden</th>
                <th className="px-5 py-3 text-center font-semibold">Estado</th>
                <th className="px-5 py-3 text-center font-semibold">Kardex</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {displayed.map((variant) => {
                const { label, cls } = stockStatus(variant.current_stock, variant.reorder_point);
                const isExpanded = expandedId === variant.id;
                const varMovements = movements[variant.id] ?? [];
                const isLoadingKardex = loadingMovements[variant.id];

                return (
                  <>
                    <tr
                      key={variant.id}
                      className="hover:bg-surface/60 transition"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-on-surface-variant">
                        {variant.sku}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-on-surface">{variant.productName}</p>
                        {variant.productBrand && (
                          <p className="text-xs text-on-surface-variant">{variant.productBrand}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-on-surface-variant">
                        {variant.attribute_values?.map((av) => av.value).join(" · ") || "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-on-surface">
                        {variant.current_stock}
                      </td>
                      <td className="px-5 py-3 text-right text-on-surface-variant">
                        {variant.reorder_point}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleKardex(variant.id)}
                            className="rounded-2xl bg-surface px-3 py-1.5 text-xs font-semibold text-on-surface ring-1 ring-outline-variant transition hover:bg-primary hover:text-on-primary"
                          >
                            {isExpanded ? "Cerrar" : "Ver"}
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => openAdjust(variant)}
                              className="rounded-2xl bg-surface px-3 py-1.5 text-xs font-semibold text-on-surface ring-1 ring-outline-variant transition hover:bg-secondary-container"
                              title="Ajustar stock"
                            >
                              Ajustar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`kardex-${variant.id}`}>
                        <td colSpan={7} className="bg-surface/50 px-5 py-4">
                          {isLoadingKardex ? (
                            <p className="text-sm text-on-surface-variant">Cargando Kardex...</p>
                          ) : varMovements.length === 0 ? (
                            <p className="text-sm text-on-surface-variant">Sin movimientos registrados.</p>
                          ) : (
                            <div className="rounded-2xl overflow-hidden ring-1 ring-outline-variant">
                              <table className="w-full text-xs">
                                <thead className="bg-surface">
                                  <tr className="text-on-surface-variant uppercase tracking-[0.1em]">
                                    <th className="px-4 py-2 text-left font-semibold">Fecha</th>
                                    <th className="px-4 py-2 text-left font-semibold">Tipo</th>
                                    <th className="px-4 py-2 text-right font-semibold">Cantidad</th>
                                    <th className="px-4 py-2 text-left font-semibold">Notas</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/30">
                                  {varMovements.map((m) => (
                                    <tr key={m.id} className="hover:bg-surface/60">
                                      <td className="px-4 py-2 text-on-surface-variant">
                                        {new Date(m.created_at).toLocaleDateString("es-AR", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "2-digit",
                                        })}
                                      </td>
                                      <td className="px-4 py-2 text-on-surface">
                                        {MOVEMENT_LABELS[m.movement_type] ?? m.movement_type}
                                      </td>
                                      <td
                                        className={`px-4 py-2 text-right font-semibold ${
                                          m.quantity > 0 ? "text-primary-container" : "text-error"
                                        }`}
                                      >
                                        {m.quantity > 0 ? "+" : ""}
                                        {m.quantity}
                                      </td>
                                      <td className="px-4 py-2 text-on-surface-variant">
                                        {m.notes ?? "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjustment modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-surface p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
            <h2 className="text-headline-md font-semibold text-on-surface">Ajustar stock</h2>
            <p className="mt-1 text-sm text-on-surface-variant font-mono">{adjustModal.sku}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Stock actual: <strong>{adjustModal.current_stock}</strong> u.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-label-sm uppercase tracking-[0.15em] text-on-surface-variant">
                  Cantidad
                </label>
                <input
                  type="number"
                  placeholder="Positivo = entrada · Negativo = salida"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="mt-2 w-full rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface ring-1 ring-outline-variant focus:outline-none focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-label-sm uppercase tracking-[0.15em] text-on-surface-variant">
                  Motivo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ajuste por conteo físico"
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, notes: e.target.value }))}
                  className="mt-2 w-full rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface ring-1 ring-outline-variant focus:outline-none focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setAdjustModal(null)}
                className="flex-1 rounded-3xl bg-surface px-4 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant transition hover:bg-surface-variant"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdjust}
                disabled={adjusting}
                className="flex-1 rounded-3xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-container disabled:opacity-50"
              >
                {adjusting ? "Ajustando..." : "Confirmar ajuste"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
