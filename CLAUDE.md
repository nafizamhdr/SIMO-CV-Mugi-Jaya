# CLAUDE.md — SIMO: Sistem Informasi Monitoring Operasional
## CV Mugi Jaya | Kelompok Maju Lancar | S1 Informatika AMIKOM Yogyakarta

Dokumen ini adalah panduan utama untuk Claude Code dalam mengerjakan seluruh pengembangan sistem SIMO.
Baca seluruh dokumen ini sebelum menulis satu baris kode pun.

---

## 1. KONTEKS PROYEK

### Klien
**CV Mugi Jaya** — perusahaan manufaktur dan instalasi aluminium & kaca, berkantor di Bekasi.
Mengerjakan proyek skala besar (fasad gedung, partisi ruangan, termasuk proyek IKN lintas pulau).
Mengelola 7–8 unit warehouse produksi dengan Mandor pihak ketiga.

### Masalah yang Dipecahkan
1. **Blind trust produksi** — tidak ada visibilitas real-time progres warehouse, semua laporan lisan.
2. **Kehilangan armada logistik** — pernah kehilangan truk+muatan ke IKN karena tidak ada tracking.
3. **QC salah penempatan** — quality control baru dilakukan saat instalasi di lapangan, bukan sebelum kirim.

### Sistem yang Dibangun
**SIMO** (Sistem Informasi Monitoring Operasional) — sistem web & mobile terintegrasi dengan 3 modul:
- **Modul Produksi** — input & monitoring status produksi per warehouse secara real-time
- **Modul QC** — gate-out QC digital (checklist, foto, certificate) sebelum barang dikirim
- **Modul Logistik** — manajemen vendor, manifest digital, live tracking armada, geofencing

---

## 2. TIM PENGEMBANG

| Nama | NIM | Role | Tanggung Jawab Teknis |
|------|-----|------|----------------------|
| Ahmad Daffa | 23.11.5697 | Product Owner | Backlog, review PR, demo ke klien |
| Muhammad Tegar Revolusi Seto | 23.11.5743 | Scrum Master | Infrastruktur, CI/CD, integrasi branch |
| Nafiza Mahadri Widyatamaka | 23.11.5741 | Developer | Modul Produksi (frontend + backend) |
| Redomas Baegy Hardianathan | 23.11.5733 | Developer | Modul Logistik (frontend + backend) |
| Regian | 23.11.5707 | Developer | Modul QC (frontend + backend) |

---

## 3. AKTOR SISTEM & HAK AKSES (RBAC)

| Aktor | Role Key | Akses Modul |
|-------|----------|-------------|
| Pemilik (Owner) | `OWNER` | Dashboard semua modul (read-only), Audit Trail |
| Kepala Produksi (Pak Yudi) | `KEPALA_PRODUKSI` | Modul Produksi penuh, Audit Trail |
| Mandor (Pihak Ketiga) | `MANDOR` | Input status produksi (mobile-first) |
| Inspector QC | `INSPECTOR_QC` | Modul QC penuh (checklist, certificate, NCI) |
| Supervisor Lapangan (Pak Edi) | `SUPERVISOR_LAPANGAN` | Repositori spesifikasi, validasi lapangan |
| Admin Operasional | `ADMIN_OPERASIONAL` | Modul Logistik penuh (vendor, manifest, tracking) |

> **Aturan RBAC:** Setiap route API dan halaman frontend wajib diproteksi sesuai tabel di atas.
> Akses ke modul yang tidak diizinkan harus mengembalikan `403 Forbidden`, bukan redirect login.

---

## 4. TECH STACK

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui (komponen sudah tersedia di `src/app/components/ui/`)
- **Routing:** React Router v6
- **State:** React hooks (useState, useContext, useReducer) — tidak menggunakan Redux
- **HTTP Client:** Axios
- **Real-time:** Socket.io-client (untuk dashboard produksi)
- **Offline:** localStorage + sync queue pattern

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Auth:** JWT (access token 1 jam, refresh token 7 hari)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Cache:** Redis (untuk antrian real-time dan session cache)
- **File Storage:** AWS S3 (foto QC, blueprint, dokumen)
- **Real-time:** Socket.io

### External Services
- Google Maps Platform — live tracking & geofencing
- GPS Tracker API — posisi armada
- WhatsApp Business API — notifikasi bisnis
- Firebase Cloud Messaging — push notification mobile

### DevOps
- Kontainerisasi: Docker + Docker Compose
- CI/CD: GitHub Actions
- Hosting: AWS EC2
- Monitoring: Datadog / UptimeRobot

---

## 5. STRUKTUR REPOSITORY

```
SIMO-CV-Mugi-Jaya/
├── CLAUDE.md                    ← file ini
├── README.md
├── .github/
│   └── workflows/
│       └── ci.yml               ← GitHub Actions CI/CD
├── frontend/                    ← React + Vite app
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx          ← root router
│   │   │   └── components/
│   │   │       ├── ui/          ← shadcn/ui components (JANGAN DIMODIFIKASI)
│   │   │       ├── Layout.tsx
│   │   │       ├── LoginPage.tsx
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── ProduksiPage.tsx   ← Nafiza
│   │   │       ├── QCPage.tsx         ← Regian
│   │   │       ├── LogistikPage.tsx   ← Redomas
│   │   │       ├── RepositoriPage.tsx ← Regian
│   │   │       ├── AuditTrailPage.tsx ← Regian
│   │   │       ├── SuratJalanModal.tsx ← Redomas
│   │   │       └── PreviewDocModal.tsx ← Redomas
│   │   ├── hooks/               ← custom React hooks
│   │   ├── services/            ← API call functions (axios)
│   │   │   ├── auth.service.ts
│   │   │   ├── produksi.service.ts
│   │   │   ├── qc.service.ts
│   │   │   └── logistik.service.ts
│   │   ├── types/               ← shared TypeScript interfaces
│   │   ├── context/             ← AuthContext, RoleContext
│   │   └── styles/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/                     ← Express.js API
│   ├── src/
│   │   ├── index.ts             ← entry point, server setup
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── produksi.routes.ts
│   │   │   ├── qc.routes.ts
│   │   │   └── logistik.routes.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    ← JWT verify
│   │   │   └── rbac.middleware.ts    ← role check
│   │   └── lib/
│   │       ├── prisma.ts
│   │       └── redis.ts
│   ├── prisma/
│   │   ├── schema.prisma        ← sumber kebenaran database
│   │   └── seed.ts              ← data dummy untuk development
│   ├── package.json
│   └── tsconfig.json
└── docker-compose.yml           ← PostgreSQL + Redis + App
```

---

## 6. DATABASE SCHEMA (12 Entitas)

Berikut adalah schema Prisma yang harus diimplementasikan. Ini adalah **sumber kebenaran** untuk seluruh database.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  OWNER
  KEPALA_PRODUKSI
  MANDOR
  INSPECTOR_QC
  SUPERVISOR_LAPANGAN
  ADMIN_OPERASIONAL
}

enum WorkItemStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum QCStatus {
  PENDING
  PASSED
  FAILED
}

enum ShipmentStatus {
  DRAFT
  DISPATCHED
  IN_TRANSIT
  DELIVERED
  ANOMALY
}

model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String   // bcrypt hash
  role        Role
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  warehouses  Warehouse[]
  workItems   WorkItem[]   @relation("AssignedTo")
  qcRecords   QCRecord[]
  auditLogs   AuditLog[]
  shipments   Shipment[]   @relation("CreatedBy")
}

model Project {
  id          String   @id @default(cuid())
  name        String
  location    String
  startDate   DateTime
  endDate     DateTime?
  createdAt   DateTime @default(now())

  workItems       WorkItem[]
  specifications  Specification[]
  shipments       Shipment[]
}

model Warehouse {
  id        String   @id @default(cuid())
  name      String
  location  String
  mandorId  String
  mandor    User     @relation(fields: [mandorId], references: [id])
  createdAt DateTime @default(now())

  workItems WorkItem[]
}

model WorkItem {
  id          String         @id @default(cuid())
  name        String
  description String?
  status      WorkItemStatus @default(TODO)
  projectId   String
  warehouseId String
  assigneeId  String?
  photoUrl    String?
  updatedAt   DateTime       @updatedAt
  createdAt   DateTime       @default(now())

  project   Project   @relation(fields: [projectId], references: [id])
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  assignee  User?     @relation("AssignedTo", fields: [assigneeId], references: [id])
  qcRecords QCRecord[]
}

model Specification {
  id          String   @id @default(cuid())
  projectId   String
  title       String
  version     String   @default("1.0")
  fileUrl     String
  uploadedAt  DateTime @default(now())

  project    Project    @relation(fields: [projectId], references: [id])
  qcRecords  QCRecord[]
}

model QCRecord {
  id              String   @id @default(cuid())
  workItemId      String
  specificationId String
  inspectorId     String
  status          QCStatus @default(PENDING)
  dimensions      Json     // { actual: {}, tolerance: {}, passed: bool }
  photoUrl        String?
  notes           String?
  inspectedAt     DateTime @default(now())

  workItem      WorkItem      @relation(fields: [workItemId], references: [id])
  specification Specification @relation(fields: [specificationId], references: [id])
  inspector     User          @relation(fields: [inspectorId], references: [id])
  ncItem        NCItem?
}

model NCItem {
  id            String   @id @default(cuid())
  qcRecordId    String   @unique
  defectDesc    String
  photoUrl      String?
  picRework     String
  estimatedDone DateTime
  resolvedAt    DateTime?

  qcRecord QCRecord @relation(fields: [qcRecordId], references: [id])
}

model QCCertificate {
  id          String   @id @default(cuid())
  certNumber  String   @unique
  projectId   String
  batchIds    String[] // array workItem IDs
  issuedAt    DateTime @default(now())

  shipment Shipment?
}

model Vendor {
  id           String   @id @default(cuid())
  name         String
  contact      String
  licenseNo    String
  rating       Float    @default(0)
  isApproved   Boolean  @default(false)
  createdAt    DateTime @default(now())

  shipments Shipment[]
}

model Shipment {
  id              String         @id @default(cuid())
  projectId       String
  vendorId        String
  qcCertificateId String?        @unique
  createdById     String
  driverName      String
  vehicleNo       String
  insurancePolis  String
  status          ShipmentStatus @default(DRAFT)
  departedAt      DateTime?
  arrivedAt       DateTime?
  createdAt       DateTime       @default(now())

  project        Project        @relation(fields: [projectId], references: [id])
  vendor         Vendor         @relation(fields: [vendorId], references: [id])
  qcCertificate  QCCertificate? @relation(fields: [qcCertificateId], references: [id])
  createdBy      User           @relation("CreatedBy", fields: [createdById], references: [id])
  trackingLogs   TrackingLog[]
}

model TrackingLog {
  id         String   @id @default(cuid())
  shipmentId String
  lat        Float
  lng        Float
  speed      Float?
  isAnomaly  Boolean  @default(false)
  loggedAt   DateTime @default(now())

  shipment Shipment @relation(fields: [shipmentId], references: [id])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // e.g. "UPDATE_WORK_ITEM_STATUS", "ISSUE_QC_CERTIFICATE"
  entity    String   // e.g. "WorkItem", "Shipment"
  entityId  String
  before    Json?
  after     Json?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

---

## 7. ATURAN PENGEMBANGAN (WAJIB DIIKUTI)

### Umum
- Semua kode dalam **TypeScript** — tidak ada file `.js` di dalam `src/`
- Nama variabel, fungsi, dan komentar dalam **bahasa Inggris**
- Teks antarmuka pengguna (label, pesan, notifikasi) dalam **bahasa Indonesia**
- Tidak boleh ada `console.log` di kode production — gunakan logger
- Setiap fungsi async harus punya error handling (`try/catch`)

### Frontend
- Komponen UI shadcn/ui di `src/app/components/ui/` **JANGAN DIMODIFIKASI** langsung — extend via props atau buat komponen wrapper
- Semua API call harus melalui file di `src/services/` — tidak boleh fetch/axios langsung di komponen
- Gunakan `AuthContext` untuk cek role sebelum render halaman — jangan hardcode kondisi role di komponen
- Offline-sync: input yang gagal terkirim wajib masuk ke antrian di localStorage dengan key `simo_sync_queue`

### Backend
- Setiap route harus melewati dua middleware: `authenticateJWT` lalu `requireRole([...roles])`
- Password **wajib** di-hash dengan bcrypt (salt rounds: 12) — tidak boleh disimpan plaintext
- Setiap perubahan status kritis (WorkItem, QCRecord, Shipment) wajib membuat entry `AuditLog` otomatis
- Response API selalu menggunakan format:
  ```json
  { "success": true, "data": {}, "message": "..." }
  { "success": false, "error": "...", "code": 400 }
  ```
- Validasi input menggunakan **Zod** sebelum menyentuh Prisma

### Git
- Commit message menggunakan format Conventional Commits:
  `feat(modul): deskripsi` / `fix(modul): deskripsi` / `chore: deskripsi`
- Tidak boleh push langsung ke `main` atau `develop`
- Setiap fitur dikerjakan di branch masing-masing:
  - Nafiza → `feature/produksi`
  - Regian → `feature/qc`
  - Redomas → `feature/logistik`
  - Tegar → `develop` (infrastruktur & integrasi)

---

## 8. ENVIRONMENT VARIABLES

Buat file `.env` di root `backend/` (jangan di-commit, sudah masuk `.gitignore`):

```env
# Database
DATABASE_URL="postgresql://simo:simo123@localhost:5432/simo_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="ganti_dengan_secret_yang_kuat_minimal_32_karakter"
JWT_REFRESH_SECRET="ganti_dengan_refresh_secret_yang_kuat"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET="simo-cv-mugi-jaya"

# Google Maps
GOOGLE_MAPS_API_KEY=""

# App
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

Buat file `.env` di root `frontend/`:
```env
VITE_API_URL="http://localhost:3000/api"
VITE_SOCKET_URL="http://localhost:3000"
```

---

## 9. CARA MENJALANKAN (DEVELOPMENT)

```bash
# 1. Start database & redis via Docker
docker-compose up -d postgres redis

# 2. Backend
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev          # berjalan di http://localhost:3000

# 3. Frontend
cd frontend
npm install
npm run dev          # berjalan di http://localhost:5173
```

---

## 10. FUNCTIONAL REQUIREMENTS (REFERENSI)

| Kode | Nama | Modul | PIC |
|------|------|-------|-----|
| FR-01 | Pencatatan Status Produksi | Produksi | Nafiza |
| FR-02 | Dashboard Monitoring Real-time | Produksi | Nafiza |
| FR-03 | Notifikasi Keterlambatan | Produksi | Nafiza |
| FR-04 | Checklist QC Digital | QC | Regian |
| FR-05 | Penerbitan QC Certificate | QC | Regian |
| FR-06 | Pencatatan Non-Conforming Item | QC | Regian |
| FR-07 | Manajemen Vendor (AVL) | Logistik | Redomas |
| FR-08 | Manifest Pengiriman Digital | Logistik | Redomas |
| FR-09 | Live Tracking Armada | Logistik | Redomas |
| FR-10 | Notifikasi Anomali Geofencing | Logistik | Redomas |
| FR-11 | Fallback Check-in Berkala | Logistik | Redomas |
| FR-12 | Repositori Spesifikasi & Blueprint | QC | Regian |
| FR-13 | Autentikasi & Manajemen Sesi | Shared | Tegar |

---

## 11. RENCANA SPRINT (8 SPRINT)

### Sprint 1 — Fondasi & Setup Proyek ← SPRINT AKTIF SAAT INI
**Goal:** Kerangka aplikasi fullstack siap jalan, semua developer bisa mulai coding di branch masing-masing.

**Task yang harus diselesaikan:**

**[Tegar — Infrastruktur]**
- [ ] Setup struktur monorepo (`frontend/`, `backend/`)
- [ ] Buat `docker-compose.yml` untuk PostgreSQL + Redis
- [ ] Setup Express.js + TypeScript di `backend/`
- [ ] Konfigurasi Prisma + koneksi PostgreSQL
- [ ] Buat file `.env.example` (tanpa nilai sensitif)
- [ ] Setup GitHub Actions CI (lint + build check) di `.github/workflows/ci.yml`
- [ ] Setup Git Flow: pastikan branch `develop`, `feature/produksi`, `feature/qc`, `feature/logistik` sudah ada

**[Tegar — Frontend Shared]**
- [ ] Restrukturisasi folder frontend sesuai struktur di bagian 5
- [ ] Setup React Router v6 dengan route guard berbasis role
- [ ] Buat `AuthContext` dan `useAuth` hook
- [ ] Buat `src/services/auth.service.ts` (login, logout, refresh token)
- [ ] Buat `src/types/index.ts` — definisi TypeScript untuk semua entitas

**[Tegar — Backend Auth]**
- [ ] Implementasi `POST /api/auth/login` — validasi kredensial, return JWT
- [ ] Implementasi `POST /api/auth/refresh` — refresh access token
- [ ] Implementasi `POST /api/auth/logout` — invalidate refresh token
- [ ] Buat `auth.middleware.ts` — verifikasi JWT di setiap request
- [ ] Buat `rbac.middleware.ts` — cek role sesuai tabel aktor

**[Nafiza — Data Layer Produksi]**
- [ ] Tulis Prisma schema untuk entitas `User`, `Role`, `Project`, `Warehouse`, `WorkItem`, `AuditLog`
- [ ] Jalankan `prisma migrate dev --name init`
- [ ] Buat `prisma/seed.ts` — data dummy: 5 user (1 per role), 2 project, 4 warehouse, 10 work item

**[Regian — Data Layer QC]**
- [ ] Tambahkan ke schema: `QCRecord`, `NCItem`, `QCCertificate`, `Specification`
- [ ] Tambahkan seed data: 2 specification, 5 qc record (mix PASSED/FAILED)

**[Redomas — Data Layer Logistik]**
- [ ] Tambahkan ke schema: `Vendor`, `Shipment`, `TrackingLog`
- [ ] Tambahkan seed data: 3 vendor, 2 shipment (1 DISPATCHED, 1 DELIVERED)

**[Daffa — Dokumentasi]**
- [ ] Finalisasi Product Backlog di GitHub Projects / Issues
- [ ] Review dan approve PR Sprint 1 sebelum merge ke develop

**Definition of Done Sprint 1:**
- `npm run dev` di frontend menampilkan halaman Login
- `npm run dev` di backend menjawab `GET /api/health` → `{ status: "ok" }`
- `POST /api/auth/login` dengan kredensial seed berhasil return JWT
- Semua migration berjalan tanpa error
- Database ter-seed dengan data dummy

---

### Sprint 2 — Autentikasi, RBAC & Halaman Login
**Goal:** Sistem login berfungsi end-to-end, setiap role melihat shell dashboard-nya masing-masing.

**Task utama:**
- [ ] Halaman Login frontend terhubung ke `POST /api/auth/login` — *Tegar*
- [ ] Simpan JWT di httpOnly cookie atau localStorage dengan refresh logic — *Tegar*
- [ ] Route guard: redirect ke Login jika belum autentikasi — *Tegar*
- [ ] Shell dashboard per role (navbar berbeda, menu berbeda) — *Tegar + Daffa*
- [ ] Halaman 403 Forbidden untuk akses tidak sah — *Tegar*
- [ ] Uji login semua 6 role dari seed data — *Daffa*

---

### Sprint 3 — Modul Produksi (Inti)
**Goal:** Mandor bisa input & update status pekerjaan; Kepala Produksi melihat dashboard real-time.

**Task utama (Nafiza):**
- [ ] `GET /api/produksi/warehouses` — list warehouse milik Mandor yang login
- [ ] `GET /api/produksi/work-items?warehouseId=` — list work item per warehouse
- [ ] `PATCH /api/produksi/work-items/:id/status` — update status + foto (FR-01)
- [ ] `GET /api/produksi/dashboard` — agregasi progres per project & warehouse (FR-02)
- [ ] WebSocket event: emit `work_item_updated` ke dashboard saat status berubah
- [ ] Frontend `ProduksiPage.tsx` — form input status (mobile-first, FR-01)
- [ ] Frontend `DashboardPage.tsx` — terima WebSocket, update persentase real-time (FR-02)
- [ ] AuditLog otomatis setiap update status

---

### Sprint 4 — Modul Quality Control (Inti)
**Goal:** QC Gate-Out berjalan; certificate jadi syarat pengiriman.

**Task utama (Regian):**
- [ ] `POST /api/qc/records` — buat QC Record + upload foto (FR-04)
- [ ] `PATCH /api/qc/records/:id` — update hasil inspeksi (dimensi, status)
- [ ] `POST /api/qc/certificates` — terbitkan certificate jika semua item batch PASSED (FR-05)
- [ ] `POST /api/qc/nc-items` — catat Non-Conforming Item (FR-06)
- [ ] `GET/POST /api/qc/specifications` — repositori spesifikasi + upload file (FR-12)
- [ ] Frontend `QCPage.tsx` — form checklist + validasi toleransi
- [ ] Frontend `RepositoriPage.tsx` — daftar & download spesifikasi

---

### Sprint 5 — Modul Logistik (Inti)
**Goal:** Vendor terkelola, manifest digital terbit, armada bisa dilacak.

**Task utama (Redomas):**
- [ ] `GET/POST/PATCH /api/logistik/vendors` — manajemen AVL (FR-07)
- [ ] `POST /api/logistik/shipments` — buat manifest (wajib ada QC Certificate) (FR-08)
- [ ] `POST /api/logistik/tracking` — terima koordinat GPS, simpan TrackingLog (FR-09)
- [ ] Logika geofencing — deteksi anomali rute, trigger notifikasi (FR-10)
- [ ] `POST /api/logistik/checkin` — fallback check-in manual (FR-11)
- [ ] Frontend `LogistikPage.tsx` — peta tracking + daftar pengiriman aktif
- [ ] Frontend `SuratJalanModal.tsx` — preview & cetak manifest

---

### Sprint 6 — Integrasi Antar Modul & Notifikasi
**Goal:** Tiga modul tersambung menjadi satu alur bisnis utuh.

**Task utama:**
- [ ] Validasi: Shipment tidak bisa dibuat jika QC Certificate belum ada — *Redomas + Regian*
- [ ] Notifikasi WhatsApp/FCM: keterlambatan update produksi (FR-03) — *Nafiza*
- [ ] Notifikasi anomali geofencing real-time ke Admin (FR-10) — *Redomas*
- [ ] `AuditTrailPage.tsx` — tampilkan log aktivitas lintas modul — *Regian*
- [ ] Merge semua feature branch ke develop, resolve konflik — *Tegar*
- [ ] Integration test: alur lengkap Produksi → QC → Logistik — *Daffa*

---

### Sprint 7 — Testing, Offline-Sync & Penyempurnaan
**Goal:** Sistem stabil di kondisi sinyal rendah, bebas bug kritis.

**Task utama:**
- [ ] Offline-sync queue di frontend — input tersimpan lokal, auto-sync saat online (NFR-05) — *Nafiza*
- [ ] Unit test controller & service tiap modul — *masing-masing developer*
- [ ] Integration test API end-to-end — *Tegar*
- [ ] User Acceptance Testing internal — skenario per role — *Daffa*
- [ ] Optimasi: pastikan dashboard update <30 detik (NFR-01) — *Tegar*
- [ ] Perbaikan bug temuan UAT — *semua developer*

---

### Sprint 8 — Deployment & Persiapan UAS
**Goal:** Aplikasi ter-deploy dan siap dipresentasikan di UAS.

**Task utama:**
- [ ] Buat `Dockerfile` untuk frontend dan backend — *Tegar*
- [ ] Update `docker-compose.yml` untuk production — *Tegar*
- [ ] Setup GitHub Actions CD: auto-deploy ke EC2 saat merge ke main — *Tegar*
- [ ] Deploy ke server, pastikan HTTPS aktif — *Tegar*
- [ ] Smoke test di environment production — *Daffa*
- [ ] Finalisasi laporan & dokumentasi API — *Daffa*
- [ ] Persiapan demo UAS: script demo alur Produksi → QC → Logistik — *seluruh tim*

---

## 12. PERINTAH YANG SERING DIPAKAI

```bash
# Backend
npx prisma migrate dev --name <nama_migration>
npx prisma db seed
npx prisma studio                    # GUI database di browser
npm run dev                          # nodemon + ts-node

# Frontend
npm run dev
npm run build
npm run lint

# Docker
docker-compose up -d                 # start semua service
docker-compose down                  # stop semua service
docker-compose logs -f postgres      # lihat log database

# Git (contoh workflow Nafiza di feature/produksi)
git checkout feature/produksi
git pull origin develop              # sync dengan develop terbaru
git add .
git commit -m "feat(produksi): implement work item status update API"
git push origin feature/produksi
# → buat Pull Request ke develop di GitHub
```

---

## 13. CATATAN PENTING

- **Nama klien:** Selalu tulis **"CV Mugi Jaya"** — bukan "Multi Jaya", "MugiJaya", atau variasi lain
- **Bahasa antarmuka:** Semua teks yang dilihat user dalam **bahasa Indonesia**
- **Mobile-first:** Halaman untuk Mandor (`ProduksiPage`) harus nyaman di layar 360px
- **Foto upload:** Semua foto (QC, status produksi) dikirim ke backend sebagai `multipart/form-data`, disimpan ke S3, hanya URL yang disimpan di database
- **Jangan sentuh** file di `src/app/components/ui/` — komponen shadcn/ui sudah dikonfigurasi
- **Password default seed:** Semua user seed menggunakan password `Simo@2026` (sudah di-hash di seed.ts)
