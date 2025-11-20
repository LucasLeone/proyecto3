import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

export function EmployeesPanel({ token, areas }) {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ full_name: '', email: '', password: '', area_id: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const areaMap = useMemo(() => Object.fromEntries(areas.map((a) => [a.id, a.name])), [areas])

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
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (emp) => {
    setEditingId(emp.id)
    setForm({
      full_name: emp.full_name || '',
      email: emp.email || '',
      password: '',
      area_id: emp.area_id || '',
    })
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
          placeholder="Nombre y apellido"
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          required
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
        <select
          className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
          value={form.area_id}
          onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
          required
        >
          <option value="">Asignar área</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {editingId ? 'Actualizar empleado' : 'Crear empleado'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm({ full_name: '', email: '', password: '', area_id: '' })
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Área</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {employees.map((emp) => (
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
            {employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-sm text-slate-400">
                  No hay empleados cargados
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
