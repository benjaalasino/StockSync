import { useState, useEffect } from 'react'
import { productsApi, categoriesApi } from '../services/api'
import type { Product, ProductVariant, Category, User } from '../types'

export default function ProductsPage({ user }: { user: User | null }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProducts = () => {
    setLoading(true)
    productsApi.list()
      .then(setProducts)
      .catch(() => setError('Error al cargar productos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const isAdmin = user?.role === 'admin'

  if (loading) return <div className="p-6 text-gray-400">Cargando productos...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-3xl px-6 py-4 text-sm font-semibold shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.filter(p => p.is_active).length} producto{products.filter(p => p.is_active).length !== 1 ? 's' : ''} activos
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Nuevo producto
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay productos cargados</p>
          {isAdmin && (
            <p className="text-sm mt-2">
              Usá el botón <strong>"+ Nuevo producto"</strong> para comenzar.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              expanded={expandedId === product.id}
              onToggle={() => setExpandedId(expandedId === product.id ? null : product.id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <NewProductModal
          onClose={() => setModalOpen(false)}
          onCreated={() => { fetchProducts(); setModalOpen(false); showToast('Producto creado', 'success') }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}
    </div>
  )
}

function ProductCard({ product, expanded, onToggle }: { product: Product; expanded: boolean; onToggle: () => void }) {
  const activeVariants = product.variants?.filter(v => v.is_active) ?? []
  const totalStock = activeVariants.reduce((sum, v) => sum + (v.current_stock ?? 0), 0)
  const hasLowStock = activeVariants.some(v => (v.current_stock ?? 0) <= v.reorder_point)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{product.name}</span>
              {!product.is_active && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactivo</span>
              )}
              {hasLowStock && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Stock bajo</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              SKU: {product.base_sku}
              {product.brand && ` · ${product.brand}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <span>{activeVariants.length} variante{activeVariants.length !== 1 ? 's' : ''}</span>
          <span className="font-medium text-gray-700">{totalStock} u. totales</span>
          <span className="text-gray-300">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
          {activeVariants.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Sin variantes activas</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="text-left pb-2 font-medium">SKU</th>
                  <th className="text-left pb-2 font-medium">Atributos</th>
                  <th className="text-right pb-2 font-medium">Precio venta</th>
                  <th className="text-right pb-2 font-medium">Stock</th>
                  <th className="text-right pb-2 font-medium">Reorden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeVariants.map(variant => (
                  <VariantRow key={variant.id} variant={variant} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function VariantRow({ variant }: { variant: ProductVariant }) {
  const stock = variant.current_stock ?? 0
  const belowReorder = stock <= variant.reorder_point

  return (
    <tr className="hover:bg-white transition">
      <td className="py-2 font-mono text-xs text-gray-600">{variant.sku}</td>
      <td className="py-2 text-gray-600">
        {variant.attribute_values?.map(av => av.value).join(' · ') || '—'}
      </td>
      <td className="py-2 text-right text-gray-700">
        ${Number(variant.sale_price).toLocaleString('es-AR')}
      </td>
      <td className="py-2 text-right">
        <span className={`font-medium ${belowReorder ? 'text-amber-600' : 'text-gray-800'}`}>
          {stock}
        </span>
      </td>
      <td className="py-2 text-right text-gray-400 text-xs">{variant.reorder_point}</td>
    </tr>
  )
}

function NewProductModal({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void
  onCreated: () => void
  onError: (msg: string) => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({ name: '', base_sku: '', brand: '', category_id: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.base_sku.trim()) {
      onError('Nombre y SKU Base son obligatorios')
      return
    }
    setSaving(true)
    try {
      await productsApi.create({
        name: form.name.trim(),
        base_sku: form.base_sku.trim().toUpperCase(),
        brand: form.brand.trim() || undefined,
        category_id: form.category_id ? Number(form.category_id) : undefined,
      })
      onCreated()
    } catch (err: any) {
      onError(err?.response?.data?.detail || 'Error al crear el producto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Nuevo producto</h2>
        <p className="mt-1 text-sm text-gray-500">
          Creá el producto base. Las variantes se generan desde la API o Swagger.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Remera Básica"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              SKU Base <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: REM-BAS"
              value={form.base_sku}
              onChange={e => setForm(f => ({ ...f, base_sku: e.target.value.toUpperCase() }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Marca
            </label>
            <input
              type="text"
              placeholder="Ej: BasiX"
              value={form.brand}
              onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Categoría
            </label>
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Sin categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Creando...' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
