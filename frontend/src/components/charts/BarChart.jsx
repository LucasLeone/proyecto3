import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import PropTypes from 'prop-types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Componente de gráfico de barras
 */
const BarChart = ({ data, title, height = 300 }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1', // text-slate-300
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: !!title,
        text: title,
        color: '#f1f5f9', // text-slate-100
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#334155', // slate-700
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8', // text-slate-400
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)', // slate-700 transparent
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: '#94a3b8', // text-slate-400
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)', // slate-700 transparent
        },
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar options={options} data={data} />
    </div>
  );
};

BarChart.propTypes = {
  data: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.number).isRequired,
        backgroundColor: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.arrayOf(PropTypes.string),
        ]),
        borderColor: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.arrayOf(PropTypes.string),
        ]),
        borderWidth: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
  title: PropTypes.string,
  height: PropTypes.number,
};

export default BarChart;
