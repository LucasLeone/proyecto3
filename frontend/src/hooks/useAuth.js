import { useEffect, useState } from 'react'
import { api } from '../api/client'

const storageKey = 'claims_session'

export function useAuth() {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return { token: null, user: null }
    try {
      return JSON.parse(stored)
    } catch (err) {
      return { token: null, user: null }
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(session))
  }, [session])

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.login(email, password)
      setSession({ token: data.token, user: data.user, role: data.role })
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setSession({ token: null, user: null })
  }

  return {
    token: session.token,
    user: session.user,
    role: session.role,
    login,
    logout,
    loading,
    error,
  }
}
