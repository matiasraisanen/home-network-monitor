import { useEffect, useState, useCallback } from 'react';
import { fetchMeasurements, fetchLatest } from './api.js';
import RangeSelector, { resolveRange } from './components/RangeSelector.jsx';
import SpeedChart from './components/SpeedChart.jsx';
import LatencyChart from './components/LatencyChart.jsx';
import PacketLossChart from './components/PacketLossChart.jsx';
import StatsTable from './components/StatsTable.jsx';

const RECENT_PRESETS = new Set(['10m', '30m', '1h', '6h', '24h']);

export default function App() {
  const [range, setRange] = useState({ preset: '1h' });
  const [measurements, setMeasurements] = useState([]);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState(null);

  const [resolvedRange, setResolvedRange] = useState(() => resolveRange({ preset: '1h' }));

  const load = useCallback(async () => {
    try {
      const r = resolveRange(range);
      const [data, last] = await Promise.all([
        fetchMeasurements(r.from, r.to),
        fetchLatest(),
      ]);
      setMeasurements(data);
      setLatest(last);
      setResolvedRange(r);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!RECENT_PRESETS.has(range.preset)) return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [range.preset, load]);

  return (
    <>
      <h1>Network Check</h1>
      <p className="subtitle">
        Internet quality, sampled every 5 minutes.
      </p>

      {latest && (
        <div className="latest-card">
          <span>
            <strong>Last check</strong>
            {new Date(latest.ts).toLocaleString(undefined, { hour12: false })}
          </span>
          <span>
            <strong>Download</strong>
            {latest.download_mbps.toFixed(1)} Mbps
          </span>
          <span>
            <strong>Upload</strong>
            {latest.upload_mbps.toFixed(1)} Mbps
          </span>
          <span>
            <strong>Ping</strong>
            {latest.ping_ms?.toFixed(1)} ms
          </span>
          {latest.isp && (
            <span>
              <strong>ISP</strong>
              {latest.isp}
            </span>
          )}
          {latest.server_name && (
            <span>
              <strong>Server</strong>
              {latest.server_name}
            </span>
          )}
        </div>
      )}

      <RangeSelector value={range} onChange={setRange} />

      {error && <div className="empty">Error: {error}</div>}

      <StatsTable measurements={measurements} />

      <div className="chart-card">
        <h2 className="chart-title">Throughput</h2>
        <SpeedChart measurements={measurements} range={resolvedRange} />
      </div>

      <div className="chart-card" style={{ marginTop: '1rem' }}>
        <h2 className="chart-title">Latency</h2>
        <LatencyChart measurements={measurements} range={resolvedRange} />
      </div>

      <div className="chart-card" style={{ marginTop: '1rem' }}>
        <h2 className="chart-title">Packet loss</h2>
        <PacketLossChart measurements={measurements} range={resolvedRange} />
      </div>
    </>
  );
}
