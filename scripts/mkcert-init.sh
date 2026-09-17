#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOST="${1:-daily-report.localhost}"
OUT="$ROOT/certs/local"
mkdir -p "$OUT"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is required. Install: https://github.com/FiloSottile/mkcert"
  exit 1
fi

mkcert -install
mkcert -cert-file "$OUT/cert.pem" -key-file "$OUT/key.pem" "$HOST" localhost 127.0.0.1 ::1
echo "Wrote $OUT/cert.pem and $OUT/key.pem for $HOST"
