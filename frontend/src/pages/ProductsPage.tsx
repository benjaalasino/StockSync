import { useState } from "react";
import { useProducts, useCategories, useCreateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/auth/AuthContext";
import { formatCurrency } from "@/lib/format";
import type { ProductCreatePayload } from "@/types";

function CreateProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories } = useCategories();
  const create = useCreateProduct();
  const [form, setForm] = useState<ProductCreatePayload>({ name: "", base_sku: "", category_id: null });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync(form);
    onClose();
    setForm({ name: "", base_sku: "", category_id: null });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo producto">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Nombre *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ej: Remera Básica"
            className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">SKU Base *</label>
          <input
            required
            value={form.base_sku}
            onChange={(e) => setForm({ ...form, base_sku: e.target.value.toUpperCase() })}
            placeholder="ej: REM-BASE"
            className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
          />
        </div>
        <div>
          <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Descripción</label>
          <input
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value || null })}
            placeholder="Descripción opcional"
            className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-label-md font-medium text-on-surface-variant mb-1.5">Categoría</label>
          <select
            value={form.category_id ?? ""}
            onChange={(e) => setForm({ ...form, category_id: e.target.value ? parseInt(e.target.value, 10) : null })}
            className="w-full rounded-2xl border border-outline-variant bg-background px-4 py-3 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Sin categoría</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-outline-variant py-3 text-body-md font-semibold text-on-surface-variant hover:bg-surface-variant transition">
            Cancelar
          </button>
          <button type="submit" disabled={create.isPending} className="flex-1 rounded-2xl bg-primary py-3 text-body-md font-semibold text-on-primary hover:opacity-90 transition disabled:opacity-60">
            {create.isPending ? "Creando..." : "Crear producto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const { data: products, isLoading, error } = useProducts();
  const deleteProduct = useDeleteProduct();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.base_sku.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  if (error) {
    return (
      <div className="rounded-3xl bg-error-container p-8 text-on-error-container">
        Error al cargar productos. Intentá recargar la página.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Productos</p>
            <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">Catálogo de inventario</h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 transition"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              Agregar producto
            </button>
          )}
        </div>

        {/* Buscador */}
        <div className="mt-6 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full rounded-2xl border border-outline-variant bg-surface py-3 pl-12 pr-4 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Listado */}
      {isLoading ? (
        <LoadingSpinner label="Cargando catálogo..." />
      ) : !filtered.length ? (
        <EmptyState
          icon="inventory_2"
          title={search ? "Sin resultados" : "No hay productos"}
          description={search ? `No se encontró "${search}"` : "Creá el primer producto para comenzar."}
          action={
            isAdmin && !search ? (
              <button onClick={() => setShowCreate(true)} className="mt-2 rounded-2xl bg-primary px-5 py-2.5 text-body-sm font-semibold text-on-primary hover:opacity-90 transition">
                Crear producto
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => {
            const totalStock = product.variants.reduce((a, v) => a + v.current_stock, 0);
            const hasAlerts = product.variants.some((v) => v.current_stock <= v.reorder_point);
            return (
              <div key={product.id} className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-label-sm text-on-surface-variant">{product.base_sku}</p>
                    <h2 className="mt-1 text-headline-md font-semibold text-on-surface truncate">{product.name}</h2>
                    {product.description && (
                      <p className="mt-1 text-body-sm text-on-surface-variant line-clamp-2">{product.description}</p>
                    )}
                  </div>
                  {hasAlerts && (
                    <span className="flex-shrink-0 material-symbols-outlined text-error" title="Stock bajo">warning</span>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-surface-container p-3">
                  <span className="text-body-sm text-on-surface-variant">Stock total</span>
                  <span className={`font-semibold text-body-md ${totalStock === 0 ? "text-error" : "text-on-surface"}`}>
                    {totalStock} u.
                  </span>
                </div>

                {/* Variantes resumidas */}
                {product.variants.length > 0 && (
                  <div className="space-y-1.5">
                    {product.variants.slice(0, 3).map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-body-sm">
                        <span className="font-mono text-on-surface-variant truncate">{v.sku}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-on-surface-variant">{formatCurrency(v.sale_price)}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            v.current_stock <= v.reorder_point
                              ? "bg-error text-on-error"
                              : v.current_stock <= v.reorder_point * 2
                              ? "bg-secondary-container text-on-surface"
                              : "bg-primary-container/40 text-on-primary-container"
                          }`}>
                            {v.current_stock}
                          </span>
                        </div>
                      </div>
                    ))}
                    {product.variants.length > 3 && (
                      <p className="text-body-sm text-on-surface-variant/60">+{product.variants.length - 3} más...</p>
                    )}
                  </div>
                )}

                {isAdmin && (
                  <div className="flex gap-2 pt-1 border-t border-outline-variant">
                    <button
                      onClick={() => deleteProduct.mutate(product.id)}
                      disabled={deleteProduct.isPending}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-body-sm text-on-surface-variant hover:bg-error-container hover:text-error transition disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateProductModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
