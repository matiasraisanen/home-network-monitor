import { useEffect, useState } from 'react';

const PRESETS = [
  { id: '10m', label: '10m', ms: 10 * 60 * 1000 },
  { id: '30m', label: '30m', ms: 30 * 60 * 1000 },
  { id: '1h', label: '1h', ms: 60 * 60 * 1000 },
  { id: '6h', label: '6h', ms: 6 * 60 * 60 * 1000 },
  { id: '24h', label: '24h', ms: 24 * 60 * 60 * 1000 },
  { id: '7d', label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
  { id: '30d', label: '30d', ms: 30 * 24 * 60 * 60 * 1000 },
];

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pad = (n) => String(n).padStart(2, '0');
const dateOnly = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeOnly = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function combineToIso(dateStr, timeStr) {
  if (!dateStr || !TIME_RE.test(timeStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

export default function RangeSelector({ value, onChange }) {
  const [customOpen, setCustomOpen] = useState(value.preset === 'custom');

  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const initialFrom = value.from ? new Date(value.from) : defaultFrom;
  const initialTo = value.to ? new Date(value.to) : now;

  const [fromDate, setFromDate] = useState(dateOnly(initialFrom));
  const [fromTime, setFromTime] = useState(timeOnly(initialFrom));
  const [toDate, setToDate] = useState(dateOnly(initialTo));
  const [toTime, setToTime] = useState(timeOnly(initialTo));

  useEffect(() => {
    if (value.preset === 'custom' && value.from && value.to) {
      const f = new Date(value.from);
      const t = new Date(value.to);
      setFromDate(dateOnly(f));
      setFromTime(timeOnly(f));
      setToDate(dateOnly(t));
      setToTime(timeOnly(t));
    }
  }, [value.preset, value.from, value.to]);

  const setPreset = (preset) => {
    setCustomOpen(false);
    onChange({ preset: preset.id });
  };

  const apply = () => {
    const from = combineToIso(fromDate, fromTime);
    const to = combineToIso(toDate, toTime);
    if (!from || !to || new Date(from) >= new Date(to)) return;
    onChange({ preset: 'custom', from, to });
  };

  const onTimeKey = (e) => {
    if (e.key === 'Enter') apply();
  };

  const fromValid = TIME_RE.test(fromTime);
  const toValid = TIME_RE.test(toTime);

  return (
    <div className="range-bar">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          className={value.preset === p.id ? 'active' : ''}
          onClick={() => setPreset(p)}
        >
          {p.label}
        </button>
      ))}
      <button
        className={value.preset === 'custom' ? 'active' : ''}
        onClick={() => setCustomOpen((v) => !v)}
      >
        Custom…
      </button>
      {customOpen && (
        <>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="HH:MM"
            maxLength={5}
            size={5}
            className={fromValid ? '' : 'invalid'}
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            onKeyDown={onTimeKey}
          />
          <span>→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="HH:MM"
            maxLength={5}
            size={5}
            className={toValid ? '' : 'invalid'}
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            onKeyDown={onTimeKey}
          />
          <button className="apply" onClick={apply}>
            Apply
          </button>
        </>
      )}
    </div>
  );
}

export function resolveRange(value) {
  if (value.preset === 'custom' && value.from && value.to) {
    return { from: value.from, to: value.to };
  }
  const preset = PRESETS.find((p) => p.id === value.preset) ?? PRESETS[3];
  const to = new Date();
  const from = new Date(to.getTime() - preset.ms);
  return { from: from.toISOString(), to: to.toISOString() };
}
