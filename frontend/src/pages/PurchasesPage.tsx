import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers, useCreateSupplier } from "@/hooks/useSuppliers";
import { useCreatePurchaseOrder, useReceivePurchaseOrder } from "@/hooks/usePurchases";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/auth/AuthContext";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PurchaseOrder, PurchaseOrderCreatePayload, SupplierCreatePayload } from "@/types";
import toast from "react-hot-toast";

interface OrderLine {
  variant_id: number;
  sku: string;
  productName: string;
  quantity: number;
  unit_cost: number;
}

function NewSupplierModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateSupplier();
  const [form, setForm] = useState<SupplierCreatePayload>({ name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync(form);
    onClose();
    setForm({ name: "" });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo proveedor">
      <form onSubmit={handleSubmit} className="space-y-4">
        {(["name", "contact_name", "email", "phone"] as const).map((field) => (
          <div key={field}>
            <label className="block text-label-md font-medium text-on-surface-variant mb-1.5 capitalize">
              {field.replace("_", " ")}{field === "name" ? " *" : ""}
            </label>
            <input
              required={field === "name"}
              value={(form[field] as string) ?? ""}
              onChange={(e) => setForm({ ...form, [field]: e.target.value || null })}
              className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-sm text-on-surface outline-none focus:border-primary"
            />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-outline-variant py-3 text-body-md font-semibold text-on-surface-variant hover:bg-surface-variant transition">Cancelar</button>
          <button type="submit" disabled={create.isPending} className="flex-1 rounded-2xl bg-primary py-3 text-body-md font-semibold text-on-primary hover:opacity-90 transition disabled:opacity-60">
            {create.isPending ? "Guardando..." : "Crear proveedor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function PurchasesPage() {
  const { isAdmin } = useAuth();
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();
  const createOrder = useCreatePurchaseOrder();
  const receiveOrder = useReceivePurchaseOrder();

  const [lines, setLines] = useState<OrderLine[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [selectedVariantId, setSelectedVariantId] = useState<number | "">("");
  const [qtyInput, setQtyInput] = useState("1");
  const [costInput, setCostInput] = useState("");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [confirmedOrders, setConfirmedOrders] = useState<PurchaseOrder[]>([]);

  const selectedProduct = products?.find((p) => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find((v) => v.id === selectedVariantId);

  const addLine = () => {
    if (!selectedVariant || !selectedProduct) return;
    const qty = parseInt(qtyInput);
    const cost = parseFloat(costInput);
    if (!qty || qty <= 0) { toast.error("Cantidad inválida"); return; }
    if (!cost || cost <= 0) { toast.error("Costo inválido"); return; }

    const existing = lines.find((l) => l.variant_id === selectedVariant.id);
    if (existing) {
      setLines(lines.map((l) => l.variant_id === selectedVariant.id ? { ...l, quantity: l.quantity + qty } : l));
    } else {
      setLines([...lines, {
        variant_id: selectedVariant.id,
        sku: selectedVariant.sku,
        productName: selectedProduct.name,
        quantity: qty,
        unit_cost: cost,
      }]);
    }
    setSelectedVariantId("");
    setQtyInput("1");
    setCostInput("");
  };

  const handleSubmit = async () => {
    if (!selectedSupplierId) { toast.error("Seleccioná un proveedor"); return; }
    if (!lines.length) { toast.error("Agregá al menos un ítem"); return; }

    const payload: PurchaseOrderCreatePayload = {
      supplier_id: selectedSupplierId as number,
      items: lines.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity, unit_cost: l.unit_cost })),
      notes: notes || null,
    };
    const order = await createOrder.mutateAsync(payload);
    setConfirmedOrders((prev) => [order, ...prev]);
    setLines([]);
    setNotes("");
    setSelectedSupplierId("");
  };

  const handleReceive = async (orderId: number) => {
    const updated = await receiveOrder.mutateAsync(orderId);
    setConfirmedOrders((prev) => prev.map((o) => o.id === orderId ? updated : o));
  };

  const total = lines.reduce((a, l) => a + l.unit_cost * l.quantity, 0);
  const isLoading = loadingProducts || loadingSuppliers;

  if (isLoading) return <LoadingSpinner label="Cargando datos..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Compras</p>
            <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">Órdenes de compra</h1>
          </div>
          <button
            onClick={() => setShowNewSupplier(true)}
            className="flex items-center gap-2 rounded-2xl border border-outline-variant px-4 py-2.5 text-body-sm font-semibold text-on-surface hover:bg-surface-variant transition"
          >
            <span className="material-symbols-outlined text-base">add_business</span>
            Nuevo proveedor
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Formulario de orden */}
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant space-y-6">
          <h2 className="text-headline-md font-semibold text-on-surface">Nueva orden</h2>

          {/* Proveedor */}
          <div>
            <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Proveedor *</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value ? parseInt(e.target.value) : "")}
              className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="">Seleccionar proveedor...</option>
              {suppliers?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Agregar ítem */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Producto</label>
              <select
                value={selectedProductId}
                onChange={(e) => { setSelectedProductId(e.target.value ? parseInt(e.target.value) : ""); setSelectedVariantId(""); }}
                className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-sm text-on-surface outline-none focus:border-primary"
              >
                <option value="">Seleccionar...</option>
                {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                {selectedProduct?.variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.sku}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Cant.</label>
              <input type="number" min="1" value={qtyInput} onChange={(e) => setQtyInput(e.target.value)}
                className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-sm text-on-surface outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Costo unit.</label>
              <div className="flex gap-2">
                <input type="number" min="0" step="0.01" value={costInput} onChange={(e) => setCostInput(e.target.value)}
                  placeholder="$0.00"
                  className="flex-1 rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-sm text-on-surface outline-none focus:border-primary min-w-0" />
                <button onClick={addLine} disabled={!selectedVariant || !costInput}
                  className="rounded-2xl bg-primary px-4 text-on-primary hover:opacity-90 transition disabled:opacity-40">
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ítems */}
          {lines.length > 0 && (
            <div className="space-y-2">
              <p className="text-label-md font-medium text-on-surface-variant uppercase tracking-wider">Ítems</p>
              {lines.map((l) => (
                <div key={l.variant_id} className="flex items-center justify-between rounded-2xl bg-surface-container p-4">
                  <div>
                    <p className="text-body-sm font-medium text-on-surface">{l.productName}</p>
                    <p className="font-mono text-body-sm text-on-surface-variant">{l.sku}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-body-sm text-on-surface-variant">{l.quantity} × {formatCurrency(l.unit_cost)}</p>
                      <p className="font-semibold text-on-surface">{formatCurrency(l.unit_cost * l.quantity)}</p>
                    </div>
                    <button onClick={() => setLines(lines.filter((x) => x.variant_id !== l.variant_id))}
                      className="rounded-xl p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container transition">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="space-y-6">
          <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant space-y-5">
            <h2 className="text-headline-md font-semibold text-on-surface">Resumen</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-body-sm">
                <span className="text-on-surface-variant">Ítems</span>
                <span>{lines.length}</span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-on-surface-variant">Unidades</span>
                <span>{lines.reduce((a, l) => a + l.quantity, 0)}</span>
              </div>
              <div className="border-t border-outline-variant pt-3 flex justify-between">
                <span className="font-semibold">Total costo</span>
                <span className="font-bold text-headline-md text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
            <div>
              <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Notas</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-sm text-on-surface outline-none focus:border-primary resize-none" />
            </div>
            <button onClick={handleSubmit} disabled={createOrder.isPending || !lines.length || !selectedSupplierId}
              className="w-full rounded-2xl bg-primary py-4 text-body-md font-semibold text-on-primary hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {createOrder.isPending ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Creando...</>
              ) : (
                <><span className="material-symbols-outlined">local_shipping</span>Crear orden de compra</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Órdenes confirmadas en esta sesión */}
      {confirmedOrders.length > 0 && (
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant space-y-4">
          <h2 className="text-headline-md font-semibold text-on-surface">Órdenes de esta sesión</h2>
          <div className="space-y-3">
            {confirmedOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-2xl bg-surface-container p-5">
                <div>
                  <p className="text-body-sm font-semibold text-on-surface">Orden #{order.id}</p>
                  <p className="text-body-sm text-on-surface-variant">{order.items.length} ítem(s) · {formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    order.status === "RECEIVED" ? "bg-primary-container text-on-primary-container" :
                    order.status === "CANCELLED" ? "bg-error-container text-on-error-container" :
                    "bg-secondary-container text-on-surface"
                  }`}>
                    {order.status === "PENDING" ? "Pendiente" :
                     order.status === "RECEIVED" ? "Recibida" :
                     order.status === "CANCELLED" ? "Cancelada" : order.status}
                  </span>
                  {order.status === "PENDING" && isAdmin && (
                    <button
                      onClick={() => handleReceive(order.id)}
                      disabled={receiveOrder.isPending}
                      className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary hover:opacity-90 transition disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">inventory</span>
                      Recibir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NewSupplierModal open={showNewSupplier} onClose={() => setShowNewSupplier(false)} />
    </div>
  );
}
