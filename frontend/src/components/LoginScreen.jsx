import { useState } from 'react'
import logo from '../assets/images/logo.png'

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
        <div className="mb-8 space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-40 h-40 overflow-hidden rounded-2xl">
              <img src={logo} alt="Gestión de Reclamos" className="w-full h-full object-cover scale-110" />
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-400 via-blue-400 to-sky-500 bg-clip-text text-transparent mb-2">
              Gestión de Reclamos
            </h1>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 font-medium mb-3">
              Sistema Integral
            </p>
            <p className="text-slate-400 text-sm">Admin / Empleado / Cliente</p>
          </div>
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
