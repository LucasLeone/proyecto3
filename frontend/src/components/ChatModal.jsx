export function ChatModal({ isOpen, onClose, comments, currentUser, newComment, setNewComment, onSubmit, loading }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl h-[80vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/95 backdrop-blur px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-100">Chat Interno</h2>
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
          {comments.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">No hay comentarios aún</p>
                <p className="text-xs text-slate-600 mt-1">Sé el primero en comentar</p>
              </div>
            </div>
          ) : (
            comments.map((comment) => {
              const isOwnComment = comment.actor_id === currentUser?.id
              return (
                <div key={comment.id} className={`flex ${isOwnComment ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isOwnComment ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isOwnComment
                          ? 'bg-sky-600 text-white rounded-br-sm'
                          : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{comment.details?.comment || ''}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 px-2 ${isOwnComment ? 'justify-end' : 'justify-start'}`}>
                      {!isOwnComment && comment.actor_name && (
                        <span className="text-xs font-medium text-slate-400">{comment.actor_name}</span>
                      )}
                      <span className="text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
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

        <div className="border-t border-slate-800 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit()
            }}
            className="flex gap-3"
          >
            <textarea
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none"
              rows={2}
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (newComment.trim()) onSubmit()
                }
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || loading}
              className="rounded-lg bg-sky-500 px-6 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-2">Presiona Enter para enviar, Shift+Enter para nueva línea</p>
        </div>
      </div>
    </div>
  )
}
