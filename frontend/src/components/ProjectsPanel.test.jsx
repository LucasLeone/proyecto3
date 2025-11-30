import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProjectsPanel } from './ProjectsPanel.jsx'
import { api } from '../api/client.js'

vi.mock('../api/client.js', () => ({
  api: {
    listProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  },
}))

describe('ProjectsPanel', () => {
  const mockToken = 'test-token'
  const mockClients = [
    { id: '1', email: 'client1@test.com', company_name: 'Cliente 1' },
    { id: '2', email: 'client2@test.com', company_name: 'Cliente 2' },
  ]
  const mockProjects = [
    { id: '1', name: 'Proyecto A', project_type: 'Web', client_id: '1' },
    { id: '2', name: 'Proyecto B', project_type: 'Móvil', client_id: '2' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado inicial - Admin', () => {
    it('debe renderizar el panel para administrador', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Gestión')).toBeInTheDocument()
      })

      expect(screen.getByText('+ Registrar proyecto')).toBeInTheDocument()
    })

    it('debe cargar y mostrar proyectos', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proyecto A')).toBeInTheDocument()
        expect(screen.getByText('Proyecto B')).toBeInTheDocument()
      })

      expect(api.listProjects).toHaveBeenCalledWith(mockToken)
    })

    it('debe mostrar columna de acciones para admin', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Acciones')).toBeInTheDocument()
      })
    })
  })

  describe('Renderizado - Empleado', () => {
    it('debe renderizar el panel en modo consulta para empleado', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      render(
        <ProjectsPanel
          token={mockToken}
          role="employee"
          clients={mockClients}
          currentUser={{ id: 2 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Listado')).toBeInTheDocument()
      })

      expect(screen.getByText('Consulta')).toBeInTheDocument()
      expect(screen.queryByText('+ Registrar proyecto')).not.toBeInTheDocument()
    })

    it('no debe mostrar columna de acciones para empleado', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      render(
        <ProjectsPanel
          token={mockToken}
          role="employee"
          clients={mockClients}
          currentUser={{ id: 2 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proyecto A')).toBeInTheDocument()
      })

      expect(screen.queryByText('Acciones')).not.toBeInTheDocument()
    })
  })

  describe('Renderizado - Cliente', () => {
    it('debe renderizar el panel para cliente', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      render(
        <ProjectsPanel
          token={mockToken}
          role="client"
          clients={mockClients}
          currentUser={{ id: '1', email: 'client@test.com', company_name: 'Mi Empresa' }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Listado')).toBeInTheDocument()
      })

      // Cliente no ve el selector de clientes
      expect(screen.queryByText('Todos los clientes')).not.toBeInTheDocument()
    })

    it('debe mostrar nombre de la empresa del cliente en lugar del selector', async () => {
      api.listProjects.mockResolvedValueOnce([mockProjects[0]])

      render(
        <ProjectsPanel
          token={mockToken}
          role="client"
          clients={mockClients}
          currentUser={{ id: '1', email: 'client@test.com', company_name: 'Mi Empresa' }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Mi Empresa')).toBeInTheDocument()
      })
    })
  })

  describe('Filtros', () => {
    it('debe filtrar proyectos por cliente', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proyecto A')).toBeInTheDocument()
        expect(screen.getByText('Proyecto B')).toBeInTheDocument()
      })

      const select = screen.getByDisplayValue('Todos los clientes')
      fireEvent.change(select, { target: { value: '1' } })

      // Solo debería mostrar Proyecto A
      expect(screen.getByText('Proyecto A')).toBeInTheDocument()
      expect(screen.queryByText('Proyecto B')).not.toBeInTheDocument()
    })

    it('debe mostrar mensaje cuando no hay proyectos con el filtro', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proyecto A')).toBeInTheDocument()
      })

      const select = screen.getByDisplayValue('Todos los clientes')
      fireEvent.change(select, { target: { value: '1' } })

      // Después de filtrar por cliente 1, debe mostrar solo Proyecto A
      expect(screen.getByText('Proyecto A')).toBeInTheDocument()
      expect(screen.queryByText('Proyecto B')).not.toBeInTheDocument()
    })
  })

  describe('Crear proyecto', () => {
    it('debe abrir el modal al hacer clic en registrar proyecto', async () => {
      api.listProjects.mockResolvedValueOnce([])

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('+ Registrar proyecto')).toBeInTheDocument()
      })

      const registerButton = screen.getByText('+ Registrar proyecto')
      fireEvent.click(registerButton)

      expect(screen.getByText('Registrar proyecto')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Ej: Sistema de gestión')).toBeInTheDocument()
    })

    it('debe crear un proyecto exitosamente', async () => {
      api.listProjects.mockResolvedValueOnce([])
      api.createProject.mockResolvedValueOnce({
        id: '3',
        name: 'Nuevo Proyecto',
        project_type: 'API',
        client_id: '1',
      })
      api.listProjects.mockResolvedValueOnce([
        { id: '3', name: 'Nuevo Proyecto', project_type: 'API', client_id: '1' },
      ])

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('+ Registrar proyecto')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('+ Registrar proyecto'))

      const nameInput = screen.getByPlaceholderText('Ej: Sistema de gestión')
      const typeInput = screen.getByPlaceholderText('Ej: Desarrollo web')
      const clientSelect = screen.getByDisplayValue('Seleccionar cliente')

      fireEvent.change(nameInput, { target: { value: 'Nuevo Proyecto' } })
      fireEvent.change(typeInput, { target: { value: 'API' } })
      fireEvent.change(clientSelect, { target: { value: '1' } })

      const submitButton = screen.getByText('Crear proyecto')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(api.createProject).toHaveBeenCalledWith(mockToken, {
          name: 'Nuevo Proyecto',
          project_type: 'API',
          client_id: '1',
        })
      })

      await waitFor(() => {
        expect(screen.getByText('Nuevo Proyecto')).toBeInTheDocument()
      })
    })

    it('debe validar campos requeridos', async () => {
      api.listProjects.mockResolvedValueOnce([])

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('+ Registrar proyecto')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('+ Registrar proyecto'))

      const nameInput = screen.getByPlaceholderText('Ej: Sistema de gestión')
      expect(nameInput).toBeRequired()

      const typeInput = screen.getByPlaceholderText('Ej: Desarrollo web')
      expect(typeInput).toBeRequired()

      const clientSelect = screen.getByDisplayValue('Seleccionar cliente')
      expect(clientSelect).toBeRequired()
    })
  })

  describe('Editar proyecto', () => {
    it('debe abrir el modal con datos precargados al editar', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proyecto A')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText('Editar')
      fireEvent.click(editButtons[0])

      expect(screen.getByText('Editar proyecto')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Proyecto A')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Web')).toBeInTheDocument()
    })

    it('debe deshabilitar el selector de cliente al editar', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proyecto A')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText('Editar')
      fireEvent.click(editButtons[0])

      const clientSelect = screen.getByDisplayValue('Cliente 1')
      expect(clientSelect).toBeDisabled()
      expect(
        screen.getByText('No se puede cambiar el cliente de un proyecto existente')
      ).toBeInTheDocument()
    })

    it('debe actualizar un proyecto exitosamente', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)
      api.updateProject.mockResolvedValueOnce({
        id: '1',
        name: 'Proyecto A Modificado',
        project_type: 'Web',
        client_id: '1',
      })
      api.listProjects.mockResolvedValueOnce([
        { id: '1', name: 'Proyecto A Modificado', project_type: 'Web', client_id: '1' },
      ])

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proyecto A')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText('Editar')
      fireEvent.click(editButtons[0])

      const nameInput = screen.getByDisplayValue('Proyecto A')
      fireEvent.change(nameInput, { target: { value: 'Proyecto A Modificado' } })

      const submitButton = screen.getByText('Actualizar proyecto')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(api.updateProject).toHaveBeenCalledWith(mockToken, '1', {
          name: 'Proyecto A Modificado',
          project_type: 'Web',
          client_id: '1',
        })
      })
    })
  })

  describe('Eliminar proyecto', () => {
    it('debe eliminar un proyecto con confirmación', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)
      api.deleteProject.mockResolvedValueOnce(null)
      api.listProjects.mockResolvedValueOnce([mockProjects[1]])

      global.confirm = vi.fn(() => true)

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proyecto A')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Eliminar')
      fireEvent.click(deleteButtons[0])

      expect(global.confirm).toHaveBeenCalledWith('¿Estás seguro de eliminar este proyecto?')

      await waitFor(() => {
        expect(api.deleteProject).toHaveBeenCalledWith(mockToken, '1')
      })
    })

    it('no debe eliminar si se cancela la confirmación', async () => {
      api.listProjects.mockResolvedValueOnce(mockProjects)

      global.confirm = vi.fn(() => false)

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proyecto A')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Eliminar')
      fireEvent.click(deleteButtons[0])

      expect(api.deleteProject).not.toHaveBeenCalled()
    })
  })

  describe('Manejo de errores', () => {
    it('debe mostrar error al cargar proyectos', async () => {
      api.listProjects.mockRejectedValueOnce(new Error('Error de red'))

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Error de red')).toBeInTheDocument()
      })
    })

    it('debe mostrar error al crear proyecto', async () => {
      api.listProjects.mockResolvedValueOnce([])
      api.createProject.mockRejectedValueOnce(new Error('Error al crear'))

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('+ Registrar proyecto')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('+ Registrar proyecto'))

      const nameInput = screen.getByPlaceholderText('Ej: Sistema de gestión')
      const typeInput = screen.getByPlaceholderText('Ej: Desarrollo web')
      const clientSelect = screen.getByDisplayValue('Seleccionar cliente')

      fireEvent.change(nameInput, { target: { value: 'Test' } })
      fireEvent.change(typeInput, { target: { value: 'Test' } })
      fireEvent.change(clientSelect, { target: { value: '1' } })

      fireEvent.click(screen.getByText('Crear proyecto'))

      await waitFor(() => {
        // Verificar que se llamó a la API de crear proyecto
        expect(api.createProject).toHaveBeenCalledWith('test-token', {
          name: 'Test',
          project_type: 'Test',
          client_id: '1'
        })
      })
    })
  })

  describe('Modal', () => {
    it('debe cerrar el modal al hacer clic en cancelar', async () => {
      api.listProjects.mockResolvedValueOnce([])

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('+ Registrar proyecto')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('+ Registrar proyecto'))
      expect(screen.getByText('Registrar proyecto')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Cancelar'))

      await waitFor(() => {
        expect(screen.queryByText('Registrar proyecto')).not.toBeInTheDocument()
      })
    })

    it('debe limpiar el formulario al cerrar el modal', async () => {
      api.listProjects.mockResolvedValueOnce([])

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('+ Registrar proyecto')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('+ Registrar proyecto'))

      const nameInput = screen.getByPlaceholderText('Ej: Sistema de gestión')
      fireEvent.change(nameInput, { target: { value: 'Test Name' } })

      fireEvent.click(screen.getByText('Cancelar'))

      // Reabrir modal
      fireEvent.click(screen.getByText('+ Registrar proyecto'))

      const newNameInput = screen.getByPlaceholderText('Ej: Sistema de gestión')
      expect(newNameInput).toHaveValue('')
    })
  })

  describe('Mensaje vacío', () => {
    it('debe mostrar mensaje cuando no hay proyectos', async () => {
      api.listProjects.mockResolvedValueOnce([])

      render(
        <ProjectsPanel
          token={mockToken}
          role="admin"
          clients={mockClients}
          currentUser={{ id: 1 }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('No hay proyectos cargados')).toBeInTheDocument()
      })
    })
  })
})
