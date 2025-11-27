import { useMemo } from 'react'

export function ClientFeedbackMessagesModal({ isOpen, onClose, messages = [], loading = false, error = null }) {
  const items = useMemo(() => {
    if (!Array.isArray(messages)) return []
    return [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }, [messages])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl h-[80vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/95 backdrop-blur px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Mensajes del Cliente</h2>
            <p className="text-sm text-slate-400">Comentarios y calificaciones compartidos por el cliente</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/30">
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <svg className="w-10 h-10 mx-auto mb-3 animate-spin text-slate-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <p className="text-sm">Cargando mensajes...</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <svg className="w-14 h-14 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">Sin mensajes del cliente todavía</p>
                <p className="text-xs text-slate-600 mt-1">A medida que el cliente envíe comentarios aparecerán aquí</p>
              </div>
            </div>
          ) : (
            items.map((msg) => {
              const createdAt = new Date(msg.created_at)
              const isFinal = msg.type === 'final'
              const rating = msg.rating

              return (
                <div
                  key={msg.id}
                  className={`rounded-2xl border ${
                    isFinal
                      ? 'border-emerald-500/60 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/70'
                  } p-4 shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide font-semibold text-slate-400">
                        {isFinal ? 'Retroalimentación final' : 'Comentario del cliente'}
                      </p>
                      {msg.message ? (
                        <p className="mt-2 text-sm text-slate-100 whitespace-pre-wrap break-words">{msg.message}</p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-300 italic">(Sin comentario)</p>
                      )}

                      {typeof rating === 'number' && (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs font-medium text-yellow-400">Calificación:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {msg.client_name && (
                        <span className="text-xs text-slate-400">{msg.client_name}</span>
                      )}
                      <span className="text-xs text-slate-500">
                        {createdAt.toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
