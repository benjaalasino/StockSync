import { FormEvent, useEffect, useState } from "react";
import { categoriesApi, productsApi } from "@/services/api";
import type { Category, Product } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [name, setName] = useState("");
  const [baseSku, setBaseSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [prods, cats] = await Promise.all([productsApi.list(), categoriesApi.list()]);
        setProducts(prods);
        setCategories(cats);
      } catch {
        setError("Error al cargar productos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const created = await productsApi.create({
        name,
        base_sku: baseSku.toUpperCase(),
        category_id: categoryId ? Number(categoryId) : undefined,
        description: description || undefined,
      });
      setProducts((prev) => [created, ...prev]);
      setName("");
      setBaseSku("");
      setCategoryId("");
      setDescription("");
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFormError(msg || "Error al crear el producto. Verificá que el SKU sea único.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await productsApi.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Error al eliminar el producto.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label-md uppercase tracking-[0.18em] text-primary-container">Productos</p>
            <h1 className="mt-2 text-headline-lg font-semibold text-on-surface">Catálogo de inventario</h1>
            {!loading && (
              <p className="mt-1 text-sm text-on-surface-variant">{products.length} productos activos</p>
            )}
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setFormError(""); }}
            className="rounded-2xl bg-primary px-5 py-3 text-body-md font-semibold text-on-primary transition hover:bg-primary-container"
          >
            {showForm ? "Cancelar" : "Agregar producto"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-8 grid gap-4 rounded-3xl bg-surface p-6 ring-1 ring-outline-variant sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-label-md font-semibold text-on-surface">Nuevo producto</p>
            </div>

            <label className="flex flex-col gap-2 text-label-md text-on-surface-variant">
              Nombre *
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Remera Básica"
                className="rounded-2xl border border-outline-variant bg-background px-4 py-3 text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-label-md text-on-surface-variant">
              SKU base *
              <input
                type="text"
                value={baseSku}
                onChange={(e) => setBaseSku(e.target.value)}
                placeholder="Ej: REM-BAS"
                className="rounded-2xl border border-outline-variant bg-background px-4 py-3 text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-label-md text-on-surface-variant">
              Categoría
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-2xl border border-outline-variant bg-background px-4 py-3 text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-label-md text-on-surface-variant">
              Descripción
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional"
                className="rounded-2xl border border-outline-variant bg-background px-4 py-3 text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
              />
            </label>

            {formError && (
              <div className="sm:col-span-2 rounded-2xl bg-error-container/80 p-3 text-sm text-on-error-container">
                {formError}
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-primary px-6 py-3 font-semibold text-on-primary transition hover:bg-primary-container disabled:opacity-60"
              >
                {saving ? "Creando..." : "Crear producto"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-2xl bg-surface-container-highest px-6 py-3 font-semibold text-on-surface transition hover:bg-outline-variant"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-error-container/80 p-4 text-sm text-on-error-container">{error}</div>
      )}

      {loading ? (
        <div className="rounded-3xl bg-surface p-8 text-center text-on-surface-variant ring-1 ring-outline-variant">
          Cargando productos...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl bg-surface p-8 text-center text-on-surface-variant ring-1 ring-outline-variant">
          No hay productos. ¡Creá el primero!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const totalStock = product.variants.reduce((a, v) => a + (v.current_stock ?? 0), 0);
            const category = categories.find((c) => c.id === product.category_id);
            return (
              <div key={product.id} className="rounded-3xl bg-surface p-6 shadow-soft-bloom-shadow ring-1 ring-outline-variant">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
                      {category?.name ?? "Sin categoría"}
                    </p>
                    <h2 className="mt-2 text-headline-md font-semibold text-on-surface">{product.name}</h2>
                    <p className="mt-1 text-sm text-on-surface-variant">SKU: {product.base_sku}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="rounded-xl p-2 text-on-surface-variant transition hover:bg-error-container hover:text-on-error-container"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-body-md text-on-surface-variant">
                    Stock: <span className="font-semibold text-on-surface">{totalStock} u.</span>
                  </p>
                  <span className="rounded-full bg-primary-container/20 px-3 py-1 text-xs font-medium text-primary-container">
                    {product.variants.length} variantes
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
