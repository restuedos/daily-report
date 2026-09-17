#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.prod ]]; then
  echo "Missing .env.prod"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.prod
set +a

if [[ -z "${DOMAIN:-}" || -z "${CERTBOT_EMAIL:-}" ]]; then
  echo "DOMAIN and CERTBOT_EMAIL required in .env.prod"
  exit 1
fi

# Materialize nginx prod config with real domain
sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" docker/nginx/prod.conf.template > docker/nginx/prod.conf

docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d proxy

docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$CERTBOT_EMAIL" \
  --agree-tos \
  --no-eff-email

docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod exec proxy nginx -s reload || true
echo "Certificate issued for $DOMAIN"
