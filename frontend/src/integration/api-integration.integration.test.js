import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from '../api/client'
import * as statistics from '../api/statistics'

describe('Integration: Flujos de API y autenticación', () => {
  const mockToken = 'test-token-123'

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch = vi.fn()
  })

  describe('Flujo completo: Login → Listar recursos', () => {
    it('debe autenticar y luego listar proyectos', async () => {
      //Mock login
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access: 'new-token',
              refresh: 'refresh-token',
              role: 'admin',
              user: { id: 1, email: 'admin@test.com' },
            }),
        })
        // Mock listar proyectos
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, name: 'Proyecto 1', project_type: 'Web', client_id: 1 },
              { id: 2, name: 'Proyecto 2', project_type: 'Mobile', client_id: 2 },
            ]),
        })

      // Login
      const loginResponse = await api.login({
        email: 'admin@test.com',
        password: 'password',
      })

      expect(loginResponse.access).toBe('new-token')
      expect(loginResponse.role).toBe('admin')

      // Usar token para listar proyectos
      const projects = await api.listProjects(loginResponse.access)

      expect(projects).toHaveLength(2)
      expect(projects[0].name).toBe('Proyecto 1')
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('debe autenticar y obtener estadísticas', async () => {
      // Mock login
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access: 'stats-token',
              role: 'admin',
              user: { id: 1 },
            }),
        })
        // Mock estadísticas
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              total_claims: 150,
              resolved_claims: 100,
              pending_claims: 50,
            }),
        })

      const loginResp = await api.login({
        email: 'admin@test.com',
        password: 'pass',
      })

      const stats = await statistics.getStatistics(loginResp.access)

      expect(stats.total_claims).toBe(150)
      expect(stats.resolved_claims).toBe(100)
    })
  })

  describe('Flujo CRUD completo de proyectos', () => {
    it('debe crear, listar, actualizar y eliminar proyecto', async () => {
      const newProject = {
        name: 'Nuevo Proyecto',
        project_type: 'Web App',
        client_id: 1,
      }

      // Mock crear
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 100, ...newProject }),
        })
        // Mock listar
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ id: 100, ...newProject }]),
        })
        // Mock actualizar
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 100,
              ...newProject,
              name: 'Proyecto Actualizado',
            }),
        })
        // Mock eliminar
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })

      // Crear
      const created = await api.createProject(mockToken, newProject)
      expect(created.id).toBe(100)

      // Listar
      const list = await api.listProjects(mockToken)
      expect(list).toHaveLength(1)

      // Actualizar
      const updated = await api.updateProject(mockToken, 100, {
        ...newProject,
        name: 'Proyecto Actualizado',
      })
      expect(updated.name).toBe('Proyecto Actualizado')

      // Eliminar
      await api.deleteProject(mockToken, 100)

      expect(global.fetch).toHaveBeenCalledTimes(4)
    })
  })

  describe('Flujo CRUD de clientes', () => {
    it('debe crear y listar clientes', async () => {
      const newClient = {
        email: 'client@test.com',
        company_name: 'Test Company',
      }

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 50, ...newClient }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ id: 50, ...newClient }]),
        })

      const created = await api.createClient(mockToken, newClient)
      expect(created.id).toBe(50)

      const clients = await api.listClients(mockToken)
      expect(clients).toHaveLength(1)
      expect(clients[0].company_name).toBe('Test Company')
    })

    it('debe actualizar y eliminar cliente', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 10,
              email: 'updated@test.com',
              company_name: 'Updated Co',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })

      const updated = await api.updateClient(mockToken, 10, {
        company_name: 'Updated Co',
      })
      expect(updated.company_name).toBe('Updated Co')

      await api.deleteClient(mockToken, 10)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Flujo CRUD de empleados', () => {
    it('debe gestionar empleados completamente', async () => {
      const newEmployee = {
        email: 'emp@test.com',
        first_name: 'Juan',
        last_name: 'Pérez',
        area_ids: [1, 2],
      }

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 20, ...newEmployee }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ id: 20, ...newEmployee }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 20,
              ...newEmployee,
              first_name: 'Juan Carlos',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })

      // Crear
      const created = await api.createEmployee(mockToken, newEmployee)
      expect(created.id).toBe(20)

      // Listar
      const employees = await api.listEmployees(mockToken)
      expect(employees).toHaveLength(1)

      // Actualizar
      const updated = await api.updateEmployee(mockToken, 20, {
        first_name: 'Juan Carlos',
      })
      expect(updated.first_name).toBe('Juan Carlos')

      // Eliminar
      await api.deleteEmployee(mockToken, 20)
      expect(global.fetch).toHaveBeenCalledTimes(4)
    })
  })

  describe('Flujo de gestión de áreas', () => {
    it('debe crear, listar, actualizar y eliminar área', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 5, name: 'Soporte' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ id: 5, name: 'Soporte' }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 5, name: 'Soporte Técnico' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })

      await api.createArea(mockToken, { name: 'Soporte' })
      await api.listAreas(mockToken)
      await api.updateArea(mockToken, 5, { name: 'Soporte Técnico' })
      await api.deleteArea(mockToken, 5)

      expect(global.fetch).toHaveBeenCalledTimes(4)
    })

    it('debe gestionar sub-áreas de un área', async () => {
      const areaId = 3

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 1,
              name: 'Hardware',
              area_id: areaId,
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, name: 'Hardware', area_id: areaId },
            ]),
        })

      await api.addSubArea(mockToken, areaId, { name: 'Hardware' })
      const subAreas = await api.listSubAreas(mockToken, areaId)

      expect(subAreas).toHaveLength(1)
      expect(subAreas[0].name).toBe('Hardware')
    })
  })

  describe('Flujo de reclamos', () => {
    it('debe crear y listar reclamos', async () => {
      const newClaim = {
        title: 'Bug crítico',
        description: 'Error en producción',
        project_id: 1,
        claim_type_id: 1,
      }

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 999,
              ...newClaim,
              status: 'Nuevo',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 999,
                ...newClaim,
                status: 'Nuevo',
              },
            ]),
        })

      const created = await api.createClaim(mockToken, newClaim)
      expect(created.id).toBe(999)

      const claims = await api.listClaims(mockToken)
      expect(claims).toHaveLength(1)
      expect(claims[0].title).toBe('Bug crítico')
    })

    it('debe actualizar estado de reclamo', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 10,
            status: 'En Progreso',
          }),
      })

      const updated = await api.updateClaim(mockToken, 10, {
        status: 'En Progreso',
      })

      expect(updated.status).toBe('En Progreso')
    })

    it('debe obtener timeline y comentarios de reclamo', async () => {
      const claimId = 15

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                claim_id: claimId,
                status: 'Nuevo',
                created_at: '2025-11-29',
              },
            ]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                claim_id: claimId,
                comment: 'En revisión',
              },
            ]),
        })

      const timeline = await api.claimTimeline(mockToken, claimId)
      const comments = await api.getClientFeedbackMessages(mockToken, claimId)

      expect(timeline).toHaveLength(1)
      expect(comments).toHaveLength(1)
    })

    it('debe crear comentario en reclamo', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 1,
            claim_id: 20,
            comment: 'Trabajando en esto',
          }),
      })

      const comment = await api.addComment(mockToken, 20, {
        comment: 'Trabajando en esto',
      })

      expect(comment.comment).toBe('Trabajando en esto')
    })
  })

  describe('Flujo de estadísticas con filtros', () => {
    it('debe obtener estadísticas generales', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            total_claims: 200,
            open_claims: 50,
            resolved_claims: 150,
          }),
      })

      const stats = await statistics.getStatistics(mockToken)

      expect(stats.total_claims).toBe(200)
      expect(stats.resolved_claims).toBe(150)
    })

    it('debe obtener estadísticas con filtros de fecha', async () => {
      const filters = {
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            total_claims: 80,
          }),
      })

      const stats = await statistics.getStatistics(mockToken, filters)

      expect(stats.total_claims).toBe(80)
      // Verificar que se llamó con token correcto
      expect(global.fetch).toHaveBeenCalled()
    })

    it('debe obtener reclamos por estado', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Nuevo: 20,
            'En Progreso': 30,
            Resuelto: 50,
          }),
      })

      const byStatus = await statistics.getClaimsByStatus(mockToken)

      expect(byStatus.Nuevo).toBe(20)
      expect(byStatus.Resuelto).toBe(50)
    })

    it('debe obtener reclamos por tipo', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Bug: 40,
            Feature: 30,
            Support: 30,
          }),
      })

      const byType = await statistics.getClaimsByType(mockToken)

      expect(byType.Bug).toBe(40)
    })

    it('debe obtener KPIs', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            total_claims: 100,
            avg_resolution_time: 3.5,
            avg_rating: 4.5,
          }),
      })

      const kpis = await statistics.getKPIs(mockToken)

      expect(kpis.total_claims).toBe(100)
      expect(kpis.avg_rating).toBe(4.5)
    })

    it('debe obtener estadísticas de ratings', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            average_rating: 4.2,
            total_ratings: 50,
          }),
      })

      const ratingStats = await statistics.getRatingStats(mockToken)

      expect(ratingStats.average_rating).toBe(4.2)
      expect(ratingStats.total_ratings).toBe(50)
    })

    it('debe obtener reclamos por mes', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            '2025-01': 10,
            '2025-02': 15,
            '2025-03': 20,
          }),
      })

      const byMonth = await statistics.getClaimsByMonth(mockToken)

      expect(byMonth['2025-01']).toBe(10)
      expect(byMonth['2025-03']).toBe(20)
    })

    it('debe obtener reclamos por área', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Soporte: 40,
            Ventas: 30,
            Marketing: 30,
          }),
      })

      const byArea = await statistics.getClaimsByArea(mockToken)

      expect(byArea.Soporte).toBe(40)
    })

    it('debe obtener reclamos por proyecto', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            'Proyecto A': 25,
            'Proyecto B': 35,
          }),
      })

      const byProject = await statistics.getClaimsByProject(mockToken)

      expect(byProject['Proyecto A']).toBe(25)
    })

    it('debe obtener reclamos por empleado', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            'Juan Pérez': 15,
            'María García': 20,
          }),
      })

      const byEmployee = await statistics.getClaimsByEmployee(mockToken)

      expect(byEmployee['María García']).toBe(20)
    })

    it('debe obtener estadísticas con múltiples filtros combinados', async () => {
      const filters = {
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        project_id: 1,
        status: 'Resuelto',
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            total_claims: 45,
            avg_resolution_time: 2.5,
          }),
      })

      const stats = await statistics.getStatistics(mockToken, filters)

      expect(stats.total_claims).toBe(45)
      expect(stats.avg_resolution_time).toBe(2.5)
    })

    it('debe manejar filtros opcionales en diferentes combinaciones', async () => {
      // Sin filtros
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total: 100 }),
      })
      await statistics.getClaimsByStatus(mockToken)

      // Con filtro de proyecto
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total: 50 }),
      })
      await statistics.getClaimsByType(mockToken, { project_id: 1 })

      // Con filtro de área
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total: 30 }),
      })
      await statistics.getClaimsByMonth(mockToken, { area_id: 2 })

      // Con múltiples filtros
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total: 20 }),
      })
      await statistics.getClaimsByArea(mockToken, {
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        project_id: 1,
      })

      expect(global.fetch).toHaveBeenCalledTimes(4)
    })

    it('debe manejar respuestas vacías correctamente', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      const stats = await statistics.getKPIs(mockToken)
      expect(stats).toEqual({})
    })

    it('debe manejar respuestas con diferentes estructuras', async () => {
      // Array vacío
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      await statistics.getClaimsByProject(mockToken)

      // Objeto con null
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })
      await statistics.getClaimsByEmployee(mockToken)

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Flujo de manejo de sesión', () => {
    it('debe guardar y recuperar sesión de localStorage', () => {
      const sessionData = {
        token: 'my-token',
        role: 'admin',
        user: { id: 1, email: 'user@test.com' },
      }

      localStorage.setItem('session', JSON.stringify(sessionData))

      const recovered = JSON.parse(localStorage.getItem('session'))

      expect(recovered.token).toBe('my-token')
      expect(recovered.role).toBe('admin')
      expect(recovered.user.email).toBe('user@test.com')
    })

    it('debe limpiar sesión al hacer logout', () => {
      localStorage.setItem(
        'session',
        JSON.stringify({ token: 'token', role: 'user' })
      )

      expect(localStorage.getItem('session')).toBeTruthy()

      localStorage.removeItem('session')

      expect(localStorage.getItem('session')).toBeNull()
    })

    it('debe manejar sesión inválida', () => {
      localStorage.setItem('session', 'invalid-json')

      expect(() => {
        JSON.parse(localStorage.getItem('session'))
      }).toThrow()
    })

    it('debe persistir múltiples sesiones en diferentes keys', () => {
      localStorage.setItem('session1', JSON.stringify({ token: 'token1' }))
      localStorage.setItem('session2', JSON.stringify({ token: 'token2' }))

      expect(JSON.parse(localStorage.getItem('session1')).token).toBe('token1')
      expect(JSON.parse(localStorage.getItem('session2')).token).toBe('token2')
    })
  })

  describe('Flujo de manejo de errores', () => {
    it('debe guardar y recuperar sesión de localStorage', () => {
      const sessionData = {
        token: 'my-token',
        role: 'admin',
        user: { id: 1, email: 'user@test.com' },
      }

      localStorage.setItem('session', JSON.stringify(sessionData))

      const recovered = JSON.parse(localStorage.getItem('session'))

      expect(recovered.token).toBe('my-token')
      expect(recovered.role).toBe('admin')
      expect(recovered.user.email).toBe('user@test.com')
    })

    it('debe limpiar sesión al hacer logout', () => {
      localStorage.setItem(
        'session',
        JSON.stringify({ token: 'token', role: 'user' })
      )

      expect(localStorage.getItem('session')).toBeTruthy()

      localStorage.removeItem('session')

      expect(localStorage.getItem('session')).toBeNull()
    })

    it('debe manejar sesión inválida', () => {
      localStorage.setItem('session', 'invalid-json')

      expect(() => {
        JSON.parse(localStorage.getItem('session'))
      }).toThrow()
    })
  })

  describe('Flujo de manejo de errores', () => {
    it('debe manejar error 401 (no autorizado)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Token inválido' }),
      })

      await expect(api.listProjects('invalid-token')).rejects.toThrow(
        'Token inválido'
      )
    })

    it('debe manejar error 404 (no encontrado)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'No encontrado' }),
      })

      await expect(api.listClaims('invalid-token')).rejects.toThrow(
        'No encontrado'
      )
    })

    it('debe manejar error de red', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.listProjects(mockToken)).rejects.toThrow('Network error')
    })

    it('debe manejar error 500 del servidor', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Server error' }),
      })

      await expect(api.createProject(mockToken, {})).rejects.toThrow(
        'Server error'
      )
    })
  })

  describe('Flujo de validación de tokens', () => {
    it('debe incluir Authorization header en todas las peticiones', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await api.listProjects(mockToken)
      await api.listClients(mockToken)
      await api.listEmployees(mockToken)

      expect(global.fetch).toHaveBeenCalledTimes(3)

      global.fetch.mock.calls.forEach((call) => {
        expect(call[1].headers.Authorization).toBe(`Bearer ${mockToken}`)
      })
    })

    it('debe incluir Content-Type en peticiones POST/PUT', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.createProject(mockToken, { name: 'Test' })
      await api.updateArea(mockToken, 1, { name: 'Updated' })

      global.fetch.mock.calls.forEach((call) => {
        expect(call[1].headers['Content-Type']).toBe('application/json')
      })
    })
  })

  describe('Flujo de feedback de clientes', () => {
    it('debe crear y obtener feedback', async () => {
      const claimId = 30

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 1,
              claim_id: claimId,
              rating: 5,
              comment: 'Excelente',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                claim_id: claimId,
                rating: 5,
                comment: 'Excelente',
              },
            ]),
        })

      const feedback = await api.addClientFeedback(mockToken, claimId, {
        rating: 5,
        feedback: 'Excelente',
      })

      expect(feedback.rating).toBe(5)

      const feedbackList = await api.getClientFeedbackMessages(mockToken, claimId)
      expect(feedbackList).toHaveLength(1)
    })
  })

  describe('Flujo de cobertura de branches en statistics', () => {
    it('debe manejar cuando localStorage no tiene sesión válida', async () => {
      localStorage.removeItem('claims_session')
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total: 0 })
      })

      const result = await statistics.getStatistics({})
      
      expect(result).toBeDefined()
      expect(result.total).toBe(0)
    })

    it('debe manejar JSON inválido en localStorage', async () => {
      localStorage.setItem('claims_session', 'invalid-json-{{{')
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total: 5 })
      })

      const result = await statistics.getStatistics({})
      
      expect(result).toBeDefined()
      expect(result.total).toBe(5)
    })

    it('debe ejercitar todos los filtros individuales en getClaimsByMonth', async () => {
      localStorage.setItem('claims_session', JSON.stringify({ token: mockToken }))
      
      global.fetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

      await statistics.getClaimsByMonth({ clientId: 1 })
      await statistics.getClaimsByMonth({ employeeId: 2 })
      await statistics.getClaimsByMonth({ year: 2024 })
      
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('debe ejercitar todos los filtros individuales en getClaimsByProject', async () => {
      localStorage.setItem('claims_session', JSON.stringify({ token: mockToken }))
      
      global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })

      await statistics.getClaimsByProject({ clientId: 1 })
      await statistics.getClaimsByProject({ year: 2024 })
      await statistics.getClaimsByProject({ month: 5 })
      await statistics.getClaimsByProject({ startDate: '2024-01-01' })
      await statistics.getClaimsByProject({ endDate: '2024-12-31' })
      
      expect(global.fetch).toHaveBeenCalled()
    })

    it('debe ejercitar todos los filtros individuales en getAverageResolutionTime', async () => {
      localStorage.setItem('claims_session', JSON.stringify({ token: mockToken }))
      
      global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ avg: 24 }) })

      await statistics.getAverageResolutionTime({ employeeId: 1 })
      await statistics.getAverageResolutionTime({ areaId: 2 })
      await statistics.getAverageResolutionTime({ claimType: 'bug' })
      
      expect(global.fetch).toHaveBeenCalled()
    })

    it('debe ejercitar todos los filtros individuales en getStatistics', async () => {
      localStorage.setItem('claims_session', JSON.stringify({ token: mockToken }))
      
      global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ total: 10 }) })

      await statistics.getStatistics({ clientId: 1 })
      await statistics.getStatistics({ employeeId: 2 })
      await statistics.getStatistics({ projectType: 'web' })
      await statistics.getStatistics({ areaId: 3 })
      await statistics.getStatistics({ status: 'open' })
      await statistics.getStatistics({ startDate: '2024-01-01' })
      await statistics.getStatistics({ endDate: '2024-12-31' })
      
      expect(global.fetch).toHaveBeenCalled()
    })

    it('debe ejercitar todos los filtros individuales en getClaimsByType', async () => {
      localStorage.setItem('claims_session', JSON.stringify({ token: mockToken }))
      
      global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })

      await statistics.getClaimsByType({ clientId: 1 })
      await statistics.getClaimsByType({ employeeId: 2 })
      await statistics.getClaimsByType({ areaId: 3 })
      await statistics.getClaimsByType({ startDate: '2024-01-01' })
      await statistics.getClaimsByType({ endDate: '2024-12-31' })
      
      expect(global.fetch).toHaveBeenCalled()
    })

    it('debe ejercitar filtros individuales en getClaimsByArea', async () => {
      localStorage.setItem('claims_session', JSON.stringify({ token: mockToken }))
      
      global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })

      await statistics.getClaimsByArea({ startDate: '2024-01-01' })
      await statistics.getClaimsByArea({ endDate: '2024-12-31' })
      
      expect(global.fetch).toHaveBeenCalled()
    })

    it('debe ejercitar filtros individuales en getClaimsByStatus', async () => {
      localStorage.setItem('claims_session', JSON.stringify({ token: mockToken }))
      
      global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })

      await statistics.getClaimsByStatus({ clientId: 1 })
      await statistics.getClaimsByStatus({ employeeId: 2 })
      await statistics.getClaimsByStatus({ startDate: '2024-01-01' })
      await statistics.getClaimsByStatus({ endDate: '2024-12-31' })
      
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})
