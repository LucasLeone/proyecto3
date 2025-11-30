import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from './client.js'

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('request helper', () => {
    it('debe hacer una petición GET correctamente', async () => {
      const mockData = { id: 1, name: 'Test' }
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      })

      const result = await api.get('/test', 'test-token')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
        })
      )
      expect(result).toEqual(mockData)
    })

    it('debe manejar respuestas 204 sin contenido', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const result = await api.deleteArea('token', 1)

      expect(result).toBeNull()
    })

    it('debe lanzar error cuando la respuesta no es ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ detail: 'Error de validación' }),
      })

      await expect(api.get('/test', 'token')).rejects.toThrow('Error de validación')
    })

    it('debe manejar errores sin JSON en la respuesta', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('No JSON')),
      })

      await expect(api.get('/test', 'token')).rejects.toThrow('Internal Server Error')
    })
  })

  describe('Autenticación', () => {
    it('debe hacer login correctamente', async () => {
      const mockResponse = {
        token: 'jwt-token-123',
        user: { id: 1, email: 'test@test.com' },
        role: 'admin',
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.login('test@test.com', 'password123')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/login/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('debe fallar login con credenciales incorrectas', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Credenciales inválidas' }),
      })

      await expect(api.login('wrong@test.com', 'wrongpass')).rejects.toThrow(
        'Credenciales inválidas'
      )
    })
  })

  describe('Áreas', () => {
    const mockToken = 'test-token'

    it('debe listar áreas', async () => {
      const mockAreas = [
        { id: 1, name: 'Área 1' },
        { id: 2, name: 'Área 2' },
      ]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAreas),
      })

      const result = await api.listAreas(mockToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/areas/',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
      expect(result).toEqual(mockAreas)
    })

    it('debe crear área', async () => {
      const newArea = { name: 'Nueva Área' }
      const mockResponse = { id: 3, ...newArea }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.createArea(mockToken, newArea)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/areas/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newArea),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('debe actualizar área', async () => {
      const updatedArea = { name: 'Área Actualizada' }
      const mockResponse = { id: 1, ...updatedArea }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.updateArea(mockToken, 1, updatedArea)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/areas/1/',
        expect.objectContaining({
          method: 'PUT',
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('debe eliminar área', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const result = await api.deleteArea(mockToken, 1)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/areas/1/',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result).toBeNull()
    })
  })

  describe('Empleados', () => {
    const mockToken = 'test-token'

    it('debe listar empleados', async () => {
      const mockEmployees = [
        { id: 1, email: 'emp1@test.com' },
        { id: 2, email: 'emp2@test.com' },
      ]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockEmployees),
      })

      const result = await api.listEmployees(mockToken)

      expect(result).toEqual(mockEmployees)
    })

    it('debe crear empleado', async () => {
      const newEmployee = { email: 'new@test.com', first_name: 'John' }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 5, ...newEmployee }),
      })

      const result = await api.createEmployee(mockToken, newEmployee)

      expect(result.id).toBe(5)
      expect(result.email).toBe('new@test.com')
    })

    it('debe actualizar empleado', async () => {
      const updatedEmployee = { email: 'updated@test.com' }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, ...updatedEmployee }),
      })

      await api.updateEmployee(mockToken, 1, updatedEmployee)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/employees/1/',
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('debe eliminar empleado', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const result = await api.deleteEmployee(mockToken, 1)

      expect(result).toBeNull()
    })
  })

  describe('Clientes', () => {
    const mockToken = 'test-token'

    it('debe listar clientes', async () => {
      const mockClients = [{ id: 1, email: 'client1@test.com' }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockClients),
      })

      const result = await api.listClients(mockToken)

      expect(result).toEqual(mockClients)
    })

    it('debe crear cliente', async () => {
      const newClient = { email: 'newclient@test.com', company_name: 'Test Co' }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 10, ...newClient }),
      })

      const result = await api.createClient(mockToken, newClient)

      expect(result.company_name).toBe('Test Co')
    })
  })

  describe('Proyectos', () => {
    const mockToken = 'test-token'

    it('debe listar proyectos sin filtros', async () => {
      const mockProjects = [{ id: 1, name: 'Proyecto 1' }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProjects),
      })

      const result = await api.listProjects(mockToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/projects/',
        expect.any(Object)
      )
      expect(result).toEqual(mockProjects)
    })

    it('debe listar proyectos filtrados por cliente', async () => {
      const mockProjects = [{ id: 1, name: 'Proyecto 1', client_id: 5 }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProjects),
      })

      await api.listProjects(mockToken, { clientId: 5 })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/projects/?client_id=5',
        expect.any(Object)
      )
    })

    it('debe crear proyecto', async () => {
      const newProject = { name: 'Nuevo Proyecto', project_type: 'Construcción' }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 20, ...newProject }),
      })

      const result = await api.createProject(mockToken, newProject)

      expect(result.name).toBe('Nuevo Proyecto')
    })

    it('debe actualizar proyecto', async () => {
      const updatedProject = { name: 'Proyecto Actualizado' }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, ...updatedProject }),
      })

      await api.updateProject(mockToken, 1, updatedProject)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/projects/1/',
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('debe eliminar proyecto', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await api.deleteProject(mockToken, 1)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/projects/1/',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('Reclamos', () => {
    const mockToken = 'test-token'

    it('debe listar reclamos sin filtros', async () => {
      const mockClaims = [{ id: 1, status: 'Ingresado' }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockClaims),
      })

      const result = await api.listClaims(mockToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/claims/',
        expect.any(Object)
      )
      expect(result).toEqual(mockClaims)
    })

    it('debe listar reclamos con filtros de estado y cliente', async () => {
      const mockClaims = [{ id: 1, status: 'Resuelto', client_id: 5 }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockClaims),
      })

      await api.listClaims(mockToken, { status: 'Resuelto', clientId: 5 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=Resuelto'),
        expect.any(Object)
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('client_id=5'),
        expect.any(Object)
      )
    })

    it('debe crear reclamo con FormData', async () => {
      const formData = new FormData()
      formData.append('description', 'Test claim')

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 100, description: 'Test claim' }),
      })

      const result = await api.createClaim(mockToken, formData)

      expect(result.id).toBe(100)
    })

    it('debe actualizar reclamo', async () => {
      const update = { status: 'En Proceso' }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, ...update }),
      })

      await api.updateClaim(mockToken, 1, update)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/claims/1/',
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('debe obtener timeline de reclamo', async () => {
      const mockTimeline = [
        { action: 'created', timestamp: '2025-01-01' },
        { action: 'status_changed', timestamp: '2025-01-02' },
      ]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTimeline),
      })

      const result = await api.claimTimeline(mockToken, 1)

      expect(result).toEqual(mockTimeline)
    })

    it('debe obtener timeline público', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })

      await api.claimTimeline(mockToken, 1, { publicOnly: true })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/claims/1/timeline/?public=1',
        expect.any(Object)
      )
    })

    it('debe agregar comentario', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 50, comment: 'Test comment' }),
      })

      await api.addComment(mockToken, 1, 'Test comment')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/claims/1/comments/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ comment: 'Test comment' }),
        })
      )
    })

    it('debe agregar acción', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 60, action_description: 'Test action' }),
      })

      await api.addAction(mockToken, 1, 'Test action')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/claims/1/actions/',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('debe obtener mensajes de feedback del cliente', async () => {
      const mockFeedback = [{ id: 1, rating: 5, feedback: 'Excelente' }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockFeedback),
      })

      const result = await api.getClientFeedbackMessages(mockToken, 1)

      expect(result).toEqual(mockFeedback)
    })

    it('debe agregar feedback del cliente', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 1, rating: 4, feedback: 'Bien' }),
      })

      await api.addClientFeedback(mockToken, 1, { rating: 4, feedback: 'Bien' })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/claims/1/feedback/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ rating: 4, feedback: 'Bien' }),
        })
      )
    })
  })

  describe('Sub-áreas', () => {
    const mockToken = 'test-token'

    it('debe agregar sub-área', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 10, name: 'Sub-área nueva' }),
      })

      await api.addSubArea(mockToken, 1, 'Sub-área nueva')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/areas/1/sub-areas/',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('debe actualizar sub-área', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 10, name: 'Sub-área actualizada' }),
      })

      await api.updateSubArea(mockToken, 1, 10, 'Sub-área actualizada')

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/areas/1/sub-areas/10/',
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('debe eliminar sub-área', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await api.deleteSubArea(mockToken, 1, 10)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/areas/1/sub-areas/10/',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })
})
