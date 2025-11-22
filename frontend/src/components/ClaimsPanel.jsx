import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Timeline } from './Timeline'
import { Modal } from './Modal'
import { ChatModal } from './ChatModal'
import { ManageClaimModal } from './ManageClaimModal'

const statusOptions = ['Ingresado', 'En Proceso', 'Resuelto']
const priorityOptions = ['Baja', 'Media', 'Alta']

export function ClaimsPanel({ token, areas, projects, clients, user }) {
  const [claims, setClaims] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const [timeline, setTimeline] = useState([])
  const [comment, setComment] = useState('')
  const [reason, setReason] = useState('')
  const [subArea, setSubArea] = useState('')
  const [actionDescription, setActionDescription] = useState('')
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)

  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects],
  )
  const clientMap = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c.company_name || c.email])),
    [clients],
  )
  const areaMap = useMemo(() => Object.fromEntries(areas.map((a) => [a.id, a.name])), [areas])

  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      if (filterStatus && claim.status !== filterStatus) return false
      if (filterClient && claim.client_id !== filterClient && claim.created_by !== filterClient) return false
      return true
    })
  }, [claims, filterStatus, filterClient])

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
      const updated = await api.updateClaim(token, id, payload)
      setReason('')
      setSubArea('')
      // Actualizar el claim en la lista local inmediatamente
      setClaims(prev => prev.map(c => c.id === id ? updated : c))
      // Recargar timeline para mostrar el nuevo evento
      await loadTimeline(id)
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

  const submitAction = async () => {
    if (!actionDescription.trim() || !selectedId) return
    setLoading(true)
    setError(null)
    try {
      await api.addAction(token, selectedId, actionDescription.trim())
      setActionDescription('')
      loadTimeline(selectedId)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Reclamos</p>
            <h2 className="text-xl font-semibold">Asignación y triaje</h2>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div>
            <select
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
          </div>
          <div>
            <select
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
            >
              <option value="">Todos los clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name || c.email}
                </option>
              ))}
            </select>
          </div>
          {(filterStatus || filterClient) && (
            <button
              type="button"
              onClick={() => {
                setFilterStatus('')
                setFilterClient('')
              }}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500"
            >
              Limpiar filtros
            </button>
          )}
          <button
            onClick={load}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-slate-500"
          >
            Actualizar
          </button>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Criticidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Área</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredClaims.map((claim) => (
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
                    <span className="text-xs">{claim.severity || 'N/D'}</span>
                  </td>
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
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-4 text-center text-sm text-slate-400">
                    {filterStatus || filterClient ? 'No hay reclamos que coincidan con los filtros' : 'No hay reclamos cargados'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && selected && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Detalle</p>
            <h3 className="text-lg font-semibold mb-4">Reclamo seleccionado</h3>

            <div className="space-y-4">
              {/* Información de lectura */}
              <div className="text-sm space-y-3">
                <div>
                  <p className="text-slate-400">Proyecto</p>
                  <p className="font-semibold text-slate-100">
                    {projectMap[selected.project_id] || selected.project_id}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cliente: {clientMap[selected.created_by] || selected.created_by || 'N/D'}
                  </p>
                </div>

                {selected.description && (
                  <div>
                    <p className="text-slate-400">Descripción del cliente</p>
                    <p className="text-slate-200 text-sm bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      {selected.description}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-slate-400">Estado actual</p>
                  <p className="font-semibold text-slate-100">{selected.status}</p>
                </div>

                <div>
                  <p className="text-slate-400">Prioridad</p>
                  <p className="font-semibold text-slate-100">{selected.priority || 'Media'}</p>
                </div>

                <div>
                  <p className="text-slate-400">Área asignada</p>
                  <p className="font-semibold text-slate-100">
                    {selected.area_id ? areaMap[selected.area_id] || 'Sin nombre' : 'Sin asignar'}
                  </p>
                </div>

                {selected.sub_area && (
                  <div>
                    <p className="text-slate-400">Sub-área</p>
                    <p className="font-semibold text-slate-100">{selected.sub_area}</p>
                  </div>
                )}

                {selected.attachment_url && (
                  <div>
                    <p className="text-slate-400 mb-2">Archivo adjunto</p>
                    <a
                      href={selected.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-900/50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{selected.attachment_name || 'Descargar archivo'}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-800">
                <label className="text-sm text-slate-200 block mb-2">Acciones rápidas</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsChatModalOpen(true)}
                    disabled={loading}
                    className="rounded-lg border border-sky-700 bg-sky-900/30 px-3 py-2 text-sm text-sky-100 hover:bg-sky-900/50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat Interno
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManageModalOpen(true)}
                    disabled={loading}
                    className="rounded-lg border border-violet-700 bg-violet-900/30 px-3 py-2 text-sm text-violet-100 hover:bg-violet-900/50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Gestionar Reclamo
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg md:col-span-3">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Timeline completo</h3>
              <p className="text-sm text-slate-400">Historial detallado de todas las acciones realizadas</p>
            </div>
            <Timeline events={timeline.filter((ev) => ev.action !== 'comment')} isPublic={false} />
          </div>
        </div>
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        comments={timeline.filter((ev) => ev.action === 'comment')}
        currentUser={user}
        newComment={comment}
        setNewComment={setComment}
        onSubmit={submitComment}
        loading={loading}
      />

      {/* Manage Claim Modal */}
      <ManageClaimModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        claim={selected}
        areas={areas}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        onUpdate={updateClaim}
        actionDescription={actionDescription}
        setActionDescription={setActionDescription}
        onSubmitAction={submitAction}
        loading={loading}
      />
    </div>
  )
}
