import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Modal } from './Modal'

export function EmployeesPanel({ token, areas }) {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ full_name: '', email: '', password: '', area_id: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterArea, setFilterArea] = useState('')

  const areaMap = useMemo(() => Object.fromEntries(areas.map((a) => [a.id, a.name])), [areas])

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (filterArea && emp.area_id !== filterArea) return false
      return true
    })
  }, [employees, filterArea])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listEmployees(token)
      setEmployees(data)
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
        await api.updateEmployee(token, editingId, payload)
      } else {
        await api.createEmployee(token, form)
      }
      setForm({ full_name: '', email: '', password: '', area_id: '' })
      setEditingId(null)
      setIsModalOpen(false)
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
    setForm({ full_name: '', email: '', password: '', area_id: '' })
  }

  const startEdit = (emp) => {
    setEditingId(emp.id)
    setForm({
      full_name: emp.full_name || '',
      email: emp.email || '',
      password: '',
      area_id: emp.area_id || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    setLoading(true)
    setError(null)
    try {
      await api.deleteEmployee(token, id)
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
          <h2 className="text-xl font-semibold">Empleados</h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
          >
            <option value="">Todas las áreas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
          >
            + Registrar empleado
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Área</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-3 text-sm">{emp.full_name || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-200">{emp.email}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{areaMap[emp.area_id] || 'Sin área'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(emp)}
                      className="rounded-md border border-slate-700 px-3 py-1 text-xs hover:border-slate-500"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(emp.id)}
                      className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-200 hover:border-red-400"
                    >
                      Desactivar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-sm text-slate-400">
                  {filterArea ? 'No hay empleados en esta área' : 'No hay empleados cargados'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Editar empleado' : 'Registrar empleado'}>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Nombre y apellido
              </label>
              <input
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                placeholder="Ej: Juan Pérez"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                placeholder="Ej: juan@empresa.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Contraseña {editingId ? '(dejar vacío para no cambiar)' : ''}
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                placeholder={editingId ? 'Opcional' : 'Contraseña'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required={!editingId}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Área asignada
              </label>
              <select
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                value={form.area_id}
                onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
                required
              >
                <option value="">Seleccionar área</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                {editingId ? 'Actualizar empleado' : 'Crear empleado'}
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
