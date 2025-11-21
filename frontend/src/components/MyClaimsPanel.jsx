import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Modal } from './Modal'
import { Timeline } from './Timeline'

const urgencyOptions = ['Baja', 'Media', 'Alta']
const severityOptions = ['S1 - Crítico', 'S2 - Alto', 'S3 - Medio', 'S4 - Bajo']
const statusOrder = ['Ingresado', 'En Proceso', 'Resuelto']

export function MyClaimsPanel({ token, projects, areas }) {
  const [claims, setClaims] = useState([])
  const [timeline, setTimeline] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ project_id: '', claim_type: '', urgency: 'Media', severity: 'S3 - Medio', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProject, setFilterProject] = useState('')

  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name])), [projects])
  const areaMap = useMemo(() => Object.fromEntries((areas || []).map((a) => [a.id, a.name])), [areas])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listClaims(token)
      setClaims(data)
      if (selectedId) {
        const fresh = data.find((c) => c.id === selectedId)
        if (!fresh) setSelectedId(null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async (id) => {
    try {
      const events = await api.claimTimeline(token, id, { publicOnly: true })
      setTimeline(events.filter((ev) => ev.visibility === 'public'))
    } catch (err) {
      setTimeline([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (selectedId) loadTimeline(selectedId)
  }, [selectedId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await api.createClaim(token, form)
      setForm({ project_id: '', claim_type: '', urgency: 'Media', severity: 'S3 - Medio', description: '' })
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
    setForm({ project_id: '', claim_type: '', urgency: 'Media', severity: 'S3 - Medio', description: '' })
  }

  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      if (filterStatus && claim.status !== filterStatus) return false
      if (filterProject && claim.project_id !== filterProject) return false
      return true
    })
  }, [claims, filterStatus, filterProject])

  const selected = useMemo(
    () => filteredClaims.find((c) => c.id === selectedId),
    [filteredClaims, selectedId],
  )

  const statusBadge = (status) => {
    const idx = statusOrder.indexOf(status)
    const palette = ['border-amber-400 text-amber-200', 'border-sky-400 text-sky-100', 'border-emerald-400 text-emerald-100']
    return (
      <span className={`rounded-full border px-3 py-1 text-xs ${palette[idx] || 'border-slate-600 text-slate-200'}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Reclamos</p>
          <h2 className="text-xl font-semibold">Mis reclamos</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400"
        >
          + Registrar reclamo
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex gap-3 flex-wrap">
        <div>
          <select
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {statusOrder.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {(filterStatus || filterProject) && (
          <button
            type="button"
            onClick={() => {
              setFilterStatus('')
              setFilterProject('')
            }}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="overflow-auto rounded-xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Proyecto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Urgencia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Criticidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Área</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 text-sm text-slate-200">{projectMap[claim.project_id] || claim.project_id}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{claim.claim_type}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{claim.urgency}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    <span className="text-xs">{claim.severity || 'N/D'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{statusBadge(claim.status)}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{claim.area_id || 'No asignada'}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setSelectedId(claim.id)}
                      className={`rounded-md border px-3 py-1 text-xs ${
                        selectedId === claim.id
                          ? 'border-sky-400 text-sky-100'
                          : 'border-slate-700 text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      Ver avance
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-sm text-slate-400">
                    {filterStatus || filterProject ? 'No hay reclamos que coincidan con los filtros' : 'No hay reclamos cargados'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {selectedId && selected && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg">
                <h4 className="text-sm font-semibold text-slate-100 mb-2">Estado actual</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="text-slate-400">Estado</p>
                    <div className="mt-1">{statusBadge(selected.status)}</div>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-400">Urgencia</p>
                    <p className="font-semibold text-slate-100">{selected.urgency}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-400">Severidad</p>
                    <p className="font-semibold text-slate-100">{selected.severity}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg">
                <h4 className="text-sm font-semibold text-slate-100 mb-2">Área asignada</h4>
                <div className="text-sm">
                  <p className="text-2xl font-bold text-violet-400">
                    {selected.area_id && areaMap[selected.area_id]
                      ? areaMap[selected.area_id]
                      : 'Sin asignar'}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {selected.area_id
                      ? 'Tu reclamo está siendo atendido por esta área'
                      : 'Pronto se asignará tu reclamo a un área'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg">
                <h4 className="text-sm font-semibold text-slate-100 mb-2">Proyecto</h4>
                <div className="text-sm space-y-2">
                  <div>
                    <p className="text-slate-400">Nombre</p>
                    <p className="font-semibold text-slate-100">
                      {projectMap[selected.project_id] || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Tipo</p>
                    <p className="font-semibold text-slate-100">{selected.claim_type}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Historial del reclamo</h3>
                <p className="text-sm text-slate-400">Seguimiento completo de tu reclamo</p>
              </div>
              <Timeline events={timeline} isPublic={true} />
            </div>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <Modal isOpen={isModalOpen} onClose={closeModal} title="Registrar reclamo">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Proyecto
              </label>
              <select
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                value={form.project_id}
                onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
                required
              >
                <option value="">Seleccioná un proyecto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Tipo de reclamo
              </label>
              <input
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Ej: Error en funcionalidad, Problema de rendimiento"
                value={form.claim_type}
                onChange={(e) => setForm((f) => ({ ...f, claim_type: e.target.value }))}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Urgencia
                </label>
                <select
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  value={form.urgency}
                  onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
                  required
                >
                  {urgencyOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">Tiempo requerido para atención</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Nivel de Criticidad
                </label>
                <select
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                  required
                >
                  {severityOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">Impacto en el negocio/operación</p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Descripción
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Describe detalladamente el problema o situación que estás reportando..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                required
              />
              <p className="mt-1 text-xs text-slate-400">Incluí pasos para reproducir el problema si aplica</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-60"
              >
                {loading ? 'Registrando...' : 'Registrar reclamo'}
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
