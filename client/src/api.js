function appendSource(params, source) {
  if (!source) return;
  if (source.external_ip !== undefined) params.set('external_ip', source.external_ip ?? '');
  if (source.internal_ip !== undefined) params.set('internal_ip', source.internal_ip ?? '');
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
