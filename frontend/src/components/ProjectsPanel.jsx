import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Modal } from './Modal'

export function ProjectsPanel({ token, role, clients, currentUser }) {
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ name: '', project_type: '', client_id: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterClient, setFilterClient] = useState('')

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c.company_name || c.email])),
    [clients],
  )

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (filterClient && project.client_id !== filterClient) return false
      return true
    })
  }, [projects, filterClient])

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
      setForm({ name: '', project_type: '', client_id: '' })
      setEditingId(null)
      setIsModalOpen(false)
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
      client_id: project.client_id || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return
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

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setForm({ name: '', project_type: '', client_id: '' })
    setError(null)
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
        <div className="flex items-center gap-3">
          {!isClient && (
            <select
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
            >
              <option value="">Todos los clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name || client.email}
                </option>
              ))}
            </select>
          )}
          {admin ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 transition-colors"
            >
              + Registrar proyecto
            </button>
          ) : (
            <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
              Consulta
            </span>
          )}
        </div>
      </div>

      {error && !isModalOpen ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Proyecto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Cliente</th>
              {admin ? <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Acciones</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredProjects.map((proj) => (
              <tr key={proj.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-3 text-sm">{proj.name}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{proj.project_type}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {isClient 
                    ? (currentUser?.company_name || currentUser?.email || 'Mi cuenta')
                    : (clientMap[proj.client_id] || '—')}
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
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={admin ? 4 : 3} className="px-4 py-4 text-center text-sm text-slate-400">
                  {filterClient ? 'No hay proyectos para este cliente' : 'No hay proyectos cargados'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Editar proyecto' : 'Registrar proyecto'}>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Nombre del proyecto
              </label>
              <input
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                placeholder="Ej: Sistema de gestión"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Tipo de proyecto
              </label>
              <input
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                placeholder="Ej: Desarrollo web"
                value={form.project_type}
                onChange={(e) => setForm((f) => ({ ...f, project_type: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Cliente asignado
              </label>
              <select
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                value={form.client_id}
                onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                required
              >
                <option value="">Seleccionar cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name || client.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-violet-400 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-violet-300 disabled:opacity-60"
              >
                {editingId ? 'Actualizar proyecto' : 'Crear proyecto'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-200 hover:border-slate-500"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
