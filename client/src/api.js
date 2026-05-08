export async function fetchMeasurements(fromIso, toIso) {
  const params = new URLSearchParams({ from: fromIso, to: toIso });
  const res = await fetch(`/api/measurements?${params}`);
  if (!res.ok) throw new Error(`measurements ${res.status}`);
  return res.json();
}

export async function fetchLatest() {
  const res = await fetch('/api/latest');
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`latest ${res.status}`);
  return res.json();
}
