# 06 — Frontend: página Productos (`/products`) con datos reales

## Qué cambia

La página actual (`ProductsPage.tsx`) tiene 3 tarjetas hardcodeadas. Se reemplaza por una versión que consume `GET /products/` y muestra los productos reales con sus variantes y stock actual.

## Archivo a reemplazar: `frontend/src/pages/ProductsPage.tsx`

```tsx
import { useState, useEffect } from 'react'
import { productsApi } from '../services/api'
import type { Product, ProductVariant } from '../types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    productsApi.list()
      .then(setProducts)
      .catch(() => setError('Error al cargar productos'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-gray-400">Cargando productos...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay productos cargados</p>
          <p className="text-sm mt-1">Usá el Swagger UI en <code>localhost:8000/docs</code> para crear el primer producto</p>
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
    </div>
  )
}

// ─── Tarjeta de producto ──────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  expanded: boolean
  onToggle: () => void
}

function ProductCard({ product, expanded, onToggle }: ProductCardProps) {
  const activeVariants = product.variants?.filter(v => v.is_active) ?? []
  const totalStock = activeVariants.reduce((sum, v) => sum + (v.current_stock ?? 0), 0)
  const hasLowStock = activeVariants.some(v => (v.current_stock ?? 0) <= v.reorder_point)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header de la tarjeta */}
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
              {product.category?.name && ` · ${product.category.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <span>{activeVariants.length} variante{activeVariants.length !== 1 ? 's' : ''}</span>
          <span className="font-medium text-gray-700">{totalStock} u. totales</span>
          <span className="text-gray-300">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Variantes expandidas */}
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

// ─── Fila de variante ─────────────────────────────────────────────────────────

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
        ${variant.sale_price?.toLocaleString('es-AR') ?? '—'}
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
```

## Verificar que el tipo `Product` tenga `variants` y `category`

En `frontend/src/types/index.ts`, la interfaz `Product` debería verse así:

```typescript
export interface Product {
  id: number
  name: string
  description?: string
  brand?: string
  base_sku: string
  is_active: boolean
  category?: Category          // asegurarse que esté
  variants?: ProductVariant[]  // asegurarse que esté
  created_at: string
  updated_at: string
}
```

Y `ProductVariant` debe tener `current_stock` y `attribute_values`:

```typescript
export interface ProductVariant {
  id: number
  product_id: number
  sku: string
  sale_price: number
  cost_price: number
  reorder_point: number
  is_active: boolean
  current_stock?: number          // calculado en el backend desde Kardex
  attribute_values?: AttributeValue[]
  created_at: string
}
```

## Verificar que `productsApi.list()` incluya variantes

El endpoint `GET /products/` del backend ya devuelve variantes con `current_stock` (según `ProductResponse` que incluye `variants: List[VariantResponse]`). No se necesitan cambios en el backend.
