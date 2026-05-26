import { useState, useEffect, useRef } from 'react'
import { salesApi, clientsApi, productsApi } from '../services/api'
import type { Sale, Client, ClientCreate, ProductVariant } from '../types'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => { fetchSales() }, [])

  const fetchSales = async () => {
    setLoading(true)
    try {
      const data = await salesApi.list()
      setSales(data)
    } catch {
      showToast('Error al cargar ventas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSaleCreated = () => {
    setModalOpen(false)
    showToast('Venta registrada correctamente', 'success')
    fetchSales()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">{sales.length} venta{sales.length !== 1 ? 's' : ''} registrada{sales.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nueva venta
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Cargando...</p>
      ) : sales.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay ventas registradas</p>
          <p className="text-sm mt-1">Registrá la primera con el botón de arriba</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-right px-4 py-3 font-medium">Ítems</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map(sale => {
                const total = sale.items?.reduce((s, i) => s + i.quantity * Number(i.unit_price), 0) ?? 0
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">#{sale.id}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(sale.created_at).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {sale.client_name || <span className="text-gray-400 font-normal">Sin cliente</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{sale.items?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">${total.toLocaleString('es-AR')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {modalOpen && (
        <NewSaleModal onCreated={handleSaleCreated} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface SaleItemDraft {
  variant: ProductVariant
  quantity: number
  unit_price: number
}

// ─── Modal nueva venta ────────────────────────────────────────────────────────

function NewSaleModal({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [items, setItems] = useState<SaleItemDraft[]>([])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await salesApi.create({
        client_id: selectedClient?.id,
        notes,
        items: items.map(i => ({ variant_id: i.variant.id, quantity: i.quantity, unit_price: i.unit_price })),
      })
      onCreated()
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setSubmitError(err?.response?.status === 409 ? (detail || 'Stock insuficiente') : (detail || 'Error al registrar la venta'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Nueva venta</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
          <div className="flex gap-2 text-xs">
            {(['1. Cliente', '2. Ítems', '3. Confirmar'] as const).map((label, i) => (
              <span key={i} className={`px-3 py-1 rounded-full ${step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && <StepClient selected={selectedClient} onSelect={setSelectedClient} />}
          {step === 2 && <StepItems items={items} onChange={setItems} />}
          {step === 3 && <StepConfirm client={selectedClient} items={items} total={total} notes={notes} onNotesChange={setNotes} error={submitError} />}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : onClose()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as 2 | 3)}
              disabled={(step === 1 && !selectedClient) || (step === 2 && items.length === 0)}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40"
            >
              {submitting ? 'Registrando...' : 'Registrar venta'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Paso 1: Seleccionar cliente ──────────────────────────────────────────────

function StepClient({ selected, onSelect }: { selected: Client | null; onSelect: (c: Client | null) => void }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Client[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (search.length < 1) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      const data = await clientsApi.list(search)
      setResults(data)
    }, 300)
  }, [search])

  const handleCreateInline = async (data: ClientCreate) => {
    const newClient = await clientsApi.create(data)
    onSelect(newClient)
    setShowCreate(false)
    setSearch('')
    setResults([])
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Seleccioná el cliente que realiza la compra.</p>

      {selected ? (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div>
            <p className="font-medium text-blue-900">{selected.full_name}</p>
            {selected.email && <p className="text-xs text-blue-600">{selected.email}</p>}
          </div>
          <button onClick={() => onSelect(null)} className="text-xs text-blue-500 hover:underline">Cambiar</button>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Buscar cliente por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={inputClass}
            autoFocus
          />
          {results.length > 0 && (
            <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {results.map(c => (
                <li key={c.id}>
                  <button
                    onClick={() => { onSelect(c); setSearch(''); setResults([]) }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"
                  >
                    <span className="font-medium">{c.full_name}</span>
                    {c.email && <span className="text-gray-400 ml-2">{c.email}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {search.length > 0 && results.length === 0 && (
            <p className="text-sm text-gray-400">No se encontraron clientes.</p>
          )}
          <button onClick={() => setShowCreate(true)} className="text-sm text-blue-600 hover:underline">
            + Crear cliente nuevo
          </button>
        </>
      )}

      {showCreate && (
        <InlineClientCreate onSave={handleCreateInline} onCancel={() => setShowCreate(false)} />
      )}
    </div>
  )
}

// ─── Crear cliente inline ─────────────────────────────────────────────────────

function InlineClientCreate({ onSave, onCancel }: { onSave: (d: ClientCreate) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<ClientCreate>({ full_name: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)
    try {
      await onSave(form)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error al crear el cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
      <p className="text-sm font-medium text-blue-800">Nuevo cliente</p>
      <form onSubmit={handle} className="space-y-2">
        <input
          placeholder="Nombre completo *"
          value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          className={inputClass}
          autoFocus
        />
        <input
          type="email"
          placeholder="Email (opcional)"
          value={form.email || ''}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className={inputClass}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear y seleccionar'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Paso 2: Agregar ítems ────────────────────────────────────────────────────

function StepItems({ items, onChange }: { items: SaleItemDraft[]; onChange: (items: SaleItemDraft[]) => void }) {
  const [allVariants, setAllVariants] = useState<ProductVariant[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState(0)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    productsApi.list().then(products => {
      const variants = products.flatMap(p => p.variants?.filter(v => v.is_active) ?? [])
      setAllVariants(variants)
    })
  }, [])

  const selectedVariant = allVariants.find(v => v.id === Number(selectedVariantId))

  useEffect(() => {
    if (selectedVariant) setPrice(Number(selectedVariant.sale_price))
  }, [selectedVariantId])

  const addItem = () => {
    if (!selectedVariant) { setAddError('Seleccioná una variante'); return }
    if (qty < 1) { setAddError('La cantidad debe ser al menos 1'); return }
    if ((selectedVariant.current_stock ?? 0) < qty) {
      setAddError(`Stock insuficiente. Disponible: ${selectedVariant.current_stock ?? 0}`)
      return
    }
    setAddError('')
    onChange([...items, { variant: selectedVariant, quantity: qty, unit_price: price }])
    setSelectedVariantId('')
    setQty(1)
    setPrice(0)
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Agregá los productos vendidos.</p>

      <div className="grid grid-cols-[1fr_80px_120px_auto] gap-2 items-end">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Variante (SKU)</label>
          <select value={selectedVariantId} onChange={e => setSelectedVariantId(e.target.value)} className={inputClass}>
            <option value="">Seleccionar...</option>
            {allVariants.map(v => (
              <option key={v.id} value={v.id}>{v.sku} — stock: {v.current_stock ?? 0}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Cantidad</label>
          <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Precio unitario</label>
          <input type="number" min={0} step={0.01} value={price} onChange={e => setPrice(Number(e.target.value))} className={inputClass} />
        </div>
        <button onClick={addItem} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 mt-5">
          Agregar
        </button>
      </div>
      {addError && <p className="text-xs text-red-500">{addError}</p>}

      {items.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">SKU</th>
                <th className="text-right px-4 py-2 font-medium">Cant.</th>
                <th className="text-right px-4 py-2 font-medium">Precio</th>
                <th className="text-right px-4 py-2 font-medium">Subtotal</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 font-mono text-xs">{item.variant.sku}</td>
                  <td className="px-4 py-2 text-right">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">${item.unit_price.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-2 text-right font-medium">${(item.quantity * item.unit_price).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => onChange(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-600">Total:</td>
                <td className="px-4 py-2 text-right font-semibold text-gray-900">${total.toLocaleString('es-AR')}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Paso 3: Confirmar ────────────────────────────────────────────────────────

function StepConfirm({ client, items, total, notes, onNotesChange, error }: {
  client: Client | null
  items: SaleItemDraft[]
  total: number
  notes: string
  onNotesChange: (v: string) => void
  error: string | null
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Cliente:</span>
          <span className="font-medium">{client?.full_name || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Ítems:</span>
          <span className="font-medium">{items.length}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-gray-700 font-medium">Total:</span>
          <span className="font-semibold text-gray-900">${total.toLocaleString('es-AR')}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Observaciones, número de remito, etc."
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
