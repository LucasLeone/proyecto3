import { useState } from 'react'

const StarIcon = ({ size = 24, filled = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

export default function ClientFeedbackPanel({ claim, onSubmit, isLoading, isOpen, onClose }) {
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [error, setError] = useState(null)

  const canProvideFeedback = claim.status === 'En Proceso' || claim.status === 'Resuelto'
  const canRate = claim.status === 'Resuelto'
  const hasExistingFeedback = claim.client_feedback || claim.client_rating

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validar que no se haya enviado feedback previamente
    if (hasExistingFeedback) {
      setError('Ya has enviado retroalimentación para este reclamo.')
      return
    }

    // Validaciones
    if (canRate && rating === 0) {
      setError('Debes seleccionar una calificación para un reclamo resuelto.')
      return
    }

    if (!feedback.trim()) {
      setError('Debes escribir un comentario.')
      return
    }

    try {
      await onSubmit({
        feedback: feedback.trim(),
        rating: canRate ? rating : null
      })
      // Limpiar formulario y cerrar modal después de enviar
      setFeedback('')
      setRating(0)
      setError(null)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al enviar retroalimentación')
    }
  }

  if (!isOpen || !canProvideFeedback) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                💬 Retroalimentación del Cliente
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {canRate 
                  ? 'Comparte tu experiencia y califica cómo se resolvió tu reclamo'
                  : 'Deja comentarios sobre el progreso de tu reclamo'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800/50"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sistema de calificación por estrellas (solo para reclamos resueltos) */}
          {canRate && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Calificación *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-all duration-200 transform hover:scale-110"
                  >
                    <StarIcon
                      size={32}
                      filled={star <= (hoveredRating || rating)}
                      className={
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400'
                          : 'text-slate-600 hover:text-slate-500'
                      }
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-slate-400 mt-2">
                  {rating === 1 && '⭐ Muy insatisfecho'}
                  {rating === 2 && '⭐⭐ Insatisfecho'}
                  {rating === 3 && '⭐⭐⭐ Regular'}
                  {rating === 4 && '⭐⭐⭐⭐ Satisfecho'}
                  {rating === 5 && '⭐⭐⭐⭐⭐ Muy satisfecho'}
                </p>
              )}
            </div>
          )}

          {/* Campo de comentario */}
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-slate-300 mb-2">
              {canRate ? 'Comentario sobre la resolución *' : 'Comentario sobre el progreso *'}
            </label>
            <textarea
              id="feedback"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder={
                canRate
                  ? 'Describe tu experiencia con la resolución del reclamo...'
                  : 'Comparte tu opinión sobre cómo se está gestionando tu reclamo...'
              }
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? 'Enviando...' : 'Enviar Retroalimentación'}
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}
