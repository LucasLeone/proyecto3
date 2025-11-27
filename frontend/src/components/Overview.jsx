export function Overview({ user }) {
  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrador',
      employee: 'Empleado',
      client: 'Cliente'
    }
    return roles[role] || role
  }

  const getRoleDescription = (role) => {
    const descriptions = {
      admin: 'Acceso completo al sistema y gestión de usuarios',
      employee: 'Gestión y resolución de reclamos asignados',
      client: 'Creación y seguimiento de reclamos propios'
    }
    return descriptions[role] || 'Usuario del sistema'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[calc(100vh-12rem)]">
      {/* Información del Usuario */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-slate-100 mb-1 truncate">
              {user?.full_name || 'Usuario'}
            </h2>
            <p className="text-slate-400 text-sm mb-3 truncate">{user?.email}</p>
            {user?.company_name && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-medium text-blue-300 truncate">{user.company_name}</span>
              </div>
            )}
            {!user?.company_name && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-purple-300">Personal Interno</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información del Rol */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Rol del Usuario</p>
            <p className="text-xl font-bold text-slate-100">{getRoleLabel(user?.role)}</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          {getRoleDescription(user?.role)}
        </p>
      </div>

      {/* Información del Sistema */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm p-6 lg:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Guía de Uso</p>
            <p className="text-xl font-bold text-slate-100">Sistema de Reclamos</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-400">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="leading-relaxed">
              Utiliza el menú lateral para navegar entre las diferentes secciones disponibles según tu rol.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="leading-relaxed">
              Todos los horarios y fechas se muestran en tu zona horaria local.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
