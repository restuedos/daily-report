# Daily Report

Aplikasi web Daily Report & Surat Jalan: form terstruktur, template HTML di database, upload MinIO, export PDF/DOCX.

## Stack

- Next.js (App Router) + TypeScript
- PostgreSQL + Prisma
- Auth.js (credentials) + role `USER` / `ADMIN`
- MinIO (S3)
- Docker Compose (local / prod)

## Cara menjalankan (local)

### 1. Clone & install

```bash
git clone git@github.com:restuedos/daily-report.git
cd daily-report
npm install
cp .env.local.example .env.local
```

Sesuaikan secret/password di `.env.local` bila perlu.

### 2. Jalankan PostgreSQL + MinIO

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file .env.local up -d db minio minio-init
```

### 3. Migrasi & seed

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 4. Jalankan app

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Akun admin awal diambil dari env (`ADMIN_EMAIL` / `ADMIN_PASSWORD` di `.env.local.example`).

MinIO console: [http://localhost:19001](http://localhost:19001) (default `minioadmin` / `minioadmin`).

### Alternatif: full stack Docker + HTTPS lokal

```bash
cp .env.local.example .env.local
./scripts/mkcert-init.sh daily-report.localhost
# tambahkan 127.0.0.1 daily-report.localhost ke /etc/hosts
./scripts/dev-up.sh
```

Buka `https://daily-report.localhost`.

## Production

```bash
cp .env.prod.example .env.prod
# isi DOMAIN, CERTBOT_EMAIL, secrets
./scripts/prod-up.sh
./scripts/certbot-init.sh
```

Pisahkan project Compose local vs prod, misalnya:

```bash
COMPOSE_PROJECT_NAME=dailyreport-local ./scripts/dev-up.sh
COMPOSE_PROJECT_NAME=dailyreport-prod ./scripts/prod-up.sh
```

## Fitur

- Register / login, autosave report, duplikat report
- Template Editor (admin): HTML+CSS Handlebars, preview, aktifkan
- Export PDF (Puppeteer) & DOCX
- Surat Jalan dengan template terpisah
- Admin: riwayat login
- Sample dokumen di `docs/`
