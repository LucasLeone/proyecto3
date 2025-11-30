import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth.js'

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Inicialización', () => {
    it('debe inicializar con sesión vacía cuando no hay datos en localStorage', () => {
      const { result } = renderHook(() => useAuth())
      
      expect(result.current.token).toBeNull()
      expect(result.current.user).toBeNull()
      expect(result.current.role).toBeUndefined()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('debe cargar sesión desde localStorage si existe', () => {
      const mockSession = {
        token: 'test-token-123',
        user: { id: 1, email: 'test@test.com' },
        role: 'admin'
      }
      localStorage.setItem('claims_session', JSON.stringify(mockSession))

      const { result } = renderHook(() => useAuth())

      expect(result.current.token).toBe('test-token-123')
      expect(result.current.user).toEqual({ id: 1, email: 'test@test.com' })
      expect(result.current.role).toBe('admin')
    })

    it('debe manejar JSON inválido en localStorage', () => {
      localStorage.setItem('claims_session', 'invalid-json')

      const { result } = renderHook(() => useAuth())

      expect(result.current.token).toBeNull()
      expect(result.current.user).toBeNull()
    })
  })

  describe('Login', () => {
    it('debe hacer login exitosamente', async () => {
      const mockResponse = {
        token: 'new-token-456',
        user: { id: 2, email: 'user@test.com' },
        role: 'employee'
      }

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        })
      )

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login('user@test.com', 'password123')
      })

      expect(result.current.token).toBe('new-token-456')
      expect(result.current.user).toEqual({ id: 2, email: 'user@test.com' })
      expect(result.current.role).toBe('employee')
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()

      // Verificar que se guardó en localStorage
      const stored = JSON.parse(localStorage.getItem('claims_session'))
      expect(stored.token).toBe('new-token-456')
    })

    it('debe establecer loading durante el login', async () => {
      global.fetch = vi.fn(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ token: 'test', user: {}, role: 'admin' }),
            })
          }, 100)
        })
      )

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.login('test@test.com', 'password')
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('debe manejar errores de login', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ detail: 'Credenciales inválidas' }),
        })
      )

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        try {
          await result.current.login('wrong@test.com', 'wrongpass')
        } catch (err) {
          // Error esperado
        }
      })

      expect(result.current.token).toBeNull()
      expect(result.current.error).toBe('Credenciales inválidas')
      expect(result.current.loading).toBe(false)
    })

    it('debe limpiar error previo al hacer nuevo login', async () => {
      const { result } = renderHook(() => useAuth())

      // Primer login fallido
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ detail: 'Error' }),
        })
      )

      await act(async () => {
        try {
          await result.current.login('test@test.com', 'wrong')
        } catch (err) {
          // ignorar
        }
      })

      expect(result.current.error).toBe('Error')

      // Segundo login exitoso
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ token: 'token', user: {}, role: 'admin' }),
        })
      )

      await act(async () => {
        await result.current.login('test@test.com', 'correct')
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('Logout', () => {
    it('debe hacer logout y limpiar sesión', () => {
      localStorage.setItem('claims_session', JSON.stringify({
        token: 'test-token',
        user: { id: 1 },
        role: 'admin'
      }))

      const { result } = renderHook(() => useAuth())

      expect(result.current.token).toBe('test-token')

      act(() => {
        result.current.logout()
      })

      expect(result.current.token).toBeNull()
      expect(result.current.user).toBeNull()
      
      const stored = JSON.parse(localStorage.getItem('claims_session'))
      expect(stored.token).toBeNull()
    })
  })

  describe('Persistencia en localStorage', () => {
    it('debe persistir cambios de sesión en localStorage', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            token: 'persist-token',
            user: { id: 3, email: 'persist@test.com' },
            role: 'client'
          }),
        })
      )

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login('persist@test.com', 'password')
      })

      await waitFor(() => {
        const stored = localStorage.getItem('claims_session')
        expect(stored).toBeTruthy()
        const parsed = JSON.parse(stored)
        expect(parsed.token).toBe('persist-token')
        expect(parsed.role).toBe('client')
      })
    })
  })
})
