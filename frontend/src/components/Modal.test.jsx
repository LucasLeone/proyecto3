import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './Modal.jsx'

describe('Modal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado', () => {
    it('debe renderizar el modal cuando isOpen es true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido del modal</div>
        </Modal>
      )

      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Contenido del modal')).toBeInTheDocument()
    })

    it('no debe renderizar nada cuando isOpen es false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <div>Contenido del modal</div>
        </Modal>
      )

      expect(container.firstChild).toBeNull()
    })

    it('debe renderizar el título correctamente', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Mi Título Personalizado">
          <div>Contenido</div>
        </Modal>
      )

      expect(screen.getByText('Mi Título Personalizado')).toBeInTheDocument()
    })

    it('debe renderizar children correctamente', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test">
          <div data-testid="child-content">
            <p>Párrafo 1</p>
            <p>Párrafo 2</p>
          </div>
        </Modal>
      )

      const content = screen.getByTestId('child-content')
      expect(content).toBeInTheDocument()
      expect(screen.getByText('Párrafo 1')).toBeInTheDocument()
      expect(screen.getByText('Párrafo 2')).toBeInTheDocument()
    })
  })

  describe('Funcionalidad de cierre', () => {
    it('debe llamar onClose al hacer clic en el botón de cerrar', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      const closeButton = screen.getByLabelText('Cerrar')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('debe tener botón de cerrar con icono X', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      const closeButton = screen.getByLabelText('Cerrar')
      expect(closeButton).toBeInTheDocument()
      
      // Verificar que tiene el SVG del icono X
      const svg = closeButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Overlay y backdrop', () => {
    it('debe renderizar el overlay con blur', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      const overlay = container.querySelector('.backdrop-blur-sm')
      expect(overlay).toBeInTheDocument()
    })

    it('debe tener z-index apropiado', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      const overlay = container.querySelector('.z-50')
      expect(overlay).toBeInTheDocument()
    })
  })

  describe('Estilos y layout', () => {
    it('debe tener máximo ancho de 4xl', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      const modalContent = container.querySelector('.max-w-4xl')
      expect(modalContent).toBeInTheDocument()
    })

    it('debe tener altura máxima de 90vh y scroll', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      const modalContent = container.querySelector('.max-h-\\[90vh\\]')
      expect(modalContent).toBeInTheDocument()
      expect(modalContent).toHaveClass('overflow-y-auto')
    })

    it('debe tener header sticky', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      const header = screen.getByText('Test Modal').closest('div')
      expect(header).toHaveClass('sticky')
      expect(header).toHaveClass('top-0')
    })
  })

  describe('Renderizado condicional', () => {
    it('debe poder cambiar de cerrado a abierto', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()

      rerender(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })

    it('debe poder cambiar de abierto a cerrado', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      expect(screen.getByText('Test Modal')).toBeInTheDocument()

      rerender(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })
  })

  describe('Accesibilidad', () => {
    it('debe tener aria-label en el botón de cerrar', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Contenido</div>
        </Modal>
      )

      const closeButton = screen.getByLabelText('Cerrar')
      expect(closeButton).toHaveAttribute('aria-label', 'Cerrar')
    })
  })

  describe('Contenido complejo', () => {
    it('debe renderizar formularios dentro del modal', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Formulario">
          <form data-testid="test-form">
            <input type="text" placeholder="Nombre" />
            <button type="submit">Enviar</button>
          </form>
        </Modal>
      )

      const form = screen.getByTestId('test-form')
      expect(form).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Nombre')).toBeInTheDocument()
      expect(screen.getByText('Enviar')).toBeInTheDocument()
    })

    it('debe renderizar múltiples elementos children', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test">
          <p>Primer párrafo</p>
          <div>División</div>
          <span>Span</span>
        </Modal>
      )

      expect(screen.getByText('Primer párrafo')).toBeInTheDocument()
      expect(screen.getByText('División')).toBeInTheDocument()
      expect(screen.getByText('Span')).toBeInTheDocument()
    })
  })
})
