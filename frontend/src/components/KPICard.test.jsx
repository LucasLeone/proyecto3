import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KPICard from './KPICard.jsx'

describe('KPICard', () => {
  describe('Renderizado básico', () => {
    it('debe renderizar con props mínimas', () => {
      render(<KPICard title="Total Reclamos" value="150" />)

      expect(screen.getByText('Total Reclamos')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('debe renderizar valor numérico', () => {
      render(<KPICard title="Cantidad" value={42} />)

      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('debe renderizar subtitle cuando se proporciona', () => {
      render(
        <KPICard
          title="Promedio"
          value="4.5"
          subtitle="Calificación general"
        />
      )

      expect(screen.getByText('Calificación general')).toBeInTheDocument()
    })

    it('no debe renderizar subtitle si no se proporciona', () => {
      render(<KPICard title="Total" value="100" />)

      const subtitles = screen.queryByText(/calificación/i)
      expect(subtitles).not.toBeInTheDocument()
    })
  })

  describe('Iconos', () => {
    it('debe renderizar icono cuando se proporciona', () => {
      render(<KPICard title="Test" value="10" icon="📊" />)

      expect(screen.getByText('📊')).toBeInTheDocument()
    })

    it('no debe renderizar icono si no se proporciona', () => {
      const { container } = render(<KPICard title="Test" value="10" />)

      const iconContainer = container.querySelector('.bg-blue-50')
      expect(iconContainer).not.toBeInTheDocument()
    })
  })

  describe('Tendencias (Trends)', () => {
    it('debe renderizar tendencia ascendente', () => {
      render(
        <KPICard
          title="Ventas"
          value="1000"
          trend="up"
          trendValue="+15%"
        />
      )

      expect(screen.getByText((content, element) => {
        return element?.textContent === '\u2191 +15%'
      })).toBeInTheDocument()
      expect(screen.getByText('vs período anterior')).toBeInTheDocument()
    })

    it('debe renderizar tendencia descendente', () => {
      render(
        <KPICard
          title="Reclamos"
          value="50"
          trend="down"
          trendValue="-10%"
        />
      )

      expect(screen.getByText('↓ -10%')).toBeInTheDocument()
    })

    it('debe renderizar tendencia neutral', () => {
      render(
        <KPICard
          title="Estable"
          value="100"
          trend="neutral"
          trendValue="0%"
        />
      )

      expect(screen.getByText('→ 0%')).toBeInTheDocument()
    })

    it('no debe renderizar tendencia si solo trend está presente', () => {
      render(
        <KPICard
          title="Test"
          value="100"
          trend="up"
        />
      )

      expect(screen.queryByText('↑')).not.toBeInTheDocument()
    })

    it('no debe renderizar tendencia si solo trendValue está presente', () => {
      render(
        <KPICard
          title="Test"
          value="100"
          trendValue="+5%"
        />
      )

      expect(screen.queryByText('+5%')).not.toBeInTheDocument()
    })
  })

  describe('Colores', () => {
    it('debe aplicar color azul por defecto', () => {
      const { container } = render(<KPICard title="Test" value="10" />)

      const card = container.querySelector('.border-blue-200')
      expect(card).toBeInTheDocument()
    })

    it('debe aplicar color verde', () => {
      const { container } = render(
        <KPICard title="Test" value="10" color="green" />
      )

      const card = container.querySelector('.border-green-200')
      expect(card).toBeInTheDocument()
    })

    it('debe aplicar color amarillo', () => {
      const { container } = render(
        <KPICard title="Test" value="10" color="yellow" />
      )

      const card = container.querySelector('.border-yellow-200')
      expect(card).toBeInTheDocument()
    })

    it('debe aplicar color rojo', () => {
      const { container } = render(
        <KPICard title="Test" value="10" color="red" />
      )

      const card = container.querySelector('.border-red-200')
      expect(card).toBeInTheDocument()
    })

    it('debe aplicar color púrpura', () => {
      const { container } = render(
        <KPICard title="Test" value="10" color="purple" />
      )

      const card = container.querySelector('.border-purple-200')
      expect(card).toBeInTheDocument()
    })

    it('debe aplicar color índigo', () => {
      const { container } = render(
        <KPICard title="Test" value="10" color="indigo" />
      )

      const card = container.querySelector('.border-indigo-200')
      expect(card).toBeInTheDocument()
    })

    it('debe usar azul si el color no es válido', () => {
      const { container } = render(
        <KPICard title="Test" value="10" color="invalid-color" />
      )

      const card = container.querySelector('.border-blue-200')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Estilos de tendencia', () => {
    it('debe aplicar estilo verde para tendencia up', () => {
      render(
        <KPICard
          title="Test"
          value="10"
          trend="up"
          trendValue="+5%"
        />
      )

      const trendSpan = screen.getByText('↑ +5%')
      expect(trendSpan).toHaveClass('text-green-600')
    })

    it('debe aplicar estilo rojo para tendencia down', () => {
      render(
        <KPICard
          title="Test"
          value="10"
          trend="down"
          trendValue="-5%"
        />
      )

      const trendSpan = screen.getByText('↓ -5%')
      expect(trendSpan).toHaveClass('text-red-600')
    })

    it('debe aplicar estilo gris para tendencia neutral', () => {
      render(
        <KPICard
          title="Test"
          value="10"
          trend="neutral"
          trendValue="0%"
        />
      )

      const trendSpan = screen.getByText('→ 0%')
      expect(trendSpan).toHaveClass('text-gray-600')
    })
  })

  describe('Layout y estructura', () => {
    it('debe tener sombra y transición hover', () => {
      const { container } = render(<KPICard title="Test" value="10" />)

      const card = container.firstChild
      expect(card).toHaveClass('shadow-md')
      expect(card).toHaveClass('hover:shadow-lg')
      expect(card).toHaveClass('transition-shadow')
    })

    it('debe tener borde izquierdo', () => {
      const { container } = render(<KPICard title="Test" value="10" />)

      const card = container.firstChild
      expect(card).toHaveClass('border-l-4')
    })

    it('debe tener padding adecuado', () => {
      const { container } = render(<KPICard title="Test" value="10" />)

      const card = container.firstChild
      expect(card).toHaveClass('p-6')
    })
  })

  describe('Composición completa', () => {
    it('debe renderizar con todas las props', () => {
      render(
        <KPICard
          title="Reclamos Resueltos"
          value="75"
          subtitle="Este mes"
          icon="✓"
          trend="up"
          trendValue="+20%"
          color="green"
        />
      )

      expect(screen.getByText('Reclamos Resueltos')).toBeInTheDocument()
      expect(screen.getByText('75')).toBeInTheDocument()
      expect(screen.getByText('Este mes')).toBeInTheDocument()
      expect(screen.getByText('✓')).toBeInTheDocument()
      expect(screen.getByText('↑ +20%')).toBeInTheDocument()
    })
  })

  describe('Tamaños de fuente', () => {
    it('debe tener título con texto pequeño', () => {
      render(<KPICard title="Mi Título" value="100" />)

      const title = screen.getByText('Mi Título')
      expect(title).toHaveClass('text-sm')
    })

    it('debe tener valor con texto grande', () => {
      render(<KPICard title="Test" value="999" />)

      const value = screen.getByText('999')
      expect(value).toHaveClass('text-3xl')
      expect(value).toHaveClass('font-bold')
    })
  })

  describe('Iconos con colores de fondo', () => {
    it('debe aplicar fondo azul al icono por defecto', () => {
      const { container } = render(
        <KPICard title="Test" value="10" icon="📈" />
      )

      const iconBg = container.querySelector('.bg-blue-50')
      expect(iconBg).toBeInTheDocument()
    })

    it('debe aplicar color de icono según el color de la tarjeta', () => {
      const { container } = render(
        <KPICard title="Test" value="10" icon="📉" color="red" />
      )

      const iconBg = container.querySelector('.bg-red-50')
      expect(iconBg).toBeInTheDocument()

      const icon = container.querySelector('.text-red-600')
      expect(icon).toBeInTheDocument()
    })
  })
})
