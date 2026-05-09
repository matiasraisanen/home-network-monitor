import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { getRange, getLatest, getSources } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();

function readSourceFilter(query) {
  const filter = {};
  for (const f of ['external_ip', 'internal_ip', 'network_label']) {
    if (typeof query[f] === 'string') filter[f] = query[f] || null;
  }
  return filter;
}

app.get('/api/measurements', (req, res) => {
  const now = Date.now();
  const defaultFrom = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const defaultTo = new Date(now).toISOString();
  const from = typeof req.query.from === 'string' ? req.query.from : defaultFrom;
  const to = typeof req.query.to === 'string' ? req.query.to : defaultTo;

  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
    return res.status(400).json({ error: 'Invalid from/to (must be ISO 8601)' });
  }

  res.json(getRange(from, to, readSourceFilter(req.query)));
});

app.get('/api/latest', (req, res) => {
  const row = getLatest(readSourceFilter(req.query));
  if (!row) return res.status(404).json({ error: 'No measurements yet' });
  res.json(row);
});

app.get('/api/sources', (_req, res) => {
  res.json(getSources());
});

const clientDist = resolve(__dirname, '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(resolve(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.status(503).send(
      'Client not built yet. Run `npm run build` first, then restart the server.'
    );
  });
}

app.listen(PORT, HOST, () => {
  console.log(`network-check listening on http://${HOST}:${PORT}`);
});
