# SIMO — Sistem Informasi Monitoring Operasional

**CV Mugi Jaya** · Kelompok Maju Lancar · S1 Informatika AMIKOM Yogyakarta

Sistem web & mobile terintegrasi untuk memonitor operasional manufaktur aluminium & kaca, terdiri dari 3 modul: **Produksi**, **Quality Control (QC)**, dan **Logistik**.

> Panduan teknis lengkap (arsitektur, RBAC, schema database, rencana sprint) ada di [`CLAUDE.md`](./CLAUDE.md).

---

## Struktur Repository

```
SIMO-CV-Mugi-Jaya/
├── frontend/          # React 18 + TypeScript + Vite + Tailwind + shadcn/ui
├── backend/           # Express.js + TypeScript + Prisma + PostgreSQL + Redis
├── docker-compose.yml # PostgreSQL + Redis (development)
└── .github/workflows/ # CI (lint + build)
```

## Tech Stack

| Layer    | Teknologi |
|----------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router v6, Axios, Socket.io-client |
| Backend  | Node.js, Express.js, TypeScript, Prisma, PostgreSQL, Redis, JWT, Zod, Socket.io |
| DevOps   | Docker Compose, GitHub Actions |

## Cara Menjalankan (Development)

Prasyarat: **Node.js 20+**, **Docker** (untuk PostgreSQL & Redis).

```bash
# 1. Jalankan database & cache
docker-compose up -d postgres redis

# 2. Backend
cd backend
cp .env.example .env          # sesuaikan nilainya bila perlu
npm install
npx prisma migrate dev        # buat tabel di database
npx prisma db seed            # isi data dummy
npm run dev                   # http://localhost:3000

# 3. Frontend (terminal terpisah)
cd frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

Verifikasi backend: `GET http://localhost:3000/api/health` → `{ "status": "ok" }`.

## Deployment (Production — gratis)

Arsitektur hybrid — frontend & backend di-deploy terpisah, auto-deploy saat push ke `main`:

| Komponen | Platform | Konfigurasi |
|---|---|---|
| Frontend (React/Vite) | **Vercel** | `frontend/vercel.json` (root directory: `frontend/`) |
| Backend (Express + Socket.io) | **Render** (free) | `render.yaml` (blueprint) + `backend/Dockerfile` |
| Database | **Neon** (free PostgreSQL) | connection string diisi ke `DATABASE_URL` |

**Environment variables produksi:**
- Render (backend): `DATABASE_URL` (Neon, akhiri `?sslmode=require`), `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL` (domain Vercel; boleh banyak, dipisah koma), `NODE_ENV=production`
- Vercel (frontend): `VITE_API_URL=https://<backend>.onrender.com/api`, `VITE_SOCKET_URL=https://<backend>.onrender.com`

Migrasi database (`prisma migrate deploy`) berjalan otomatis saat container backend start. Seed awal dijalankan sekali dari lokal: `DATABASE_URL=<neon> npx prisma db seed`.

> Catatan free tier Render: service "tidur" setelah ±15 menit idle — request pertama butuh ±30–60 detik untuk bangun. Buka URL backend sebelum demo agar hangat.

Dokumentasi endpoint lengkap: [`API.md`](./API.md).

## Pengujian

```bash
cd backend
npm test                  # unit test (Vitest)
npm run test:integration  # alur Produksi -> QC -> Logistik
npm run test:uat          # UAT RBAC 6 role
```

## Akun Seed (Development)

Semua user seed memakai password **`Simo@2026`**.

| Role | Email |
|------|-------|
| OWNER | owner@mugijaya.co.id |
| KEPALA_PRODUKSI | yudi@mugijaya.co.id |
| MANDOR | asep@mugijaya.co.id |
| INSPECTOR_QC | qc@mugijaya.co.id |
| SUPERVISOR_LAPANGAN | edi@mugijaya.co.id |
| ADMIN_OPERASIONAL | admin@mugijaya.co.id |

## Tim Pengembang

| Nama | NIM | Role | Modul |
|------|-----|------|-------|
| Ahmad Daffa | 23.11.5697 | Product Owner | Backlog & dokumentasi |
| Muhammad Tegar Revolusi Seto | 23.11.5743 | Scrum Master | Infrastruktur, CI/CD, auth |
| Nafiza Mahadri Widyatamaka | 23.11.5741 | Developer | Modul Produksi |
| Redomas Baegy Hardianathan | 23.11.5733 | Developer | Modul Logistik |
| Regian | 23.11.5707 | Developer | Modul QC |

## Git Flow

- `main` — rilis stabil (tidak push langsung)
- `develop` — integrasi (tidak push langsung)
- `feature/produksi` · `feature/qc` · `feature/logistik` — branch pengembangan per modul

Commit mengikuti [Conventional Commits](https://www.conventionalcommits.org/): `feat(modul): ...`, `fix(modul): ...`, `chore: ...`.

---

## Status Sprint

| Sprint | Cakupan | Status |
|---|---|---|
| 1 | Fondasi: monorepo, schema 12 entitas, seed, CI | ✅ |
| 2 | Autentikasi, RBAC, halaman login, shell per role, 403 | ✅ |
| 3 | Modul Produksi: status pekerjaan + foto (FR-01), dashboard real-time (FR-02) | ✅ |
| 4 | Modul QC: checklist toleransi (FR-04), certificate (FR-05), NCI (FR-06), repositori (FR-12) | ✅ |
| 5 | Modul Logistik: vendor AVL (FR-07), manifest wajib QC cert (FR-08), tracking & geofence (FR-09/10), check-in (FR-11) | ✅ |
| 6 | Integrasi: audit trail lintas modul, notifikasi keterlambatan (FR-03) & anomali real-time, integration test | ✅ |
| 7 | Testing: 20 unit test, UAT RBAC, offline-sync queue (NFR-05) | ✅ |
| 8 | Deployment: Dockerfile, Vercel + Railway, dokumentasi API | ✅ |

S1 Informatika — Fakultas Ilmu Komputer · Universitas AMIKOM Yogyakarta — 2026
