import logo from '../assets/images/logo.png'

export function Layout({ user, role, onLogout, tabs, activeTab, onSelectTab, children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800/60 bg-gradient-to-r from-slate-900/80 to-slate-900/60 backdrop-blur px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
              <img src={logo} alt="Gestión de Reclamos" className="w-full h-full object-cover scale-110" />
            </div>
            
            {/* Título */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-400 via-blue-400 to-sky-500 bg-clip-text text-transparent">
                Gestión de Reclamos
              </h1>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500 font-medium">
                Sistema Integral
              </p>
            </div>
          </div>
          
          {/* Usuario y logout */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-200">{user?.full_name || user?.email}</p>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{role}</p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium hover:border-slate-500 hover:bg-slate-800 hover:text-slate-100 transition-all"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <div className="px-6 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm border ${
                activeTab === tab.id
                  ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 shadow-xl p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
