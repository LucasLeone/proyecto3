import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function ClientsPanel({ token, onChange }) {
  const [clients, setClients] = useState([])
  const [form, setForm] = useState({ company_name: '', full_name: '', email: '', password: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listClients(token)
      setClients(data)
      if (onChange) onChange(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (editingId) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await api.updateClient(token, editingId, payload)
      } else {
        await api.createClient(token, form)
      }
      setForm({ company_name: '', full_name: '', email: '', password: '' })
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (client) => {
    setEditingId(client.id)
    setForm({
      company_name: client.company_name || '',
      full_name: client.full_name || '',
      email: client.email || '',
      password: '',
    })
  }

  const handleDelete = async (id) => {
    setLoading(true)
    setError(null)
    try {
      await api.deleteClient(token, id)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Usuarios</p>
          <h2 className="text-xl font-semibold">Clientes</h2>
        </div>
        <span className="rounded-full border border-sky-400/50 bg-sky-500/10 px-3 py-1 text-xs text-sky-100">
          Admin
        </span>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <input
          className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
          placeholder="Razón social"
          value={form.company_name}
          onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
          placeholder="Nombre de contacto (opcional)"
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        />
        <input
          className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
          placeholder={editingId ? 'Contraseña (opcional)' : 'Contraseña'}
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required={!editingId}
        />
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-300 disabled:opacity-60"
          >
            {editingId ? 'Actualizar cliente' : 'Crear cliente'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm({ company_name: '', full_name: '', email: '', password: '' })
              }}
              className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-200 hover:border-slate-500"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Razón social</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Contacto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-3 text-sm">{client.company_name || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-200">{client.email}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{client.full_name || '—'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(client)}
                      className="rounded-md border border-slate-700 px-3 py-1 text-xs hover:border-slate-500"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(client.id)}
                      className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-200 hover:border-red-400"
                    >
                      Desactivar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-sm text-slate-400">
                  No hay clientes cargados
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
