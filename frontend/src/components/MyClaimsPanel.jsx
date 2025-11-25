import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Modal } from './Modal'
import { Timeline } from './Timeline'
import ClientFeedbackPanel from './ClientFeedbackPanel'

const priorityOptions = ['Baja', 'Media', 'Alta']
const severityOptions = ['S1 - Crítico', 'S2 - Alto', 'S3 - Medio', 'S4 - Bajo']
const statusOrder = ['Ingresado', 'En Proceso', 'Resuelto']

export function MyClaimsPanel({ token, projects, areas }) {
  const [claims, setClaims] = useState([])
  const [timeline, setTimeline] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ project_id: '', claim_type: '', priority: 'Media', severity: 'S3 - Medio', description: '' })
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)

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
      const formData = new FormData()
      formData.append('project_id', form.project_id)
      formData.append('claim_type', form.claim_type)
      formData.append('priority', form.priority)
      formData.append('severity', form.severity)
      formData.append('description', form.description)
      
      if (attachmentFile) {
        formData.append('attachment', attachmentFile)
      }
      
      await api.createClaim(token, formData)
      setForm({ project_id: '', claim_type: '', priority: 'Media', severity: 'S3 - Medio', description: '' })
      setAttachmentFile(null)
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
    setForm({ project_id: '', claim_type: '', priority: 'Media', severity: 'S3 - Medio', description: '' })
    setAttachmentFile(null)
  }

  const handleFeedbackSubmit = async ({ rating, feedback }) => {
    setFeedbackLoading(true)
    setError(null)
    try {
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      await api.addClientFeedback(token, selectedId, { rating, feedback })
      // Recargar el reclamo actualizado y el timeline
      await load()
      await loadTimeline(selectedId)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setFeedbackLoading(false)
    }
  }

  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      if (filterStatus && claim.status !== filterStatus) return false
      return true
    })
  }, [claims, filterStatus])

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
        {filterStatus && (
          <button
            type="button"
            onClick={() => setFilterStatus('')}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500"
          >
            Limpiar filtro
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Prioridad</th>
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
                  <td className="px-4 py-3 text-sm text-slate-300">{claim.priority}</td>
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
                    {filterStatus ? 'No hay reclamos que coincidan con el filtro' : 'No hay reclamos cargados'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {selectedId && selected && (
          <div className="space-y-4">
            {/* Header con información principal */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/70 p-6 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-slate-100">{selected.claim_type}</h3>
                    <span className={`rounded-full px-4 py-1.5 text-xs font-semibold border ${
                      selected.status === 'Resuelto' 
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                        : selected.status === 'En Proceso'
                        ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                        : 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                    }`}>
                      {selected.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Seguimiento de tu reclamo
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                {/* Prioridad y Severidad */}
                <div className="rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Prioridad</p>
                      <p className="text-sm font-bold text-slate-100">{selected.priority}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400">Severidad</p>
                    <p className="text-sm font-semibold text-rose-300">{selected.severity || 'N/D'}</p>
                  </div>
                </div>

                {/* Proyecto */}
                <div className="rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">Proyecto</p>
                      <p className="text-sm font-bold text-slate-100 truncate">{projectMap[selected.project_id] || '—'}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400">Tipo</p>
                    <p className="text-sm font-semibold text-blue-300 truncate">{selected.claim_type}</p>
                  </div>
                </div>

                {/* Área Asignada */}
                <div className="rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">Área asignada</p>
                      <p className="text-sm font-bold text-slate-100 truncate">
                        {selected.area_id && areaMap[selected.area_id]
                          ? areaMap[selected.area_id]
                          : 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-700/50">
                    <p className="text-xs text-violet-300">
                      {selected.area_id
                        ? 'Área responsable'
                        : 'Pendiente de asignación'}
                    </p>
                  </div>
                </div>

                {/* Estado y Archivo */}
                <div className="rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Estado</p>
                      <p className="text-sm font-bold text-slate-100">{selected.status}</p>
                    </div>
                  </div>
                  {selected.attachment_url && (
                    <div className="pt-3 border-t border-slate-700/50">
                      <a
                        href={selected.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate">Descargar archivo</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              {selected.description && (
                <div className="mt-4 rounded-xl bg-slate-800/30 border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tu descripción</p>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{selected.description}</p>
                </div>
              )}
            </div>

            {/* Botón y Display de Retroalimentación del Cliente */}
            {(selected.status === 'En Proceso' || selected.status === 'Resuelto') && (
              <div className="rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                      💬 Retroalimentación del Cliente
                    </h3>
                    
                    {(selected.client_feedback || selected.client_rating) ? (
                      // Mostrar retroalimentación existente
                      <div className="space-y-3">
                        <p className="text-sm text-slate-400">
                          Has compartido tu opinión sobre este reclamo:
                        </p>
                        
                        {selected.client_rating && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                            <span className="text-sm font-medium text-slate-300">Tu calificación:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-5 h-5 ${star <= selected.client_rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm text-yellow-400 font-semibold">
                              {selected.client_rating === 1 && 'Muy insatisfecho'}
                              {selected.client_rating === 2 && 'Insatisfecho'}
                              {selected.client_rating === 3 && 'Regular'}
                              {selected.client_rating === 4 && 'Satisfecho'}
                              {selected.client_rating === 5 && 'Muy satisfecho'}
                            </span>
                          </div>
                        )}
                        
                        {selected.client_feedback && (
                          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                              Tu comentario:
                            </p>
                            <p className="text-sm text-slate-200 italic leading-relaxed">
                              "{selected.client_feedback}"
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Retroalimentación enviada correctamente</span>
                        </div>
                      </div>
                    ) : (
                      // Mostrar botón para enviar retroalimentación
                      <div>
                        <p className="text-sm text-slate-400 mb-4">
                          {selected.status === 'Resuelto' 
                            ? 'Comparte tu experiencia y califica cómo se resolvió tu reclamo'
                            : 'Deja comentarios sobre el progreso de tu reclamo'}
                        </p>
                        <button
                          onClick={() => setIsFeedbackModalOpen(true)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <span>Enviar Retroalimentación</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Retroalimentación */}
            <ClientFeedbackPanel
              claim={selected}
              onSubmit={handleFeedbackSubmit}
              isLoading={feedbackLoading}
              isOpen={isFeedbackModalOpen}
              onClose={() => setIsFeedbackModalOpen(false)}
            />

            {/* Timeline */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Historial del reclamo</h3>
                <p className="text-sm text-slate-400">Seguimiento completo de tu reclamo</p>
              </div>
              <Timeline events={timeline.filter((ev) => ev.action !== 'comment')} isPublic={true} />
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
                  Prioridad
                </label>
                <select
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  required
                >
                  {priorityOptions.map((u) => (
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Archivo adjunto (opcional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                  onChange={(e) => setAttachmentFile(e.target.files[0])}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-sky-500/20 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-sky-200 hover:file:bg-sky-500/30 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              {attachmentFile && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2">
                  <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-xs text-sky-200 flex-1">{attachmentFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachmentFile(null)}
                    className="text-sky-400 hover:text-sky-300"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">Formatos permitidos: PDF, DOC, DOCX, imágenes (JPG, PNG, GIF), TXT. Máximo 10MB</p>
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
