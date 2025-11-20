import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const statusOptions = ['Ingresado', 'En Proceso', 'Resuelto']
const priorityOptions = ['Baja', 'Media', 'Alta']

export function ClaimsPanel({ token, areas, projects, clients }) {
  const [claims, setClaims] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const [timeline, setTimeline] = useState([])
  const [comment, setComment] = useState('')
  const [reason, setReason] = useState('')
  const [subArea, setSubArea] = useState('')

  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects],
  )
  const clientMap = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c.company_name || c.email])),
    [clients],
  )
  const areaMap = useMemo(() => Object.fromEntries(areas.map((a) => [a.id, a.name])), [areas])

  const selected = claims.find((c) => c.id === selectedId) || null

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listClaims(token, { status: filterStatus || undefined })
      setClaims(data)
      if (selectedId) {
        const fresh = data.find((c) => c.id === selectedId)
        if (!fresh) {
          setSelectedId(null)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async (id) => {
    try {
      const events = await api.claimTimeline(token, id)
      setTimeline(events)
    } catch (err) {
      setTimeline([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (selectedId) {
      loadTimeline(selectedId)
    }
  }, [selectedId])

  const updateClaim = async (id, payload) => {
    setLoading(true)
    setError(null)
    try {
      await api.updateClaim(token, id, payload)
      setReason('')
      setSubArea('')
      await Promise.all([load(), loadTimeline(id)])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const submitComment = async () => {
    if (!comment.trim() || !selectedId) return
    setLoading(true)
    setError(null)
    try {
      await api.addComment(token, selectedId, comment.trim())
      setComment('')
      loadTimeline(selectedId)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Reclamos</p>
            <h2 className="text-xl font-semibold">Asignación y triaje</h2>
          </div>
          <div className="flex gap-2 items-center">
            <select
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <button
              onClick={load}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-slate-500"
            >
              Actualizar
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Proyecto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Urgencia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Área</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-900/60">
                  <td className="px-4 py-3 text-sm text-slate-200">
                    <span className="font-mono text-xs">{claim.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200">
                    {projectMap[claim.project_id] || claim.project_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200">{claim.claim_type}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{claim.urgency}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {clientMap[claim.client_id] || clientMap[claim.created_by] || 'N/D'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {claim.area_id ? areaMap[claim.area_id] || claim.area_id : 'No asignada'}
                  </td>
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
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-sm text-slate-400">
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
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Detalle</p>
          <h3 className="text-lg font-semibold mb-3">Reclamo seleccionado</h3>

          {!selected ? (
            <p className="text-sm text-slate-400">Selecciona un reclamo para gestionarlo.</p>
          ) : (
            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-slate-400">Proyecto</p>
                <p className="font-semibold text-slate-100">
                  {projectMap[selected.project_id] || selected.project_id}
                </p>
                <p className="text-xs text-slate-400">
                  Cliente: {clientMap[selected.created_by] || selected.created_by || 'N/D'}
                </p>
              </div>
              <div className="grid gap-3">
                <label className="text-sm text-slate-200">Estado</label>
                <select
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
                  value={selected.status}
                  onChange={(e) => updateClaim(selected.id, { status: e.target.value })}
                  disabled={selected.status === 'Resuelto' || loading}
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3">
                <label className="text-sm text-slate-200">Prioridad</label>
                <select
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
                  value={selected.priority || 'Media'}
                  onChange={(e) => updateClaim(selected.id, { priority: e.target.value })}
                  disabled={selected.status === 'Resuelto' || loading}
                >
                  {priorityOptions.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-slate-200">Área (reasignación requiere motivo)</label>
                <select
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
                  value={selected.area_id || ''}
                  onChange={(e) => {
                    const newArea = e.target.value
                    const hadArea = Boolean(selected.area_id)
                    if (hadArea && newArea !== selected.area_id && !reason.trim()) {
                      setError('Ingresá un motivo de derivación')
                      return
                    }
                    updateClaim(selected.id, { area_id: newArea || null, reason })
                  }}
                  disabled={selected.status === 'Resuelto' || loading}
                >
                  <option value="">Sin asignar</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
                  placeholder="Motivo de derivación"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={selected.status === 'Resuelto' || loading}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-slate-200">Sub-área interna</label>
                <input
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
                  placeholder="Sub-área (no visible al cliente)"
                  value={subArea}
                  onChange={(e) => setSubArea(e.target.value)}
                  disabled={selected.status === 'Resuelto' || loading}
                />
                <button
                  type="button"
                  onClick={() => updateClaim(selected.id, { sub_area: subArea })}
                  disabled={selected.status === 'Resuelto' || loading}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-slate-500"
                >
                  Guardar sub-área
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-100">Comentarios internos</h4>
          </div>
          {!selected ? (
            <p className="text-sm text-slate-400 mt-2">Selecciona un reclamo.</p>
          ) : (
            <div className="space-y-3">
              <div className="max-h-60 overflow-y-auto space-y-2 text-sm">
                {timeline
                  .filter((ev) => ev.action === 'comment')
                  .map((ev) => (
                    <div key={ev.id} className="rounded-lg border border-slate-800 px-3 py-2">
                      <p className="text-slate-200">{ev.details?.comment}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(ev.created_at).toLocaleString()} · {ev.actor_role || '—'}
                      </p>
                    </div>
                  ))}
                {timeline.filter((ev) => ev.action === 'comment').length === 0 ? (
                  <p className="text-xs text-slate-500">Sin comentarios</p>
                ) : null}
              </div>
              <textarea
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
                rows={3}
                placeholder="Agregar nota interna"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={selected?.status === 'Resuelto' || loading}
              />
              <button
                type="button"
                onClick={submitComment}
          disabled={!comment.trim() || selected?.status === 'Resuelto' || loading}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-60"
        >
          Guardar comentario
        </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
          <h4 className="text-sm font-semibold text-slate-100 mb-2">Timeline interno</h4>
          {!selected ? (
            <p className="text-sm text-slate-400">Selecciona un reclamo.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeline.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-slate-800 px-3 py-2 text-sm">
                  <p className="text-slate-200">
                    {ev.action} · {ev.details ? JSON.stringify(ev.details) : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(ev.created_at).toLocaleString()} · {ev.actor_role || '—'}
                  </p>
                </div>
              ))}
              {timeline.length === 0 ? (
                <p className="text-xs text-slate-500">Sin eventos</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
