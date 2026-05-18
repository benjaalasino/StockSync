import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useCreateSale } from "@/hooks/useSales";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCurrency, parseDecimal } from "@/lib/format";
import type { ProductVariant, SaleCreatePayload } from "@/types";
import toast from "react-hot-toast";

interface SaleLineItem {
  variant: ProductVariant;
  productName: string;
  quantity: number;
}

export default function SalesPage() {
  const { data: products, isLoading } = useProducts();
  const createSale = useCreateSale();

  const [lines, setLines] = useState<SaleLineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [selectedVariantId, setSelectedVariantId] = useState<number | "">("");
  const [qtyInput, setQtyInput] = useState("1");

  const selectedProduct = products?.find((p) => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find((v) => v.id === selectedVariantId);

  const addLine = () => {
    if (!selectedVariant || !selectedProduct) return;
    const qty = parseInt(qtyInput);
    if (!qty || qty <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    if (qty > selectedVariant.current_stock) {
      toast.error(`Stock insuficiente. Disponible: ${selectedVariant.current_stock}`);
      return;
    }
    const existing = lines.find((l) => l.variant.id === selectedVariant.id);
    if (existing) {
      setLines(lines.map((l) =>
        l.variant.id === selectedVariant.id
          ? { ...l, quantity: l.quantity + qty }
          : l
      ));
    } else {
      setLines([...lines, { variant: selectedVariant, productName: selectedProduct.name, quantity: qty }]);
    }
    setSelectedVariantId("");
    setQtyInput("1");
  };

  const removeLine = (variantId: number) => {
    setLines(lines.filter((l) => l.variant.id !== variantId));
  };

  const total = lines.reduce((acc, l) => acc + parseDecimal(l.variant.sale_price) * l.quantity, 0);

  const handleSubmit = async () => {
    if (!lines.length) {
      toast.error("Agregá al menos un producto");
      return;
    }
    const payload: SaleCreatePayload = {
      items: lines.map((l) => ({ variant_id: l.variant.id, quantity: l.quantity })),
      notes: notes || null,
    };
    await createSale.mutateAsync(payload);
    setLines([]);
    setNotes("");
    setSelectedProductId("");
    setSelectedVariantId("");
  };

  if (isLoading) return <LoadingSpinner label="Cargando productos..." />;

  const activeProducts = products?.filter((p) => p.variants.some((v) => v.current_stock > 0)) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Ventas</p>
        <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">Registrar venta</h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Seleccioná los productos, cantidades y confirmá la venta. El stock se descuenta automáticamente.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Selector de ítems */}
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant space-y-6">
          <h2 className="text-headline-md font-semibold text-on-surface">Agregar ítems</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Producto</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value ? parseInt(e.target.value) : "");
                  setSelectedVariantId("");
                }}
                className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-sm text-on-surface outline-none focus:border-primary"
              >
                <option value="">Seleccionar...</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Variante</label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value ? parseInt(e.target.value) : "")}
                disabled={!selectedProduct}
                className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-sm text-on-surface outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">Seleccionar...</option>
                {selectedProduct?.variants
                  .filter((v) => v.current_stock > 0)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.sku} ({v.current_stock} disp.)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Cantidad</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={selectedVariant?.current_stock}
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  className="flex-1 rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-sm text-on-surface outline-none focus:border-primary"
                />
                <button
                  onClick={addLine}
                  disabled={!selectedVariant}
                  className="rounded-2xl bg-primary px-4 py-3 text-on-primary hover:opacity-90 transition disabled:opacity-40"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>

          {selectedVariant && (
            <div className="rounded-2xl bg-primary-container/20 px-4 py-3 text-body-sm text-on-surface">
              Precio unitario: <span className="font-semibold">{formatCurrency(selectedVariant.sale_price)}</span>
              {" · "}Stock disponible: <span className="font-semibold">{selectedVariant.current_stock} u.</span>
            </div>
          )}

          {/* Lista de ítems */}
          {lines.length > 0 && (
            <div className="space-y-2">
              <p className="text-label-md font-medium text-on-surface-variant uppercase tracking-wider">Ítems de la venta</p>
              {lines.map((line) => (
                <div key={line.variant.id} className="flex items-center justify-between rounded-2xl bg-surface-container p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-on-surface text-body-sm">{line.productName}</p>
                    <p className="font-mono text-body-sm text-on-surface-variant">{line.variant.sku}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-body-sm text-on-surface-variant">{line.quantity} × {formatCurrency(line.variant.sale_price)}</p>
                      <p className="font-semibold text-on-surface">{formatCurrency(parseDecimal(line.variant.sale_price) * line.quantity)}</p>
                    </div>
                    <button onClick={() => removeLine(line.variant.id)} className="rounded-xl p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container transition">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen y confirmación */}
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant h-fit space-y-6">
          <h2 className="text-headline-md font-semibold text-on-surface">Resumen</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-body-sm">
              <span className="text-on-surface-variant">Ítems</span>
              <span className="text-on-surface">{lines.length}</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-on-surface-variant">Unidades</span>
              <span className="text-on-surface">{lines.reduce((a, l) => a + l.quantity, 0)}</span>
            </div>
            <div className="border-t border-outline-variant pt-3 flex justify-between">
              <span className="font-semibold text-on-surface">Total</span>
              <span className="font-bold text-headline-md text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div>
            <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Observaciones</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notas opcionales..."
              className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-sm text-on-surface outline-none focus:border-primary resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={createSale.isPending || lines.length === 0}
            className="w-full rounded-2xl bg-primary py-4 text-body-md font-semibold text-on-primary hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createSale.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Procesando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">point_of_sale</span>
                Confirmar venta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
