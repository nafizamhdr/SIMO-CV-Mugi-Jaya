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

**Sprint 1 — Fondasi & Setup Proyek** ✅
- Struktur monorepo `frontend/` + `backend/`
- Backend Express + Prisma + JWT auth + RBAC + `GET /api/health`
- Schema database 12 entitas (3 modul) + migration + seed data dummy
- Shared frontend: AuthContext, services, route guard berbasis role
- Docker Compose (PostgreSQL + Redis) & GitHub Actions CI

S1 Informatika — Fakultas Ilmu Komputer · Universitas AMIKOM Yogyakarta — 2026
