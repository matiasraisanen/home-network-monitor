# network-check

Continuous home internet quality monitor: runs `speedtest` every 5 minutes,
stores results in SQLite, and shows them on a dashboard with a configurable
time range.

## Stack

- **Collector**: Node.js script invoking the Ookla `speedtest` CLI in JSON mode
- **Storage**: SQLite (`data/measurements.db`) via `better-sqlite3`
- **API**: Express, exposes `/api/measurements` and `/api/latest`
- **Dashboard**: React + Vite + Chart.js
- **Scheduling**: systemd user-level timer (every 5 min) + service for the web app

## Prerequisites

- Node.js 20+ (works on 22 / 24)
- The Ookla `speedtest` CLI on `$PATH`
  (override with the `SPEEDTEST_BIN` env var if it lives elsewhere)
- `systemd` for the recommended scheduling setup
- `bash`, `sed`, `mkdir` for the install script

Install the speedtest CLI (if not already): see
<https://www.speedtest.net/apps/cli>.

## Install

```bash
git clone <this-repo> network-check
cd network-check
npm install
npm run build           # builds the React client into client/dist
```

If `npm install` reports a missing native binary for `better-sqlite3` on a
newer Node version, fetch a matching prebuild:

```bash
( cd node_modules/better-sqlite3 && npx prebuild-install )
```

## One-off test

Make sure the collector works (this also accepts the speedtest license/GDPR on
first run and creates `data/measurements.db`):

```bash
node server/collect.js
```

Then start the web app and visit it locally:

```bash
npm start
# open http://localhost:3000
```

## Run permanently with systemd (user-level)

The unit files in `systemd/` are templates; `install-systemd.sh` fills in the
local `node` path and current working directory and copies them into
`~/.config/systemd/user/`.

```bash
./install-systemd.sh
systemctl --user enable --now network-check-collect.timer network-check-web.service

# Optional: keep services running after logout / across reboots
sudo loginctl enable-linger "$USER"
```

Verify:

```bash
systemctl --user list-timers | grep network-check
systemctl --user status network-check-web.service
journalctl --user -u network-check-collect.service -n 50
```

## LAN access

The web service binds to `0.0.0.0:3000`. Visit `http://<host-ip>:3000` from any
device on your network. Open the firewall if needed (e.g.
`sudo ufw allow 3000/tcp`).

## Endpoints

- `GET /api/measurements?from=<iso>&to=<iso>` — defaults to last 24h
- `GET /api/latest` — most recent sample

## Project layout

```
server/             Node API + collector
client/             React + Vite dashboard
systemd/            Unit-file templates (rendered by install-systemd.sh)
install-systemd.sh  Renders + installs the user units
data/               SQLite DB (gitignored)
```

## Updating

```bash
git pull
npm install
npm run build
systemctl --user restart network-check-web.service
```
