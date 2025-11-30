import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Cleanup después de cada test
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
})

// Mock de fetch global
global.fetch = vi.fn()

// Mock de import.meta.env
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:8000/api')
})
