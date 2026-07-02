---
title: SIMO Backend
emoji: 🏭
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 3000
pinned: false
---

# SIMO Backend — Hugging Face Space

Backend API **SIMO (Sistem Informasi Monitoring Operasional) CV Mugi Jaya** — Express + TypeScript + Prisma + Socket.io.

Space ini menjalankan `Dockerfile` di folder ini. Health check: `/api/health`.

## Secrets yang wajib diisi (Settings → Variables and secrets)

| Nama | Nilai |
|---|---|
| `DATABASE_URL` | Connection string Neon (pooler, `?sslmode=require`) |
| `JWT_SECRET` | String acak ≥32 karakter |
| `JWT_REFRESH_SECRET` | String acak ≥32 karakter |
| `FRONTEND_URL` | Domain Vercel frontend (boleh banyak, dipisah koma) |
| `NODE_ENV` | `production` |

> Repo utama & dokumentasi lengkap: GitHub `nafizamhdr/SIMO-CV-Mugi-Jaya` (lihat `API.md`).
