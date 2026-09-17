#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.prod ]]; then
  echo "Missing .env.prod — copy from .env.prod.example"
  exit 1
fi

docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build "$@"
echo "Prod stack up → check APP_URL / DOMAIN in .env.prod"
