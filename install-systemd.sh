#!/usr/bin/env bash
# Render the systemd unit templates with the local node path + workdir,
# install them under ~/.config/systemd/user/, and reload the user manager.
#
# Run from the repo root after `npm install && npm run build`.

set -euo pipefail

NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "node not found on PATH" >&2
  exit 1
fi

WORKDIR="$(pwd)"
DEST="$HOME/.config/systemd/user"
mkdir -p "$DEST"

for f in systemd/*.service systemd/*.timer; do
  name="$(basename "$f")"
  sed -e "s|__NODE_BIN__|$NODE_BIN|g" \
      -e "s|__WORKDIR__|$WORKDIR|g" \
      "$f" > "$DEST/$name"
  echo "  installed $DEST/$name"
done

systemctl --user daemon-reload

cat <<EOF

Done. Enable and start the units with:

  systemctl --user enable --now network-check-collect.timer network-check-web.service

To survive logout/reboot without a session:

  sudo loginctl enable-linger "\$USER"

The dashboard will be at http://localhost:3000 (or http://<host-ip>:3000 on the LAN).
EOF
