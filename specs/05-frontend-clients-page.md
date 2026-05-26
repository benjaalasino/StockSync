# 05 — Frontend: página Clientes (`/clients`)

## Archivo a crear: `frontend/src/pages/ClientsPage.tsx`

La página tiene dos estados: lista de clientes y modal de crear/editar.

```tsx
import { useState, useEffect, useCallback } from 'react'
import { clientsApi } from '../services/api'
import type { Client, ClientCreate } from '../types'

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchClients = async (q?: string) => {
    setLoading(true)
    try {
      const data = await clientsApi.list(q || undefined)
      setClients(data)
    } catch {
      showToast('Error al cargar clientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async (data: ClientCreate) => {
    try {
      if (editingClient) {
        await clientsApi.update(editingClient.id, data)
        showToast('Cliente actualizado', 'success')
      } else {
        await clientsApi.create(data)
        showToast('Cliente creado', 'success')
      }
      setModalOpen(false)
      setEditingClient(null)
      fetchClients(search)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Error al guardar'
      showToast(msg, 'error')
    }
  }

  const handleDelete = async (client: Client) => {
    if (!confirm(`¿Desactivar a ${client.full_name}?`)) return
    try {
      await clientsApi.delete(client.id)
      showToast('Cliente desactivado', 'success')
      fetchClients(search)
    } catch {
      showToast('Error al desactivar', 'error')
    }
  }

  const openCreate = () => {
    setEditingClient(null)
    setModalOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setModalOpen(true)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} cliente{clients.length !== 1 ? 's' : ''} activo{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nuevo cliente
        </button>
      </div>

      {/* Barra de búsqueda */}
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Tabla */}
      {loading ? (
        <p className="text-center text-gray-400 py-12">Cargando...</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay clientes</p>
          <p className="text-sm mt-1">Creá el primero con el botón de arriba</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{client.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{client.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{client.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${client.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {client.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => openEdit(client)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Editar
                    </button>
                    {client.is_active && (
                      <button
                        onClick={() => handleDelete(client)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg text-white text-sm shadow-lg transition ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ClientModal
          client={editingClient}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingClient(null) }}
        />
      )}
    </div>
  )
}

// ─── Modal crear/editar ───────────────────────────────────────────────────────

interface ClientModalProps {
  client: Client | null
  onSave: (data: ClientCreate) => void
  onClose: () => void
}

function ClientModal({ client, onSave, onClose }: ClientModalProps) {
  const [form, setForm] = useState<ClientCreate>({
    full_name: client?.full_name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    notes: client?.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name.trim()) e.full_name = 'El nombre es obligatorio'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Email inválido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">{client ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre completo *" error={errors.full_name}>
            <input
              className="input"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              className="input"
              value={form.email || ''}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Teléfono">
            <input
              className="input"
              value={form.phone || ''}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="Dirección">
            <input
              className="input"
              value={form.address || ''}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            />
          </Field>
          <Field label="Notas">
            <textarea
              className="input resize-none"
              rows={2}
              value={form.notes || ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              {client ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
```

## Estilos necesarios

Agregar en `frontend/src/index.css` (o donde estén los estilos globales):

```css
.input {
  @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
}
```

Si no se usa Tailwind con `@apply`, reemplazar `.input` por clases de Tailwind directas en cada `<input>`.
