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

export default function LatencyChart({ measurements, range }) {
  if (!measurements.length) {
    return <div className="empty">No measurements in this range yet.</div>;
  }

  const labels = measurements.map((m) => new Date(m.ts));

  const data = {
    labels,
    datasets: [
      {
        label: 'Idle ping (ms)',
        data: measurements.map((m) => m.ping_ms),
        borderColor: '#f97316',
        yAxisID: 'yMs',
        tension: 0.25,
      },
      {
        label: 'Jitter (ms)',
        data: measurements.map((m) => m.jitter_ms),
        borderColor: '#a855f7',
        yAxisID: 'yMs',
        tension: 0.25,
      },
      {
        label: 'Download loaded latency (ms)',
        data: measurements.map((m) => m.download_latency_iqm),
        borderColor: '#22c55e',
        borderDash: [4, 4],
        yAxisID: 'yMs',
        tension: 0.25,
        spanGaps: true,
      },
      {
        label: 'Upload loaded latency (ms)',
        data: measurements.map((m) => m.upload_latency_iqm),
        borderColor: '#3b82f6',
        borderDash: [4, 4],
        yAxisID: 'yMs',
        tension: 0.25,
        spanGaps: true,
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
      yMs: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'ms', color: '#8b9098' },
        ticks: { color: '#8b9098' },
        grid: { color: '#20232a' },
        beginAtZero: true,
      },
    },
  };

  return <Line data={data} options={options} />;
}
