# Daily Report (`dev` branch)

Versi lokal tanpa Docker, tanpa MinIO, tanpa PostgreSQL.

- **Database:** MySQL / MariaDB lokal
- **Storage:** folder `storage/` di project
- **App:** Next.js di host

> Branch `main` tetap memakai PostgreSQL + MinIO + Docker. Perubahan stack ini hanya di `dev`.

## Stack

- Next.js (App Router) + TypeScript
- MySQL + Prisma
- Auth.js (credentials) + role `USER` / `ADMIN`
- Local filesystem untuk logo, dokumentasi, tanda tangan

## Cara menjalankan

### 1. Siapkan MySQL

```bash
sudo service mariadb start   # atau: sudo systemctl start mysql
sudo mysql -e "CREATE DATABASE IF NOT EXISTS dailyreport CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'dailyreport'@'localhost' IDENTIFIED BY 'dailyreport';"
sudo mysql -e "GRANT ALL PRIVILEGES ON dailyreport.* TO 'dailyreport'@'localhost'; FLUSH PRIVILEGES;"
```

### 2. Clone, install, env

```bash
git clone git@github.com:restuedos/daily-report.git
cd daily-report
git checkout dev
npm install
cp .env.local.example .env.local
```

Sesuaikan `DATABASE_URL` / `STORAGE_DIR` bila perlu.

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

Akun admin awal dari env: `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Upload disimpan di `./storage` (diabaikan git kecuali `.gitkeep`).

## Tunneling (demo publik, branch `dev` saja)

Pakai Cloudflare quick tunnel agar teman bisa buka app dari internet tanpa deploy. Hanya relevan di branch `dev` (local MySQL + `storage/`).

### 1. Jalankan app

```bash
git checkout dev
npm run dev -- --hostname 127.0.0.1 --port 3000
```

### 2. Buka tunnel (terminal lain)

```bash
npx --yes cloudflared tunnel --url http://127.0.0.1:3000
```

Salin URL publik yang muncul, misalnya `https://xxxx.trycloudflare.com`.

### 3. Samakan Auth URL

Di `.env.local` (dan `.env` jika dipakai), set URL tunnel:

```bash
NEXTAUTH_URL=https://xxxx.trycloudflare.com
APP_URL=https://xxxx.trycloudflare.com
AUTH_URL=https://xxxx.trycloudflare.com
AUTH_TRUST_HOST=true
```

Lalu **restart** `npm run dev` agar env terbaca.

`next.config.ts` sudah mengizinkan HMR dari `**.trycloudflare.com` (`allowedDevOrigins`), jadi form/Enter tidak perlu full reload.

### 4. Bagikan & hentikan

Bagikan URL `https://xxxx.trycloudflare.com` ke teman. Login pakai akun admin dari env.

Untuk menghentikan: `Ctrl+C` di terminal tunnel (dan app jika perlu). Setelah demo, kembalikan `NEXTAUTH_URL` / `APP_URL` ke `http://localhost:3000`.

> URL quick tunnel berubah setiap kali dijalankan ulang. Jangan commit URL tunnel ke repo.

## Catatan

- File dilayani lewat `/api/files/...` (perlu login).
- Export DOCX tetap memakai sample Word di `docs/`.
- Script Docker (`docker-compose*`, `scripts/dev-up.sh`, dll.) tidak dipakai di branch ini.
