import { spawnSync } from 'node:child_process';
import { insertMeasurement } from './db.js';

const SPEEDTEST_BIN = process.env.SPEEDTEST_BIN || 'speedtest';

function runSpeedtest() {
  const result = spawnSync(
    SPEEDTEST_BIN,
    ['--format=json', '--accept-license', '--accept-gdpr', '-p', 'no'],
    { encoding: 'utf8', timeout: 120_000 }
  );

  if (result.error) {
    throw new Error(`Failed to spawn speedtest: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `speedtest exited with status ${result.status}: ${result.stderr || result.stdout}`
    );
  }
  return JSON.parse(result.stdout);
}

function bytesPerSecToMbps(bps) {
  return (bps * 8) / 1_000_000;
}

function buildRow(payload) {
  return {
    ts: payload.timestamp,
    ping_ms: payload.ping?.latency ?? null,
    jitter_ms: payload.ping?.jitter ?? null,
    download_mbps: bytesPerSecToMbps(payload.download?.bandwidth ?? 0),
    upload_mbps: bytesPerSecToMbps(payload.upload?.bandwidth ?? 0),
    packet_loss: payload.packetLoss ?? null,
    download_latency_iqm: payload.download?.latency?.iqm ?? null,
    upload_latency_iqm: payload.upload?.latency?.iqm ?? null,
    server_id: payload.server?.id ?? null,
    server_name: payload.server
      ? `${payload.server.name ?? ''} (${payload.server.location ?? ''})`.trim()
      : null,
    isp: payload.isp ?? null,
    external_ip: payload.interface?.externalIp ?? null,
    result_url: payload.result?.url ?? null,
    raw_json: JSON.stringify(payload),
  };
}

try {
  const payload = runSpeedtest();
  const row = buildRow(payload);
  insertMeasurement(row);
  console.log(
    `[${row.ts}] down=${row.download_mbps.toFixed(2)} Mbps ` +
      `up=${row.upload_mbps.toFixed(2)} Mbps ping=${row.ping_ms?.toFixed(2)} ms`
  );
  process.exit(0);
} catch (err) {
  console.error(`speedtest collection failed: ${err.message}`);
  process.exit(1);
}
