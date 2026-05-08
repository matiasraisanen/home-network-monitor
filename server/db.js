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

const rangeStmt = db.prepare(`
  SELECT ts, ping_ms, jitter_ms, download_mbps, upload_mbps, packet_loss,
         download_latency_iqm, upload_latency_iqm,
         external_ip, internal_ip
  FROM measurements
  WHERE ts >= @from AND ts <= @to
  ORDER BY ts ASC
`);

const latestStmt = db.prepare(`
  SELECT ts, ping_ms, jitter_ms, download_mbps, upload_mbps, packet_loss,
         download_latency_iqm, upload_latency_iqm,
         server_name, isp, external_ip, internal_ip, result_url
  FROM measurements
  ORDER BY ts DESC
  LIMIT 1
`);

export function insertMeasurement(row) {
  return insertStmt.run(row);
}

export function getRange(from, to) {
  return rangeStmt.all({ from, to });
}

export function getLatest() {
  return latestStmt.get();
}
