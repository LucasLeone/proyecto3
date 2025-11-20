export function Overview({ user }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sesión</p>
        <p className="text-lg font-semibold mt-2">{user?.full_name || user?.email}</p>
        <p className="text-sm text-slate-400 mt-1">{user?.company_name || 'Usuario interno'}</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rol</p>
        <p className="text-lg font-semibold mt-2">{user?.role || 'N/D'}</p>
        <p className="text-sm text-slate-400 mt-1">Define lo que podés ver y editar</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estado</p>
        <p className="text-lg font-semibold mt-2">En construcción</p>
        <p className="text-sm text-slate-400 mt-1">Próximos módulos: Reclamos, Auditoría, KPI</p>
      </div>
    </div>
  )
}
