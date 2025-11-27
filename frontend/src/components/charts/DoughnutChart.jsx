import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import PropTypes from 'prop-types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

/**
 * Componente de gráfico de dona (doughnut)
 */
const DoughnutChart = ({ data, title, height = 300 }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
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
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Doughnut options={options} data={data} />
    </div>
  );
};

DoughnutChart.propTypes = {
  data: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        data: PropTypes.arrayOf(PropTypes.number).isRequired,
        backgroundColor: PropTypes.arrayOf(PropTypes.string),
        borderColor: PropTypes.arrayOf(PropTypes.string),
        borderWidth: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
  title: PropTypes.string,
  height: PropTypes.number,
};

export default DoughnutChart;
