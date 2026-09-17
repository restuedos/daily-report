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

## Catatan

- File dilayani lewat `/api/files/...` (perlu login).
- Export DOCX tetap memakai sample Word di `docs/`.
- Script Docker (`docker-compose*`, `scripts/dev-up.sh`, dll.) tidak dipakai di branch ini.
