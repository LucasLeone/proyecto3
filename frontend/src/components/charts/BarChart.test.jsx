import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import BarChart from './BarChart.jsx'

// Mock de Chart.js y react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Bar: vi.fn(({ data, options }) => (
    <div data-testid="bar-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  )),
}))

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  BarElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  registerables: [],
}))

describe('BarChart', () => {
  const mockData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril'],
    datasets: [
      {
        label: 'Reclamos',
        data: [12, 19, 8, 15],
        backgroundColor: '#3b82f6',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado básico', () => {
    it('debe renderizar el gráfico con datos', () => {
      const { getByTestId } = render(<BarChart data={mockData} />)

      const chart = getByTestId('bar-chart')
      expect(chart).toBeInTheDocument()
    })

    it('debe pasar los datos correctamente al componente Bar', () => {
      const { getByTestId } = render(<BarChart data={mockData} />)

      const chartData = getByTestId('chart-data')
      const parsedData = JSON.parse(chartData.textContent)
      
      expect(parsedData.labels).toEqual(mockData.labels)
      expect(parsedData.datasets).toEqual(mockData.datasets)
    })

    it('debe renderizar con título cuando se proporciona', () => {
      const { getByTestId } = render(
        <BarChart data={mockData} title="Reclamos por Mes" />
      )

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.plugins.title.display).toBe(true)
      expect(parsedOptions.plugins.title.text).toBe('Reclamos por Mes')
    })

    it('no debe mostrar título cuando no se proporciona', () => {
      const { getByTestId } = render(<BarChart data={mockData} />)

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.plugins.title.display).toBe(false)
    })
  })

  describe('Opciones de configuración', () => {
    it('debe ser responsive', () => {
      const { getByTestId } = render(<BarChart data={mockData} />)

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.responsive).toBe(true)
    })

    it('no debe mantener aspect ratio', () => {
      const { getByTestId } = render(<BarChart data={mockData} />)

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.maintainAspectRatio).toBe(false)
    })

    it('debe usar height por defecto de 300', () => {
      const { container } = render(<BarChart data={mockData} />)

      const chartContainer = container.querySelector('div[style*="height"]')
      expect(chartContainer?.style.height).toBe('300px')
    })

    it('debe usar height personalizada cuando se proporciona', () => {
      const { container } = render(<BarChart data={mockData} height={500} />)

      const chartContainer = container.querySelector('div[style*="height"]')
      expect(chartContainer?.style.height).toBe('500px')
    })
  })

  describe('Configuración de leyenda', () => {
    it('debe posicionar la leyenda arriba', () => {
      const { getByTestId } = render(<BarChart data={mockData} />)

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.plugins.legend.position).toBe('top')
    })

    it('debe tener configuración de color para labels', () => {
      const { getByTestId } = render(<BarChart data={mockData} />)

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.plugins.legend.labels.color).toBeDefined()
      expect(parsedOptions.plugins.legend.labels.font.size).toBe(12)
    })
  })

  describe('Múltiples datasets', () => {
    it('debe soportar múltiples datasets', () => {
      const multiData = {
        labels: ['Ene', 'Feb', 'Mar'],
        datasets: [
          {
            label: 'Serie 1',
            data: [10, 20, 30],
            backgroundColor: '#3b82f6',
          },
          {
            label: 'Serie 2',
            data: [15, 25, 35],
            backgroundColor: '#10b981',
          },
        ],
      }

      const { getByTestId } = render(<BarChart data={multiData} />)

      const chartData = getByTestId('chart-data')
      const parsedData = JSON.parse(chartData.textContent)
      
      expect(parsedData.datasets).toHaveLength(2)
      expect(parsedData.datasets[0].label).toBe('Serie 1')
      expect(parsedData.datasets[1].label).toBe('Serie 2')
    })
  })

  describe('Datos vacíos', () => {
    it('debe manejar datos vacíos', () => {
      const emptyData = {
        labels: [],
        datasets: [],
      }

      const { getByTestId } = render(<BarChart data={emptyData} />)

      const chart = getByTestId('bar-chart')
      expect(chart).toBeInTheDocument()
    })

    it('debe renderizar con dataset sin datos', () => {
      const noData = {
        labels: ['A', 'B', 'C'],
        datasets: [
          {
            label: 'Dataset',
            data: [],
            backgroundColor: '#3b82f6',
          },
        ],
      }

      const { getByTestId } = render(<BarChart data={noData} />)

      expect(getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  describe('Etiquetas largas', () => {
    it('debe manejar labels largos', () => {
      const longLabels = {
        labels: [
          'Enero con nombre muy largo',
          'Febrero también largo',
          'Marzo igual de largo',
        ],
        datasets: [
          {
            label: 'Datos',
            data: [10, 20, 30],
            backgroundColor: '#3b82f6',
          },
        ],
      }

      const { getByTestId } = render(<BarChart data={longLabels} />)

      const chartData = getByTestId('chart-data')
      const parsedData = JSON.parse(chartData.textContent)
      
      expect(parsedData.labels).toHaveLength(3)
      expect(parsedData.labels[0]).toContain('muy largo')
    })
  })

  describe('Valores negativos', () => {
    it('debe manejar valores negativos', () => {
      const negativeData = {
        labels: ['A', 'B', 'C'],
        datasets: [
          {
            label: 'Valores',
            data: [-10, 20, -5],
            backgroundColor: '#3b82f6',
          },
        ],
      }

      const { getByTestId } = render(<BarChart data={negativeData} />)

      const chartData = getByTestId('chart-data')
      const parsedData = JSON.parse(chartData.textContent)
      
      expect(parsedData.datasets[0].data).toEqual([-10, 20, -5])
    })
  })

  describe('Propiedades de título', () => {
    it('debe aplicar estilos al título', () => {
      const { getByTestId } = render(
        <BarChart data={mockData} title="Mi Gráfico" />
      )

      const options = getByTestId('chart-options')
      const parsedOptions = JSON.parse(options.textContent)
      
      expect(parsedOptions.plugins.title.color).toBeDefined()
      expect(parsedOptions.plugins.title.font.size).toBe(16)
      expect(parsedOptions.plugins.title.font.weight).toBe('bold')
    })
  })

  describe('Colores personalizados', () => {
    it('debe respetar backgroundColor personalizado', () => {
      const customColors = {
        labels: ['A', 'B'],
        datasets: [
          {
            label: 'Datos',
            data: [10, 20],
            backgroundColor: ['#ff0000', '#00ff00'],
          },
        ],
      }

      const { getByTestId } = render(<BarChart data={customColors} />)

      const chartData = getByTestId('chart-data')
      const parsedData = JSON.parse(chartData.textContent)
      
      expect(parsedData.datasets[0].backgroundColor).toEqual(['#ff0000', '#00ff00'])
    })
  })
})
