# Sprint 2 — Checklist UAT Autentikasi & RBAC

Pengujian login end-to-end untuk seluruh role (data seed). Prasyarat: backend + PostgreSQL berjalan dan database sudah di-seed (`npx prisma migrate dev && npx prisma db seed`).

Semua akun memakai password **`Simo@2026`**.

## Skenario per Role

| # | Email | Role | Halaman default | Menu yang muncul | 403 saat akses |
|---|-------|------|-----------------|------------------|----------------|
| 1 | owner@mugijaya.co.id | OWNER | Dashboard | Dashboard, Audit Trail | /produksi, /qc, /logistik, /repositori |
| 2 | yudi@mugijaya.co.id | KEPALA_PRODUKSI | Dashboard | Dashboard, Input Produksi, Audit Trail | /qc, /logistik, /repositori |
| 3 | asep@mugijaya.co.id | MANDOR | Input Produksi | Input Produksi | /dashboard, /qc, /logistik, /repositori, /audit |
| 4 | qc@mugijaya.co.id | INSPECTOR_QC | Quality Control | Quality Control, Repositori | /dashboard, /produksi, /logistik, /audit |
| 5 | edi@mugijaya.co.id | SUPERVISOR_LAPANGAN | Repositori | Repositori | /dashboard, /produksi, /qc, /logistik, /audit |
| 6 | admin@mugijaya.co.id | ADMIN_OPERASIONAL | Logistik | Logistik & Tracking | /dashboard, /produksi, /qc, /repositori, /audit |

## Langkah Uji (tiap role)

1. Buka `/login`, klik tombol Quick Login role terkait (atau isi email + `Simo@2026`).
2. **Verifikasi:** diarahkan ke halaman default sesuai tabel, sidebar hanya menampilkan menu yang diizinkan.
3. **Uji guard:** ketik manual URL modul yang tidak diizinkan → harus muncul halaman **403 Forbidden**, bukan redirect ke login.
4. **Uji sesi:** refresh halaman → tetap login (token tersimpan di localStorage).
5. **Logout:** klik "Keluar" → kembali ke `/login`, akses URL terproteksi → redirect ke `/login`.

## Uji Kredensial Salah

- Email/password salah → pesan error "Email atau kata sandi salah", tetap di halaman login.
- Field kosong → pesan validasi, tidak mengirim request.

> Catatan: bila PostgreSQL belum aktif, endpoint login mengembalikan error 500 (koneksi DB) — jalankan `docker-compose up -d postgres redis` lebih dulu.
