import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import PieChart from './PieChart.jsx'

// Mock de Chart.js y react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Pie: vi.fn(({ data, options }) => (
    <div data-testid="pie-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  )),
}))

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  ArcElement: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  Title: vi.fn(),
  registerables: [],
}))

describe('PieChart', () => {
  const mockData = {
    labels: ['Categoría A', 'Categoría B', 'Categoría C'],
    datasets: [
      {
        data: [30, 50, 20],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado básico', () => {
    it('debe renderizar el gráfico con datos', () => {
      const { getByTestId } = render(<PieChart data={mockData} />)

      const chart = getByTestId('pie-chart')
      expect(chart).toBeInTheDocument()
    })

    it('debe pasar los datos correctamente al componente Pie', () => {
      const { getByTestId } = render(<PieChart data={mockData} />)

      const chartData = getByTestId('chart-data')
      const parsedData = JSON.parse(chartData.textContent)
      
      expect(parsedData.labels).toEqual(mockData.labels)
      expect(parsedData.datasets).toEqual(mockData.datasets)
    })

    it('debe renderizar con título cuando se proporciona', () => {
      const { getByTestId } = render(
        <PieChart data={mockData} title="Distribución de Reclamos" />
      )

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.plugins.title.display).toBe(true)
      expect(parsedOptions.plugins.title.text).toBe('Distribución de Reclamos')
    })

    it('no debe mostrar título cuando no se proporciona', () => {
      const { getByTestId } = render(<PieChart data={mockData} />)

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.plugins.title.display).toBe(false)
    })
  })

  describe('Opciones de configuración', () => {
    it('debe ser responsive', () => {
      const { getByTestId } = render(<PieChart data={mockData} />)

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.responsive).toBe(true)
    })

    it('no debe mantener aspect ratio', () => {
      const { getByTestId } = render(<PieChart data={mockData} />)

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.maintainAspectRatio).toBe(false)
    })

    it('debe usar height por defecto de 300', () => {
      const { container } = render(<PieChart data={mockData} />)

      const chartContainer = container.querySelector('div[style*="height"]')
      expect(chartContainer?.style.height).toBe('300px')
    })

    it('debe usar height personalizada cuando se proporciona', () => {
      const { container } = render(<PieChart data={mockData} height={400} />)

      const chartContainer = container.querySelector('div[style*="height"]')
      expect(chartContainer?.style.height).toBe('400px')
    })
  })

  describe('Configuración de leyenda', () => {
    it('debe posicionar la leyenda a la derecha', () => {
      const { getByTestId } = render(<PieChart data={mockData} />)

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.plugins.legend.position).toBe('right')
    })

    it('debe tener configuración de color para labels', () => {
      const { getByTestId } = render(<PieChart data={mockData} />)

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.plugins.legend.labels.color).toBeDefined()
      expect(parsedOptions.plugins.legend.labels.font.size).toBe(12)
    })
  })

  describe('Datos vacíos', () => {
    it('debe manejar datos vacíos', () => {
      const emptyData = {
        labels: [],
        datasets: [],
      }

      const { getByTestId } = render(<PieChart data={emptyData} />)

      const chart = getByTestId('pie-chart')
      expect(chart).toBeInTheDocument()
    })

    it('debe renderizar con dataset sin datos', () => {
      const noData = {
        labels: ['A', 'B'],
        datasets: [
          {
            data: [],
            backgroundColor: [],
          },
        ],
      }

      const { getByTestId } = render(<PieChart data={noData} />)

      expect(getByTestId('pie-chart')).toBeInTheDocument()
    })
  })

  describe('Múltiples datasets', () => {
    it('debe soportar múltiples datasets', () => {
      const multiData = {
        labels: ['A', 'B'],
        datasets: [
          {
            label: 'Dataset 1',
            data: [10, 20],
            backgroundColor: ['#ff0000', '#00ff00'],
          },
          {
            label: 'Dataset 2',
            data: [30, 40],
            backgroundColor: ['#0000ff', '#ffff00'],
          },
        ],
      }

      const { getByTestId } = render(<PieChart data={multiData} />)

      const chartData = getByTestId('chart-data')
      const parsedData = JSON.parse(chartData.textContent)
      
      expect(parsedData.datasets).toHaveLength(2)
    })
  })
})
