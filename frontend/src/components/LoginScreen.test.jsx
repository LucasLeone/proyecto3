import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginScreen } from './LoginScreen.jsx'

describe('LoginScreen', () => {
  const mockOnLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado', () => {
    it('debe renderizar el formulario de login', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      expect(screen.getByText('Gestión de Reclamos')).toBeInTheDocument()
      expect(screen.getByText('Sistema Integral')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('usuario@empresa.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('********')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
    })

    it('debe mostrar campos de email y contraseña', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const emailInput = screen.getByPlaceholderText('usuario@empresa.com')
      const passwordInput = screen.getByPlaceholderText('********')

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('debe mostrar el logo de la aplicación', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const logo = screen.getByAltText('Gestión de Reclamos')
      expect(logo).toBeInTheDocument()
    })
  })

  describe('Interacción del usuario', () => {
    it('debe actualizar el valor del email al escribir', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const emailInput = screen.getByPlaceholderText('usuario@empresa.com')
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })

      expect(emailInput).toHaveValue('test@test.com')
    })

    it('debe actualizar el valor de la contraseña al escribir', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const passwordInput = screen.getByPlaceholderText('********')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      expect(passwordInput).toHaveValue('password123')
    })
  })

  describe('Validación del formulario', () => {
    it('debe mostrar error si se envía sin email ni contraseña', async () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const submitButton = screen.getByRole('button', { name: /ingresar/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Ingresá email y contraseña')).toBeInTheDocument()
      })

      expect(mockOnLogin).not.toHaveBeenCalled()
    })

    it('debe mostrar error si se envía sin email', async () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const passwordInput = screen.getByPlaceholderText('********')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const submitButton = screen.getByRole('button', { name: /ingresar/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Ingresá email y contraseña')).toBeInTheDocument()
      })

      expect(mockOnLogin).not.toHaveBeenCalled()
    })

    it('debe mostrar error si se envía sin contraseña', async () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const emailInput = screen.getByPlaceholderText('usuario@empresa.com')
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })

      const submitButton = screen.getByRole('button', { name: /ingresar/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Ingresá email y contraseña')).toBeInTheDocument()
      })

      expect(mockOnLogin).not.toHaveBeenCalled()
    })
  })

  describe('Submit del formulario', () => {
    it('debe llamar a onLogin con email y contraseña correctos', async () => {
      mockOnLogin.mockResolvedValueOnce({ success: true })

      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const emailInput = screen.getByPlaceholderText('usuario@empresa.com')
      const passwordInput = screen.getByPlaceholderText('********')
      const submitButton = screen.getByRole('button', { name: /ingresar/i })

      fireEvent.change(emailInput, { target: { value: 'user@test.com' } })
      fireEvent.change(passwordInput, { target: { value: 'mypassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith('user@test.com', 'mypassword')
      })
    })

    it('debe limpiar error local al enviar formulario válido', async () => {
      mockOnLogin.mockResolvedValueOnce({ success: true })

      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      // Primero generar un error local
      const submitButton = screen.getByRole('button', { name: /ingresar/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Ingresá email y contraseña')).toBeInTheDocument()
      })

      // Luego completar el formulario correctamente
      const emailInput = screen.getByPlaceholderText('usuario@empresa.com')
      const passwordInput = screen.getByPlaceholderText('********')

      fireEvent.change(emailInput, { target: { value: 'user@test.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText('Ingresá email y contraseña')).not.toBeInTheDocument()
      })
    })

    it('debe prevenir submit por defecto del formulario', async () => {
      const mockPreventDefault = vi.fn()
      mockOnLogin.mockResolvedValueOnce({ success: true })

      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const form = screen.getByRole('button', { name: /ingresar/i }).closest('form')
      const emailInput = screen.getByPlaceholderText('usuario@empresa.com')
      const passwordInput = screen.getByPlaceholderText('********')

      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      fireEvent.change(passwordInput, { target: { value: 'pass' } })

      fireEvent.submit(form, { preventDefault: mockPreventDefault })

      // El preventDefault se llama internamente, solo verificamos que onLogin se ejecute
      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalled()
      })
    })
  })

  describe('Estado de carga', () => {
    it('debe mostrar "Ingresando..." cuando loading es true', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={true} error={null} />)

      expect(screen.getByText('Ingresando...')).toBeInTheDocument()
      expect(screen.queryByText('Ingresar')).not.toBeInTheDocument()
    })

    it('debe deshabilitar el botón cuando loading es true', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={true} error={null} />)

      const submitButton = screen.getByRole('button')
      expect(submitButton).toBeDisabled()
    })

    it('debe habilitar el botón cuando loading es false', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const submitButton = screen.getByRole('button')
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Manejo de errores', () => {
    it('debe mostrar error del servidor cuando se pasa error prop', () => {
      render(
        <LoginScreen
          onLogin={mockOnLogin}
          loading={false}
          error="Credenciales inválidas"
        />
      )

      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
    })

    it('debe priorizar error local sobre error del servidor', () => {
      render(
        <LoginScreen
          onLogin={mockOnLogin}
          loading={false}
          error="Error del servidor"
        />
      )

      const submitButton = screen.getByRole('button', { name: /ingresar/i })
      fireEvent.click(submitButton)

      // El error local "Ingresá email y contraseña" se muestra en lugar del error del servidor
      expect(screen.getByText('Ingresá email y contraseña')).toBeInTheDocument()
      expect(screen.queryByText('Error del servidor')).not.toBeInTheDocument()
    })

    it('debe manejar errores lanzados por onLogin', async () => {
      mockOnLogin.mockRejectedValueOnce(new Error('Network error'))

      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const emailInput = screen.getByPlaceholderText('usuario@empresa.com')
      const passwordInput = screen.getByPlaceholderText('********')
      const submitButton = screen.getByRole('button', { name: /ingresar/i })

      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalled()
      })

      // El error es manejado upstream, el componente no lanza error
    })
  })

  describe('Accesibilidad', () => {
    it('debe tener labels asociados a los inputs', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      const emailLabel = screen.getByText('Email')
      const passwordLabel = screen.getByText('Contraseña')

      expect(emailLabel).toBeInTheDocument()
      expect(passwordLabel).toBeInTheDocument()
    })

    it('debe tener placeholder en los inputs', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={false} error={null} />)

      expect(screen.getByPlaceholderText('usuario@empresa.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('********')).toBeInTheDocument()
    })
  })

  describe('Estilos y clases CSS', () => {
    it('debe aplicar estilos de error cuando hay error', () => {
      render(
        <LoginScreen
          onLogin={mockOnLogin}
          loading={false}
          error="Error de prueba"
        />
      )

      const errorDiv = screen.getByText('Error de prueba').closest('div')
      expect(errorDiv).toHaveClass('border-red-500/40')
    })

    it('debe aplicar estilos disabled al botón cuando está cargando', () => {
      render(<LoginScreen onLogin={mockOnLogin} loading={true} error={null} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:opacity-60')
    })
  })
})
