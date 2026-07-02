# SIMO — Dokumentasi API

Base URL (dev): `http://localhost:3000/api` · Produksi: `https://<backend>.onrender.com/api`

Semua response memakai format baku:

```json
{ "success": true,  "data": {...}, "message": "..." }
{ "success": false, "error": "...", "code": 400 }
```

**Autentikasi:** kirim header `Authorization: Bearer <accessToken>` pada semua endpoint (kecuali `/auth/*` dan `/health`). Akses role yang tidak diizinkan → **403 Forbidden**.

Password seluruh akun seed (development): `Simo@2026`.

---

## Health

| Method | Path | Role | Keterangan |
|---|---|---|---|
| GET | `/health` | publik | `{ "status": "ok" }` |

## Auth (FR-13)

| Method | Path | Body | Keterangan |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | Return `accessToken` (1 jam), `refreshToken` (7 hari), `user` |
| POST | `/auth/refresh` | `{ refreshToken }` | Token pair baru |
| POST | `/auth/logout` | `{ refreshToken }` | Invalidasi refresh token |

## Modul Produksi (PIC: Nafiza)

| Method | Path | Role | FR | Keterangan |
|---|---|---|---|---|
| GET | `/produksi/warehouses` | MANDOR, KEPALA_PRODUKSI, OWNER | FR-01 | Mandor hanya melihat warehouse miliknya |
| GET | `/produksi/work-items?warehouseId=` | MANDOR, KEPALA_PRODUKSI, OWNER | FR-01 | Daftar pekerjaan per warehouse |
| PATCH | `/produksi/work-items/:id/status` | MANDOR, KEPALA_PRODUKSI | FR-01 | multipart: `status` (TODO/IN_PROGRESS/DONE), `photo` (opsional). AuditLog otomatis + emit socket `work_item_updated` |
| GET | `/produksi/dashboard` | OWNER, KEPALA_PRODUKSI | FR-02 | Agregasi progres per project & warehouse |
| GET | `/produksi/notifications?thresholdHours=48` | OWNER, KEPALA_PRODUKSI | FR-03 | Pekerjaan terlambat (belum DONE melewati ambang) |

## Modul QC (PIC: Regian)

| Method | Path | Role | FR | Keterangan |
|---|---|---|---|---|
| GET | `/qc/projects` | INSPECTOR_QC | — | Daftar project (pemilihan batch) |
| GET | `/qc/work-items?projectId=` | INSPECTOR_QC | FR-04 | Item + status QC terkini |
| GET | `/qc/records` | INSPECTOR_QC | FR-04 | Seluruh QC record |
| POST | `/qc/records` | INSPECTOR_QC | FR-04 | multipart: `workItemId`, `specificationId`, `dimensions` (JSON string), `photo` opsional. Status PASSED/FAILED otomatis dari toleransi |
| PATCH | `/qc/records/:id` | INSPECTOR_QC | FR-04 | Update hasil inspeksi |
| POST | `/qc/nc-items` | INSPECTOR_QC | FR-06 | `{ qcRecordId, defectDesc, picRework, estimatedDone }` — hanya untuk record FAILED |
| GET | `/qc/certificates` | INSPECTOR_QC | FR-05 | Daftar certificate |
| POST | `/qc/certificates` | INSPECTOR_QC | FR-05 | `{ projectId, batchIds[] }` — terbit hanya bila SEMUA item PASSED (else 400) |
| GET | `/qc/specifications?projectId=` | INSPECTOR_QC, SUPERVISOR_LAPANGAN, KEPALA_PRODUKSI | FR-12 | Repositori spesifikasi |
| POST | `/qc/specifications` | INSPECTOR_QC, KEPALA_PRODUKSI | FR-12 | multipart: `projectId`, `title`, `version`, `file` (PDF/gambar) |

## Modul Logistik (PIC: Redomas)

| Method | Path | Role | FR | Keterangan |
|---|---|---|---|---|
| GET | `/logistik/vendors` | ADMIN_OPERASIONAL, OWNER | FR-07 | Daftar vendor (AVL) |
| POST | `/logistik/vendors` | ADMIN_OPERASIONAL | FR-07 | `{ name, contact, licenseNo, rating?, isApproved? }` |
| PATCH | `/logistik/vendors/:id` | ADMIN_OPERASIONAL | FR-07 | Update vendor |
| GET | `/logistik/shipments` | ADMIN_OPERASIONAL, OWNER | FR-08 | Daftar pengiriman + posisi terakhir |
| GET | `/logistik/certificates/available` | ADMIN_OPERASIONAL | FR-08 | QC Certificate yang belum dipakai |
| POST | `/logistik/shipments` | ADMIN_OPERASIONAL | FR-08 | **Wajib** `qcCertificateId` valid & belum dipakai; vendor harus approved. Emit socket `shipment_created` |
| PATCH | `/logistik/shipments/:id/deliver` | ADMIN_OPERASIONAL | FR-08 | Tandai DELIVERED |
| POST | `/logistik/tracking` | ADMIN_OPERASIONAL | FR-09/10 | `{ shipmentId, lat, lng, speed? }` — keluar koridor rute → status ANOMALY + emit socket `geofence_anomaly` |
| POST | `/logistik/checkin` | ADMIN_OPERASIONAL | FR-11 | `{ shipmentId, lat?, lng?, note? }` — fallback tanpa GPS |

## Manajemen Akun (khusus OWNER)

| Method | Path | Keterangan |
|---|---|---|
| GET | `/users` | Daftar seluruh akun (tanpa password) |
| POST | `/users` | `{ name, email, password (min 8), role }` — buat akun baru (bcrypt 12) |
| PATCH | `/users/:id` | `{ name?, role?, isActive? }` — edit / aktif-nonaktifkan. Proteksi: tidak bisa menonaktifkan diri sendiri atau OWNER aktif terakhir |
| PATCH | `/users/:id/password` | `{ password }` — reset kata sandi |

Akun `isActive=false` ditolak saat login & refresh (403). Semua perubahan tercatat di AuditLog (`CREATE_USER`, `UPDATE_USER`, `RESET_USER_PASSWORD`).

## Audit Trail

| Method | Path | Role | Keterangan |
|---|---|---|---|
| GET | `/audit?category=&date=` | OWNER, KEPALA_PRODUKSI | Log lintas modul (Produksi/QC/Logistik/Akses), filter kategori & tanggal |

## Event Socket.io (real-time)

| Event | Pemicu | Konsumen |
|---|---|---|
| `work_item_updated` | PATCH status produksi | Dashboard (FR-02) |
| `shipment_created` | POST shipment | Logistik |
| `tracking_update` | POST tracking | Peta logistik |
| `geofence_anomaly` | Tracking keluar rute | Toast Admin/Owner (FR-10) |

## Pengujian

```bash
cd backend
npm test               # 20 unit test (Vitest)
npm run test:integration  # alur Produksi -> QC -> Logistik
npm run test:uat          # RBAC 6 role
```
