function shortIp(ip) {
  if (!ip) return '—';
  if (ip.length > 24) return ip.slice(0, 12) + '…' + ip.slice(-6);
  return ip;
}

function sourceKey(s) {
  if (!s) return '__all__';
  return `${s.external_ip ?? ''}||${s.internal_ip ?? ''}`;
}

function labelFor(s) {
  const ext = shortIp(s.external_ip);
  const int = shortIp(s.internal_ip);
  return `${int} → ${ext}  (${s.count})`;
}

export default function SourceSelector({ sources, selected, onChange }) {
  if (!sources || sources.length <= 1) return null;

  const handle = (e) => {
    if (e.target.value === '__all__') {
      onChange(null);
      return;
    }
    const s = sources.find((x) => sourceKey(x) === e.target.value);
    if (s) onChange({ external_ip: s.external_ip, internal_ip: s.internal_ip });
  };

  return (
    <div className="source-bar">
      <label htmlFor="source-select">Source</label>
      <select
        id="source-select"
        value={selected ? sourceKey(selected) : '__all__'}
        onChange={handle}
      >
        <option value="__all__">All sources</option>
        {sources.map((s) => (
          <option key={sourceKey(s)} value={sourceKey(s)}>
            {labelFor(s)}
          </option>
        ))}
      </select>
    </div>
  );
}
