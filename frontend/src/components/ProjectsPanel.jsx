import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

export function ProjectsPanel({ token, role, clients }) {
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ name: '', project_type: '', status: '', client_id: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c.company_name || c.email])),
    [clients],
  )

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listProjects(token)
      setProjects(data)
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
        await api.updateProject(token, editingId, form)
      } else {
        await api.createProject(token, form)
      }
      setForm({ name: '', project_type: '', status: '', client_id: '' })
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (project) => {
    setEditingId(project.id)
    setForm({
      name: project.name || '',
      project_type: project.project_type || '',
      status: project.status || '',
      client_id: project.client_id || '',
    })
  }

  const handleDelete = async (id) => {
    setLoading(true)
    setError(null)
    try {
      await api.deleteProject(token, id)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const admin = role === 'admin'
  const isClient = role === 'client'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Proyectos</p>
          <h2 className="text-xl font-semibold">{admin ? 'Gestión' : 'Listado'}</h2>
        </div>
        <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
          {admin ? 'Admin' : 'Consulta'}
        </span>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {admin ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <input
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
            placeholder="Nombre del proyecto"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
            placeholder="Tipo"
            value={form.project_type}
            onChange={(e) => setForm((f) => ({ ...f, project_type: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
            placeholder="Estado (ej: En proceso)"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            required
          />
          <select
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
            value={form.client_id}
            onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
            required
          >
            <option value="">Asignar cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company_name || client.email}
              </option>
            ))}
          </select>
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-violet-400 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-violet-300 disabled:opacity-60"
            >
              {editingId ? 'Actualizar proyecto' : 'Crear proyecto'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm({ name: '', project_type: '', status: '', client_id: '' })
                }}
                className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-200 hover:border-slate-500"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="overflow-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Proyecto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Cliente</th>
              {admin ? <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Acciones</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {projects.map((proj) => (
              <tr key={proj.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-3 text-sm">{proj.name}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{proj.project_type}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{proj.status}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {clientMap[proj.client_id] || (isClient ? 'Tu cuenta' : '—')}
                </td>
                {admin ? (
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(proj)}
                        className="rounded-md border border-slate-700 px-3 py-1 text-xs hover:border-slate-500"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(proj.id)}
                        className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-200 hover:border-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
            {projects.length === 0 ? (
              <tr>
                <td colSpan={admin ? 5 : 4} className="px-4 py-4 text-center text-sm text-slate-400">
                  No hay proyectos cargados
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
