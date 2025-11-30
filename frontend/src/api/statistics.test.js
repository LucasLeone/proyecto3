import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as statistics from './statistics'
import client from './client'

vi.mock('./client.js', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('Statistics API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('claims_session', JSON.stringify({ token: 'test-token' }))
  })

  describe('getToken helper', () => {
    it('debe obtener token desde localStorage', async () => {
      client.get.mockResolvedValueOnce({ total: 10 })

      await statistics.getStatistics()

      expect(client.get).toHaveBeenCalledWith(
        expect.any(String),
        'test-token'
      )
    })

    it('debe manejar sesión inválida en localStorage', async () => {
      localStorage.setItem('claims_session', 'invalid-json')
      client.get.mockResolvedValueOnce({ total: 0 })

      await statistics.getStatistics()

      expect(client.get).toHaveBeenCalledWith(
        expect.any(String),
        null
      )
    })
  })

  describe('getStatistics', () => {
    it('debe obtener estadísticas sin filtros', async () => {
      const mockData = { total: 100, resolved: 50 }
      client.get.mockResolvedValueOnce(mockData)

      const result = await statistics.getStatistics()

      expect(client.get).toHaveBeenCalledWith('/statistics/?', 'test-token')
      expect(result).toEqual(mockData)
    })

    it('debe obtener estadísticas con todos los filtros', async () => {
      const mockData = { total: 20 }
      client.get.mockResolvedValueOnce(mockData)

      const filters = {
        clientId: '5',
        employeeId: '10',
        projectType: 'Construcción',
        areaId: '3',
        status: 'Resuelto',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      }

      await statistics.getStatistics(filters)

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('client_id=5')
      expect(call).toContain('employee_id=10')
      expect(call).toContain('project_type=Construcci%C3%B3n')
      expect(call).toContain('area_id=3')
      expect(call).toContain('status=Resuelto')
      expect(call).toContain('start_date=2025-01-01')
      expect(call).toContain('end_date=2025-12-31')
    })
  })

  describe('getClaimsByMonth', () => {
    it('debe obtener reclamos por mes sin filtros', async () => {
      const mockData = { months: [] }
      client.get.mockResolvedValueOnce(mockData)

      const result = await statistics.getClaimsByMonth()

      expect(client.get).toHaveBeenCalledWith('/statistics/by-month/?', 'test-token')
      expect(result).toEqual(mockData)
    })

    it('debe obtener reclamos por mes con filtros', async () => {
      const mockData = { months: [{ month: 1, count: 5 }] }
      client.get.mockResolvedValueOnce(mockData)

      await statistics.getClaimsByMonth({
        clientId: '7',
        employeeId: '2',
        year: '2025',
      })

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('client_id=7')
      expect(call).toContain('employee_id=2')
      expect(call).toContain('year=2025')
    })
  })

  describe('getClaimsByStatus', () => {
    it('debe obtener reclamos por estado', async () => {
      const mockData = { statuses: [] }
      client.get.mockResolvedValueOnce(mockData)

      await statistics.getClaimsByStatus({
        clientId: '3',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
      })

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('/statistics/by-status/')
      expect(call).toContain('client_id=3')
      expect(call).toContain('start_date=2025-01-01')
    })
  })

  describe('getClaimsByType', () => {
    it('debe obtener reclamos por tipo con filtros', async () => {
      const mockData = { types: [] }
      client.get.mockResolvedValueOnce(mockData)

      await statistics.getClaimsByType({
        clientId: '1',
        employeeId: '5',
        areaId: '2',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      })

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('/statistics/by-type/')
      expect(call).toContain('client_id=1')
      expect(call).toContain('area_id=2')
    })
  })

  describe('getClaimsByArea', () => {
    it('debe obtener reclamos por área', async () => {
      const mockData = { areas: [] }
      client.get.mockResolvedValueOnce(mockData)

      await statistics.getClaimsByArea({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      })

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('/statistics/by-area/')
      expect(call).toContain('start_date=2025-01-01')
      expect(call).toContain('end_date=2025-12-31')
    })
  })

  describe('getClaimsByProject', () => {
    it('debe obtener reclamos por proyecto con filtros', async () => {
      const mockData = { projects: [] }
      client.get.mockResolvedValueOnce(mockData)

      await statistics.getClaimsByProject({
        clientId: '8',
        year: '2025',
        month: '6',
        startDate: '2025-06-01',
        endDate: '2025-06-30',
      })

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('/statistics/by-project/')
      expect(call).toContain('client_id=8')
      expect(call).toContain('year=2025')
      expect(call).toContain('month=6')
    })
  })

  describe('getAverageResolutionTime', () => {
    it('debe obtener tiempo promedio de resolución', async () => {
      const mockData = { avg_time: 48 }
      client.get.mockResolvedValueOnce(mockData)

      await statistics.getAverageResolutionTime({
        employeeId: '3',
        areaId: '1',
        claimType: 'Consulta',
      })

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('/statistics/avg-resolution-time/')
      expect(call).toContain('employee_id=3')
      expect(call).toContain('area_id=1')
      expect(call).toContain('claim_type=Consulta')
    })
  })

  describe('getKPIs', () => {
    it('debe obtener KPIs con filtros', async () => {
      const mockData = {
        total_claims: 100,
        resolved_claims: 80,
        avg_resolution_time: 24,
      }
      client.get.mockResolvedValueOnce(mockData)

      await statistics.getKPIs({
        clientId: '5',
        employeeId: '2',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      })

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('/statistics/kpis/')
      expect(call).toContain('client_id=5')
      expect(call).toContain('start_date=2025-01-01')
    })
  })

  describe('getRatingStats', () => {
    it('debe obtener estadísticas de calificaciones', async () => {
      const mockData = { avg_rating: 4.5, total_ratings: 20 }
      client.get.mockResolvedValueOnce(mockData)

      await statistics.getRatingStats({
        clientId: '7',
        year: '2025',
        month: '3',
        startDate: '2025-03-01',
        endDate: '2025-03-31',
      })

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('/statistics/ratings/')
      expect(call).toContain('client_id=7')
      expect(call).toContain('year=2025')
      expect(call).toContain('month=3')
    })
  })

  describe('getClaimsByEmployee', () => {
    it('debe obtener reclamos por empleado', async () => {
      const mockData = { employees: [] }
      client.get.mockResolvedValueOnce(mockData)

      await statistics.getClaimsByEmployee({
        areaId: '4',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      })

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('/statistics/by-employee/')
      expect(call).toContain('area_id=4')
    })
  })

  describe('Manejo de errores', () => {
    it('debe propagar errores de la API', async () => {
      const error = new Error('Network error')
      client.get.mockRejectedValueOnce(error)

      await expect(statistics.getStatistics()).rejects.toThrow('Network error')
    })
  })

  describe('URL encoding', () => {
    it('debe codificar correctamente caracteres especiales en filtros', async () => {
      client.get.mockResolvedValueOnce({})

      await statistics.getStatistics({
        projectType: 'Construcción & Mantenimiento',
      })

      const call = client.get.mock.calls[0][0]
      expect(call).toContain('project_type=Construcci%C3%B3n')
    })
  })
})
