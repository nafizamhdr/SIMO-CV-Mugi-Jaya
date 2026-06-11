# Laporan Progress SIMO — Board Taiga (Sprint 2)

**Proyek:** SIMO — Sistem Informasi Monitoring Operasional · CV Mugi Jaya
**Kelompok:** Maju Lancar — S1 Informatika AMIKOM Yogyakarta
**Sprint 2 — Autentikasi, RBAC & Halaman Login** · **Selesai ✅**
**Goal:** Sistem login berfungsi end-to-end, setiap role melihat shell dashboard-nya masing-masing.

> Catatan paste ke Taiga: tiap **US-xx** = satu User Story (status **Done**), butir checklist = Task. **Pts** = story points (estimasi). Hash di akhir = commit bukti pengerjaan.

---

## Ringkasan Kontribusi (Sprint 2)

| Anggota | Role | User Story | Poin |
|---------|------|-----------|------|
| Muhammad Tegar Revolusi Seto | Scrum Master | 4 | 16 |
| Ahmad Daffa | Product Owner | 1 | 2 |
| **Total** | | **5** | **18** |

> Nafiza, Regian, dan Redomas **tidak memiliki tugas di Sprint 2** — pengerjaan modul mereka (Produksi/QC/Logistik inti) dijadwalkan mulai Sprint 3–5.

---

## 👤 Muhammad Tegar Revolusi Seto — Scrum Master

### US-S2-01 — Login frontend terhubung backend (FR-13) `Done` · `Pts: 5`
- [x] Form Login email + kata sandi (tanpa OTP demo lama)
- [x] Panggil `POST /api/auth/login` via service Axios
- [x] Simpan access & refresh token di `localStorage`
- [x] Tampilkan pesan error & status loading saat proses
- [x] Tombol Quick Login akun seed (development)
- 🔗 commit `19268f1`

### US-S2-02 — Manajemen sesi & route guard `Done` · `Pts: 5`
- [x] `AuthProvider` memulihkan sesi dari `localStorage` saat reload
- [x] Integrasi React Router (`BrowserRouter`, `Routes`)
- [x] Route guard: redirect ke `/login` bila belum terautentikasi
- [x] Logika refresh token di service auth
- [x] Logout membersihkan sesi & kembali ke `/login`
- 🔗 commit `19268f1`

### US-S2-03 — Shell dashboard per role `Done` · `Pts: 4` _(kolaborasi dengan Daffa)_
- [x] Pemetaan `Role` → menu di `roleConfig` (sesuai RBAC CLAUDE.md)
- [x] Sidebar `Layout` menampilkan menu sesuai role yang login
- [x] Halaman default berbeda tiap role (mis. Mandor → Input Produksi, Admin → Logistik)
- [x] Topbar menampilkan nama, inisial, & deskripsi role
- 🔗 commit `19268f1`

### US-S2-04 — Halaman 403 Forbidden `Done` · `Pts: 2`
- [x] Komponen `ForbiddenPage` (UI 403)
- [x] Guard mengarahkan ke `/403` bila role tidak diizinkan (BUKAN redirect login)
- [x] Tombol "Kembali ke Beranda" sesuai halaman default role
- 🔗 commit `19268f1`

---

## 👤 Ahmad Daffa — Product Owner

### US-S2-05 — UAT login & RBAC 6 role `Done` · `Pts: 2`
- [x] Definisi pemetaan menu tiap aktor (kolaborasi shell per role, US-S2-03)
- [x] Skenario uji login 6 role + ekspektasi halaman default & menu
- [x] Skenario uji guard 403 & kredensial salah
- [x] Dokumen `docs/SPRINT2-UAT.md`
- 🔗 commit `a781cfb`

---

## Definition of Done Sprint 2 — Terverifikasi

- [x] Halaman Login terhubung ke `POST /api/auth/login`
- [x] JWT tersimpan (localStorage) + logika refresh
- [x] Route guard redirect ke Login bila belum autentikasi
- [x] Shell dashboard berbeda per role (menu & halaman default)
- [x] Halaman 403 Forbidden untuk akses tidak sah
- [x] Login 6 role dari data seed teruji (semua return JWT; kredensial salah → 401)
