export function Layout({ user, role, onLogout, tabs, activeTab, onSelectTab, children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800/60 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Sistema de reclamos</p>
          <h1 className="text-xl font-semibold">Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold">{user?.full_name || user?.email}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">{role}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-slate-500 hover:text-slate-100"
          >
            Cerrar sesión
          </button>
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
