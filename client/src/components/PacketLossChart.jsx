import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

const TIME_FORMATS = {
  millisecond: 'HH:mm',
  second: 'HH:mm',
  minute: 'HH:mm',
  hour: 'HH:mm',
  day: 'MMM d',
  week: 'MMM d',
  month: 'MMM yyyy',
  quarter: 'MMM yyyy',
  year: 'yyyy',
};

export default function PacketLossChart({ measurements, range }) {
  if (!measurements.length) {
    return <div className="empty">No measurements in this range yet.</div>;
  }

  const labels = measurements.map((m) => new Date(m.ts));

  const data = {
    labels,
    datasets: [
      {
        label: 'Packet loss (%)',
        data: measurements.map((m) => m.packet_loss),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.15)',
        tension: 0.25,
        spanGaps: true,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: '#cfd3d8' } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        type: 'time',
        time: { displayFormats: TIME_FORMATS, tooltipFormat: 'yyyy-MM-dd HH:mm' },
        min: range?.from,
        max: range?.to,
        ticks: { color: '#8b9098', maxTicksLimit: 8, autoSkip: true },
        grid: { color: '#20232a' },
      },
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: '%', color: '#8b9098' },
        ticks: { color: '#8b9098' },
        grid: { color: '#20232a' },
        beginAtZero: true,
        suggestedMax: 5,
      },
    },
  };

  return <Line data={data} options={options} />;
}
