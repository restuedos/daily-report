#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local — copy from .env.local.example"
  exit 1
fi

if [[ ! -f certs/local/cert.pem || ! -f certs/local/key.pem ]]; then
  echo "Local TLS certs missing. Run: ./scripts/mkcert-init.sh"
  exit 1
fi

docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file .env.local up -d --build "$@"
echo "Local stack up → https://daily-report.localhost (or APP_URL in .env.local)"
