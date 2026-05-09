function appendSource(params, source) {
  if (!source) return;
  for (const f of ['external_ip', 'internal_ip', 'network_label']) {
    if (source[f] !== undefined) params.set(f, source[f] ?? '');
  }
}

export async function fetchMeasurements(fromIso, toIso, source) {
  const params = new URLSearchParams({ from: fromIso, to: toIso });
  appendSource(params, source);
  const res = await fetch(`/api/measurements?${params}`);
  if (!res.ok) throw new Error(`measurements ${res.status}`);
  return res.json();
}

export async function fetchLatest(source) {
  const params = new URLSearchParams();
  appendSource(params, source);
  const qs = params.toString() ? `?${params}` : '';
  const res = await fetch(`/api/latest${qs}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`latest ${res.status}`);
  return res.json();
}

export async function fetchSources() {
  const res = await fetch('/api/sources');
  if (!res.ok) throw new Error(`sources ${res.status}`);
  return res.json();
}
