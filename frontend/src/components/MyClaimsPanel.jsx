import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const urgencyOptions = ['Baja', 'Media', 'Alta']
const statusOrder = ['Ingresado', 'En Proceso', 'Resuelto']

export function MyClaimsPanel({ token, projects }) {
  const [claims, setClaims] = useState([])
  const [timeline, setTimeline] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ project_id: '', claim_type: '', urgency: 'Media', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name])), [projects])

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
      setForm({ project_id: '', claim_type: '', urgency: 'Media', description: '' })
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Reclamos</p>
            <h2 className="text-xl font-semibold">Mis reclamos</h2>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <select
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
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
          <input
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
            placeholder="Tipo de reclamo"
            value={form.claim_type}
            onChange={(e) => setForm((f) => ({ ...f, claim_type: e.target.value }))}
            required
          />
          <select
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
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
          <textarea
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm md:col-span-1"
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            required
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-60"
            >
              Registrar reclamo
            </button>
          </div>
        </form>

        <div className="overflow-auto rounded-xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Proyecto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Urgencia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Área</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 text-sm text-slate-200">{projectMap[claim.project_id] || claim.project_id}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{claim.claim_type}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{claim.urgency}</td>
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
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-sm text-slate-400">
                    No hay reclamos cargados
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
          <h4 className="text-sm font-semibold text-slate-100 mb-2">Estado actual</h4>
          {!selectedId ? (
            <p className="text-sm text-slate-400">Selecciona un reclamo para ver detalles.</p>
          ) : (
            <>
              {claims
                .filter((c) => c.id === selectedId)
                .map((claim) => (
                  <div key={claim.id} className="space-y-2 text-sm">
                    <p className="text-slate-300">ID: <span className="font-mono">{claim.id.slice(0, 8)}</span></p>
                    <p className="text-slate-300">Estado: {statusBadge(claim.status)}</p>
                    <p className="text-slate-300">Área responsable: {claim.area_id || 'No asignada'}</p>
                  </div>
                ))}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
          <h4 className="text-sm font-semibold text-slate-100 mb-2">Timeline</h4>
          {!selectedId ? (
            <p className="text-sm text-slate-400">Selecciona un reclamo.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {timeline.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-slate-800 px-3 py-2 text-sm">
                  <p className="text-slate-200">
                    {ev.action === 'status_changed'
                      ? `Estado: ${ev.details?.from} → ${ev.details?.to}`
                      : ev.action}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(ev.created_at).toLocaleString()}</p>
                </div>
              ))}
              {timeline.length === 0 ? (
                <p className="text-xs text-slate-500">Sin eventos aún</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
