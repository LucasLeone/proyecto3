import { useState, useEffect } from 'react'
import { Modal } from './Modal'

export function ManageClaimModal({
  isOpen,
  onClose,
  claim,
  areas,
  statusOptions,
  priorityOptions,
  onUpdate,
  actionDescription,
  setActionDescription,
  onSubmitAction,
  loading,
}) {
  const [localStatus, setLocalStatus] = useState('')
  const [localAreaId, setLocalAreaId] = useState('')
  const [reason, setReason] = useState('')
  const [subArea, setSubArea] = useState('')
  const [resolutionDescription, setResolutionDescription] = useState('')

  useEffect(() => {
    if (claim) {
      setLocalStatus(claim.status)
      setLocalAreaId(claim.area_id || '')
      setSubArea(claim.sub_area || '')
      setResolutionDescription('')
      setReason('')
    }
  }, [claim])

  if (!claim) return null

  const isResolved = claim.status === 'Resuelto'
  
  const hasChanges = () => {
    return (
      localStatus !== claim.status ||
      localAreaId !== (claim.area_id || '') ||
      subArea !== (claim.sub_area || '') ||
      actionDescription.trim() !== '' ||
      resolutionDescription.trim() !== ''
    )
  }

  const handleSaveAll = async () => {
    const updates = {}
    
    // Validar motivo de derivación si cambió el área
    const hadArea = Boolean(claim.area_id)
    const areaChanged = localAreaId !== (claim.area_id || '')
    if (hadArea && areaChanged && !reason.trim()) {
      alert('La derivación de área requiere un motivo')
      return
    }

    // Validar descripción de resolución si cambia a Resuelto
    if (localStatus !== claim.status && localStatus === 'Resuelto') {
      if (!resolutionDescription.trim()) {
        alert('Debes proporcionar una descripción detallada de la resolución')
        return
      }
    }

    // Estado
    if (localStatus !== claim.status) {
      updates.status = localStatus
      if (localStatus === 'Resuelto') {
        updates.resolution_description = resolutionDescription.trim()
      }
    }

    // Área
    if (areaChanged) {
      updates.area_id = localAreaId || null
      updates.reason = reason
    }

    // Sub-área
    if (subArea !== (claim.sub_area || '')) {
      updates.sub_area = subArea
    }

    // Aplicar cambios al claim
    if (Object.keys(updates).length > 0) {
      await onUpdate(claim.id, updates)
    }

    // Registrar acción si hay descripción
    if (actionDescription.trim()) {
      await onSubmitAction()
    }

    // Cerrar modal después de guardar
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Reclamo">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        {/* Estado */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-200">Estado</label>
          <select
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50"
            value={localStatus}
            onChange={(e) => setLocalStatus(e.target.value)}
            disabled={isResolved || loading}
          >
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción de resolución - solo visible cuando se cambia a Resuelto */}
        {localStatus === 'Resuelto' && claim.status !== 'Resuelto' && (
          <div className="grid gap-2 p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
            <label className="text-sm font-medium text-emerald-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Descripción de Resolución <span className="text-red-400">*</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
              placeholder="Describe detalladamente cómo se resolvió el reclamo. Esta información será visible para el cliente."
              rows={4}
              value={resolutionDescription}
              onChange={(e) => setResolutionDescription(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-emerald-300/70">Esta descripción se mostrará al cliente para que sepa cómo se resolvió su reclamo.</p>
          </div>
        )}

        {/* Segunda fila: Área y Sub-área */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-200">
              Área <span className="text-xs text-slate-400">(requiere motivo al cambiar)</span>
            </label>
            <select
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50"
              value={localAreaId}
              onChange={(e) => setLocalAreaId(e.target.value)}
              disabled={isResolved || loading}
            >
              <option value="">Sin asignar</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none disabled:opacity-50"
              placeholder="Motivo de derivación"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isResolved || loading}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-200">
              Sub-área <span className="text-xs text-slate-400">(no visible al cliente)</span>
            </label>
            <select
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50"
              value={subArea}
              onChange={(e) => setSubArea(e.target.value)}
              disabled={isResolved || loading || !localAreaId}
            >
              <option value="">Sin sub-área</option>
              {localAreaId && areas.find(a => a.id === localAreaId)?.sub_areas?.map((sa) => (
                <option key={sa.id} value={sa.name}>
                  {sa.name}
                </option>
              ))}
            </select>
            {!localAreaId && (
              <p className="text-xs text-slate-400">Primero selecciona un área</p>
            )}
          </div>
        </div>

        {/* Registrar acción - ancho completo */}
        <div className="pt-3 border-t border-slate-700">
          <label className="text-sm font-medium text-slate-200 block mb-2">Registrar acción realizada (opcional)</label>
          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none resize-none disabled:opacity-50"
            placeholder="Ej: Revisé los logs del sistema, Apliqué parche de seguridad, etc."
            rows={3}
            value={actionDescription}
            onChange={(e) => setActionDescription(e.target.value)}
            disabled={isResolved || loading}
          />
        </div>

        {/* Botón único de guardar */}
        <div className="pt-4 border-t border-slate-700 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={!hasChanges() || isResolved || loading}
            className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
