import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useLowStockAlerts, useAdjustStock, useMovements } from "@/hooks/useStock";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/auth/AuthContext";
import { formatDate, formatCurrency } from "@/lib/format";
import type { ProductVariant } from "@/types";

function AdjustModal({
  variant,
  onClose,
}: {
  variant: ProductVariant | null;
  onClose: () => void;
}) {
  const adjust = useAdjustStock();
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant) return;
    await adjust.mutateAsync({
      variant_id: variant.id,
      quantity: parseInt(quantity),
      notes,
    });
    onClose();
    setQuantity("");
    setNotes("");
  };

  return (
    <Modal open={!!variant} onClose={onClose} title="Ajustar stock">
      {variant && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl bg-surface-container p-4">
            <p className="text-label-sm text-on-surface-variant">Variante</p>
            <p className="mt-1 font-mono font-semibold text-on-surface">{variant.sku}</p>
            <p className="text-body-sm text-on-surface-variant">Stock actual: {variant.current_stock} unidades</p>
          </div>
          <div>
            <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">
              Cantidad <span className="text-on-surface-variant/60">(positivo = entrada, negativo = salida)</span>
            </label>
            <input
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="ej: 10 o -5"
              className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Motivo *</label>
            <input
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ej: Inventario físico, merma, etc."
              className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-outline-variant py-3 text-body-md font-semibold text-on-surface-variant hover:bg-surface-variant transition">
              Cancelar
            </button>
            <button type="submit" disabled={adjust.isPending} className="flex-1 rounded-2xl bg-primary py-3 text-body-md font-semibold text-on-primary hover:opacity-90 transition disabled:opacity-60">
              {adjust.isPending ? "Ajustando..." : "Confirmar ajuste"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function KardexModal({ variant, onClose }: { variant: ProductVariant | null; onClose: () => void }) {
  const { data: movements, isLoading } = useMovements(variant?.id ?? 0);

  const typeLabel: Record<string, string> = {
    PURCHASE: "Compra",
    SALE: "Venta",
    ADJUSTMENT_IN: "Ajuste +",
    ADJUSTMENT_OUT: "Ajuste −",
    RETURN_IN: "Dev. entrada",
    RETURN_OUT: "Dev. salida",
  };

  return (
    <Modal open={!!variant} onClose={onClose} title={`Kardex — ${variant?.sku}`} maxWidth="max-w-2xl">
      {isLoading ? (
        <LoadingSpinner />
      ) : !movements?.length ? (
        <EmptyState icon="receipt_long" title="Sin movimientos" description="Esta variante no tiene movimientos registrados." />
      ) : (
        <div className="overflow-auto max-h-96 space-y-2">
          {movements.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-2xl bg-surface-container p-3 text-body-sm">
              <div className="min-w-0">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold mr-2 ${
                  m.quantity > 0 ? "bg-primary-container text-on-primary-container" : "bg-error-container text-on-error-container"
                }`}>
                  {typeLabel[m.movement_type] ?? m.movement_type}
                </span>
                {m.notes && <span className="text-on-surface-variant truncate">{m.notes}</span>}
              </div>
              <div className="flex-shrink-0 text-right">
                <p className={`font-semibold ${m.quantity > 0 ? "text-primary" : "text-error"}`}>
                  {m.quantity > 0 ? "+" : ""}{m.quantity} u.
                </p>
                <p className="text-on-surface-variant text-xs">{formatDate(m.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function StockPage() {
  const { isAdmin } = useAuth();
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: alerts, isLoading: loadingAlerts } = useLowStockAlerts();
  const [adjustVariant, setAdjustVariant] = useState<ProductVariant | null>(null);
  const [kardexVariant, setKardexVariant] = useState<ProductVariant | null>(null);
  const [search, setSearch] = useState("");

  const allVariants = products?.flatMap((p) => p.variants.map((v) => ({ ...v, productName: p.name }))) ?? [];
  const filtered = allVariants.filter(
    (v) =>
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      (v as any).productName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Stock</p>
        <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">Estado actual de inventario</h1>

        {/* Alertas banner */}
        {!loadingAlerts && (alerts?.length ?? 0) > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-error-container/60 px-5 py-3">
            <span className="material-symbols-outlined text-error">warning</span>
            <p className="text-body-sm font-medium text-on-surface">
              {alerts!.length} variante{alerts!.length > 1 ? "s" : ""} por debajo del punto de reorden.
            </p>
          </div>
        )}

        <div className="mt-5 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU o producto..."
            className="w-full rounded-2xl border border-outline-variant bg-surface py-3 pl-12 pr-4 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Tabla de variantes */}
      {loadingProducts ? (
        <LoadingSpinner label="Cargando inventario..." />
      ) : !filtered.length ? (
        <EmptyState icon="warehouse" title="Sin resultados" description={search ? `No se encontró "${search}"` : "No hay variantes en el sistema."} />
      ) : (
        <div className="rounded-[28px] bg-surface-container-lowest shadow-soft-bloom-shadow ring-1 ring-outline-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface">
                  <th className="py-4 px-6 text-left text-label-sm uppercase tracking-[0.15em] text-on-surface-variant">SKU</th>
                  <th className="py-4 px-6 text-left text-label-sm uppercase tracking-[0.15em] text-on-surface-variant hidden sm:table-cell">Producto</th>
                  <th className="py-4 px-6 text-right text-label-sm uppercase tracking-[0.15em] text-on-surface-variant">Stock</th>
                  <th className="py-4 px-6 text-right text-label-sm uppercase tracking-[0.15em] text-on-surface-variant hidden md:table-cell">Reorden</th>
                  <th className="py-4 px-6 text-right text-label-sm uppercase tracking-[0.15em] text-on-surface-variant hidden lg:table-cell">Precio</th>
                  <th className="py-4 px-6 text-right text-label-sm uppercase tracking-[0.15em] text-on-surface-variant">Estado</th>
                  <th className="py-4 px-6 text-right text-label-sm uppercase tracking-[0.15em] text-on-surface-variant">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((v) => {
                  const isCritical = v.current_stock === 0;
                  const isLow = !isCritical && v.current_stock <= v.reorder_point;
                  const status = isCritical ? "Crítico" : isLow ? "Bajo" : "OK";
                  return (
                    <tr key={v.id} className="hover:bg-surface-container transition">
                      <td className="py-4 px-6 font-mono text-body-sm text-on-surface">{v.sku}</td>
                      <td className="py-4 px-6 text-body-sm text-on-surface-variant hidden sm:table-cell">{(v as any).productName}</td>
                      <td className="py-4 px-6 text-right font-semibold text-on-surface">{v.current_stock}</td>
                      <td className="py-4 px-6 text-right text-on-surface-variant hidden md:table-cell">{v.reorder_point}</td>
                      <td className="py-4 px-6 text-right text-on-surface-variant hidden lg:table-cell">{formatCurrency(v.sale_price)}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isCritical ? "bg-error text-on-error" :
                          isLow ? "bg-secondary-container text-on-surface" :
                          "bg-primary-container/40 text-on-primary-container"
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setKardexVariant(v)}
                            className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-container transition"
                            title="Ver kardex"
                          >
                            <span className="material-symbols-outlined text-base">receipt_long</span>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setAdjustVariant(v)}
                              className="rounded-xl p-2 text-primary hover:bg-primary-container/20 transition"
                              title="Ajustar stock"
                            >
                              <span className="material-symbols-outlined text-base">tune</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdjustModal variant={adjustVariant} onClose={() => setAdjustVariant(null)} />
      <KardexModal variant={kardexVariant} onClose={() => setKardexVariant(null)} />
    </div>
  );
}
