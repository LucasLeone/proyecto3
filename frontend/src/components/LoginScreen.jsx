import { useState } from 'react'

export function LoginScreen({ onLogin, loading, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    if (!email || !password) {
      setLocalError('Ingresá email y contraseña')
      return
    }
    try {
      await onLogin(email, password)
    } catch (err) {
      // error handled upstream
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800/70 bg-slate-900/70 shadow-2xl p-10">
        <div className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Sistema de reclamos</p>
          <h1 className="text-3xl font-semibold">Acceso</h1>
          <p className="text-slate-300 text-sm">Admin / Empleado / Cliente</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm text-slate-200">Email</span>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-50 focus:border-sky-400 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-200">Contraseña</span>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-50 focus:border-sky-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </label>
          {(localError || error) ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {localError || error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-500 px-4 py-3 font-semibold text-slate-900 hover:bg-sky-400 transition disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
