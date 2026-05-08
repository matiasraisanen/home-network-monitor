import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new Database(resolve(dataDir, 'measurements.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS measurements (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    ts            TEXT    NOT NULL,
    ping_ms       REAL    NOT NULL,
    jitter_ms     REAL,
    download_mbps REAL    NOT NULL,
    upload_mbps   REAL    NOT NULL,
    packet_loss   REAL,
    download_latency_iqm REAL,
    upload_latency_iqm   REAL,
    server_id     INTEGER,
    server_name   TEXT,
    isp           TEXT,
    external_ip   TEXT,
    internal_ip   TEXT,
    result_url    TEXT,
    raw_json      TEXT    NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_measurements_ts ON measurements(ts);
`);

const cols = new Set(db.prepare('PRAGMA table_info(measurements)').all().map(c => c.name));
if (!cols.has('download_latency_iqm')) {
  db.exec('ALTER TABLE measurements ADD COLUMN download_latency_iqm REAL');
}
if (!cols.has('upload_latency_iqm')) {
  db.exec('ALTER TABLE measurements ADD COLUMN upload_latency_iqm REAL');
}
if (!cols.has('internal_ip')) {
  db.exec('ALTER TABLE measurements ADD COLUMN internal_ip TEXT');
}

const insertStmt = db.prepare(`
  INSERT INTO measurements
    (ts, ping_ms, jitter_ms, download_mbps, upload_mbps, packet_loss,
     download_latency_iqm, upload_latency_iqm,
     server_id, server_name, isp, external_ip, internal_ip, result_url, raw_json)
  VALUES
    (@ts, @ping_ms, @jitter_ms, @download_mbps, @upload_mbps, @packet_loss,
     @download_latency_iqm, @upload_latency_iqm,
     @server_id, @server_name, @isp, @external_ip, @internal_ip, @result_url, @raw_json)
`);

const sourcesStmt = db.prepare(`
  SELECT external_ip, internal_ip,
         COUNT(*) AS count,
         MIN(ts) AS first_seen,
         MAX(ts) AS last_seen
  FROM measurements
  GROUP BY external_ip, internal_ip
  ORDER BY last_seen DESC
`);

function buildSourceWhere(filter, params) {
  const clauses = [];
  if (filter.external_ip !== undefined) {
    clauses.push(
      `COALESCE(external_ip, '') = COALESCE(@external_ip, '')`
    );
    params.external_ip = filter.external_ip;
  }
  if (filter.internal_ip !== undefined) {
    clauses.push(
      `COALESCE(internal_ip, '') = COALESCE(@internal_ip, '')`
    );
    params.internal_ip = filter.internal_ip;
  }
  return clauses;
}

export function insertMeasurement(row) {
  return insertStmt.run(row);
}

export function getRange(from, to, filter = {}) {
  const params = { from, to };
  const where = ['ts >= @from', 'ts <= @to', ...buildSourceWhere(filter, params)];
  const sql = `
    SELECT ts, ping_ms, jitter_ms, download_mbps, upload_mbps, packet_loss,
           download_latency_iqm, upload_latency_iqm,
           external_ip, internal_ip
    FROM measurements
    WHERE ${where.join(' AND ')}
    ORDER BY ts ASC
  `;
  return db.prepare(sql).all(params);
}

export function getLatest(filter = {}) {
  const params = {};
  const where = buildSourceWhere(filter, params);
  const sql = `
    SELECT ts, ping_ms, jitter_ms, download_mbps, upload_mbps, packet_loss,
           download_latency_iqm, upload_latency_iqm,
           server_name, isp, external_ip, internal_ip, result_url
    FROM measurements
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ts DESC
    LIMIT 1
  `;
  return db.prepare(sql).get(params);
}

export function getSources() {
  return sourcesStmt.all();
}
