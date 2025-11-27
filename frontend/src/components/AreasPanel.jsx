import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Modal } from './Modal'

export function AreasPanel({ token, readOnly = false, onChange }) {
  const [areas, setAreas] = useState([])
  const [form, setForm] = useState({ name: '', description: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubAreasModalOpen, setIsSubAreasModalOpen] = useState(false)
  const [selectedArea, setSelectedArea] = useState(null)
  const [subAreaForm, setSubAreaForm] = useState('')
  const [editingSubAreaId, setEditingSubAreaId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listAreas(token)
      setAreas(data)
      if (onChange) onChange(data)
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
    if (readOnly) return
    setLoading(true)
    setError(null)
    try {
      if (editingId) {
        await api.updateArea(token, editingId, form)
      } else {
        await api.createArea(token, form)
      }
      setForm({ name: '', description: '' })
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
    setForm({ name: '', description: '' })
  }

  const startEdit = (area) => {
    setEditingId(area.id)
    setForm({ name: area.name, description: area.description || '' })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (readOnly) return
    setLoading(true)
    setError(null)
    try {
      await api.deleteArea(token, id)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openSubAreasModal = (area) => {
    setSelectedArea(area)
    setIsSubAreasModalOpen(true)
    setSubAreaForm('')
    setEditingSubAreaId(null)
  }

  const closeSubAreasModal = () => {
    setIsSubAreasModalOpen(false)
    setSelectedArea(null)
    setSubAreaForm('')
    setEditingSubAreaId(null)
  }

  const handleSubAreaSubmit = async (e) => {
    e.preventDefault()
    if (readOnly || !selectedArea) return
    setLoading(true)
    setError(null)
    try {
      if (editingSubAreaId) {
        await api.updateSubArea(token, selectedArea.id, editingSubAreaId, subAreaForm)
      } else {
        await api.addSubArea(token, selectedArea.id, subAreaForm)
      }
      setSubAreaForm('')
      setEditingSubAreaId(null)
      await load()
      // Actualizar el área seleccionada
      const updatedArea = areas.find(a => a.id === selectedArea.id)
      if (updatedArea) setSelectedArea(updatedArea)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startEditSubArea = (subArea) => {
    setEditingSubAreaId(subArea.id)
    setSubAreaForm(subArea.name)
  }

  const cancelEditSubArea = () => {
    setEditingSubAreaId(null)
    setSubAreaForm('')
  }

  const handleDeleteSubArea = async (subAreaId) => {
    if (readOnly || !selectedArea) return
    setLoading(true)
    setError(null)
    try {
      await api.deleteSubArea(token, selectedArea.id, subAreaId)
      await load()
      // Actualizar el área seleccionada
      const updatedArea = areas.find(a => a.id === selectedArea.id)
      if (updatedArea) setSelectedArea(updatedArea)
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
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Catálogo</p>
          <h2 className="text-xl font-semibold">Áreas</h2>
        </div>
        {!readOnly ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400"
          >
            + Registrar área
          </button>
        ) : (
          <span className="rounded-full border border-sky-400/50 bg-sky-500/10 px-3 py-1 text-xs text-sky-100">
            Consulta
          </span>
        )}
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Sub-áreas</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {areas.map((area) => (
              <tr key={area.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-3 text-sm">{area.name}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{area.description || '—'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{area.sub_areas?.length || 0}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => openSubAreasModal(area)}
                        className="text-xs text-sky-400 hover:text-sky-300 underline"
                      >
                        Gestionar
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {readOnly ? (
                    <span className="text-slate-500">Solo lectura</span>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(area)}
                        className="rounded-md border border-slate-700 px-3 py-1 text-xs hover:border-slate-500"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(area.id)}
                        className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-200 hover:border-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {areas.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-sm text-slate-400">
                  No hay áreas cargadas
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Editar área' : 'Registrar área'}>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Nombre del área
              </label>
              <input
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                placeholder="Ej: Soporte técnico"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Descripción
              </label>
              <input
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                placeholder="Ej: Área encargada del mantenimiento..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-60"
              >
                {editingId ? 'Actualizar área' : 'Crear área'}
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

      {/* Modal de Sub-áreas */}
      {isSubAreasModalOpen && selectedArea ? (
        <Modal isOpen={isSubAreasModalOpen} onClose={closeSubAreasModal} title={`Sub-áreas de ${selectedArea.name}`}>
          <div className="space-y-4">
            {/* Formulario para agregar/editar sub-área */}
            <form onSubmit={handleSubAreaSubmit} className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none"
                placeholder="Nombre de la sub-área"
                value={subAreaForm}
                onChange={(e) => setSubAreaForm(e.target.value)}
                required
              />
              {editingSubAreaId && (
                <button
                  type="button"
                  onClick={cancelEditSubArea}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-slate-500"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-60"
              >
                {editingSubAreaId ? 'Actualizar' : 'Agregar'}
              </button>
            </form>

            {/* Lista de sub-áreas */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sub-áreas registradas ({selectedArea.sub_areas?.length || 0})
              </p>
              {selectedArea.sub_areas && selectedArea.sub_areas.length > 0 ? (
                <div className="space-y-2">
                  {selectedArea.sub_areas.map((subArea) => (
                    <div
                      key={subArea.id}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
                    >
                      <span className="text-sm text-slate-200">{subArea.name}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditSubArea(subArea)}
                          className="rounded-md border border-slate-700 px-3 py-1 text-xs hover:border-slate-500"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubArea(subArea.id)}
                          className="rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-200 hover:border-red-400"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  No hay sub-áreas registradas
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={closeSubAreasModal}
                className="w-full rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-200 hover:border-slate-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
