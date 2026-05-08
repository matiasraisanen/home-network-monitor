import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler
);

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

export default function SpeedChart({ measurements, range }) {
  if (!measurements.length) {
    return <div className="empty">No measurements in this range yet.</div>;
  }

  const labels = measurements.map((m) => new Date(m.ts));

  const data = {
    labels,
    datasets: [
      {
        label: 'Download (Mbps)',
        data: measurements.map((m) => m.download_mbps),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.15)',
        tension: 0.25,
        fill: false,
      },
      {
        label: 'Upload (Mbps)',
        data: measurements.map((m) => m.upload_mbps),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.15)',
        tension: 0.25,
        fill: false,
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
        title: { display: true, text: 'Mbps', color: '#8b9098' },
        ticks: { color: '#8b9098' },
        grid: { color: '#20232a' },
        beginAtZero: true,
      },
    },
  };

  return <Line data={data} options={options} />;
}
