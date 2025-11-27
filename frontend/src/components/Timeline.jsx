export function Timeline({ events, isPublic = false }) {
  // Validación de eventos
  if (!events || !Array.isArray(events)) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Sin eventos registrados</p>
        </div>
      </div>
    )
  }

  const getEventIcon = (action) => {
    switch (action) {
      case 'created':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      case 'status_changed':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'area_changed':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        )
      case 'priority_changed':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'action_logged':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      case 'client_feedback_added':
      case 'client_rating_added':
      case 'client_comment_added':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getEventColor = (action) => {
    switch (action) {
      case 'created':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30'
      case 'status_changed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'area_changed':
        return 'bg-violet-500/20 text-violet-400 border-violet-500/30'
      case 'priority_changed':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'action_logged':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      case 'client_feedback_added':
      case 'client_rating_added':
      case 'client_comment_added':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const formatEventMessage = (ev, isPublic) => {
    switch (ev.action) {
      case 'created':
        return {
          title: 'Reclamo creado',
          description: 'El reclamo fue registrado en el sistema',
        }
      case 'status_changed':
        return {
          title: 'Cambio de estado',
          description: `${ev.details?.from} → ${ev.details?.to}`,
        }
      case 'area_changed':
        if (isPublic) {
          return {
            title: 'Reclamo derivado',
            description: ev.details?.to_area_name 
              ? `Asignado al área: ${ev.details.to_area_name}`
              : 'Derivado a nueva área',
            extra: ev.details?.reason,
          }
        }
        const fromArea = ev.details?.from_area_name || 'Sin área'
        const toArea = ev.details?.to_area_name || 'Sin área'
        return {
          title: 'Derivación de área',
          description: `${fromArea} → ${toArea}`,
          extra: ev.details?.employee_name
            ? `Derivado por: ${ev.details.employee_name}`
            : null,
          reason: ev.details?.reason,
        }
      case 'priority_changed':
        return {
          title: 'Cambio de prioridad',
          description: `${ev.details?.from || '—'} → ${ev.details?.to || '—'}`,
        }
      case 'sub_area_changed':
        return {
          title: 'Cambio de sub-área',
          description: `${ev.details?.from || '—'} → ${ev.details?.to || '—'}`,
          extra: ev.details?.employee_name
            ? `Cambiado por: ${ev.details.employee_name}`
            : null,
          reason: ev.details?.reason,
        }
      case 'action_logged':
        return {
          title: 'Acción realizada',
          description: ev.details?.action_description || '',
        }
      case 'client_feedback_added':
        return {
          title: 'Retroalimentación del cliente',
          description: ev.details?.feedback || '',
          rating: ev.details?.rating,
        }
      case 'client_rating_added':
        return {
          title: 'Calificación del cliente',
          description: `Calificación: ${ev.details?.rating || 0} estrellas`,
          rating: ev.details?.rating,
        }
      case 'client_comment_added':
        return {
          title: 'Comentario del cliente',
          description: ev.details?.comment || '',
        }
      default:
        return {
          title: ev.action,
          description: '',
        }
    }
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Sin eventos registrados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700" />
      
      <div className="space-y-4">
        {events.map((ev, index) => {
          const message = formatEventMessage(ev, isPublic)
          const colorClasses = getEventColor(ev.action)
          const isFirst = index === 0
          const isLast = index === events.length - 1

          return (
            <div key={ev.id} className="relative flex gap-4">
              <div
                className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${colorClasses} ${
                  isFirst ? 'shadow-lg shadow-sky-500/20' : ''
                }`}
              >
                {getEventIcon(ev.action)}
              </div>

              <div className={`flex-1 pb-2 ${isLast ? '' : 'border-b border-slate-800'}`}>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-900/70 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-100 mb-1">{message.title}</h4>
                      <p className="text-sm text-slate-300 mb-2">{message.description}</p>
                      
                      {message.extra && (
                        <p className="text-xs text-slate-400 mb-1">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {message.extra}
                          </span>
                        </p>
                      )}
                      
                      {message.reason && (
                        <p className="text-xs text-slate-400 mb-1">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Motivo: {message.reason}
                          </span>
                        </p>
                      )}
                      
                      {message.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= message.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(ev.created_at).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        
                        {!isPublic && ev.actor_name && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {ev.actor_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
