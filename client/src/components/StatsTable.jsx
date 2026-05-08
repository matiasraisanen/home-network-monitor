const METRICS = [
  { key: 'download_mbps', label: 'Download', unit: 'Mbps', digits: 1 },
  { key: 'upload_mbps', label: 'Upload', unit: 'Mbps', digits: 1 },
  { key: 'ping_ms', label: 'Idle ping', unit: 'ms', digits: 1 },
  { key: 'jitter_ms', label: 'Jitter', unit: 'ms', digits: 1 },
  {
    key: 'download_latency_iqm',
    label: 'Loaded latency (down)',
    unit: 'ms',
    digits: 0,
  },
  {
    key: 'upload_latency_iqm',
    label: 'Loaded latency (up)',
    unit: 'ms',
    digits: 0,
  },
  { key: 'packet_loss', label: 'Packet loss', unit: '%', digits: 2 },
];

function summarize(values) {
  const xs = values.filter((v) => v != null && Number.isFinite(v));
  if (!xs.length) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  const median =
    sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  return { min: sorted[0], max: sorted[sorted.length - 1], median, n: xs.length };
}

export default function StatsTable({ measurements }) {
  if (!measurements.length) return null;

  return (
    <div className="stats-card">
      <h2 className="chart-title">
        Statistics{' '}
        <span className="stats-count">({measurements.length} samples)</span>
      </h2>
      <div className="stats-grid">
        <div className="stats-head">Metric</div>
        <div className="stats-head">Min</div>
        <div className="stats-head">Median</div>
        <div className="stats-head">Max</div>
        {METRICS.map((m) => {
          const s = summarize(measurements.map((row) => row[m.key]));
          return (
            <Row key={m.key} label={m.label} unit={m.unit} digits={m.digits} stats={s} />
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, unit, digits, stats }) {
  const fmt = (v) =>
    stats ? `${v.toFixed(digits)} ${unit}` : '—';
  return (
    <>
      <div className="stats-label">{label}</div>
      <div>{stats ? fmt(stats.min) : '—'}</div>
      <div>{stats ? fmt(stats.median) : '—'}</div>
      <div>{stats ? fmt(stats.max) : '—'}</div>
    </>
  );
}
