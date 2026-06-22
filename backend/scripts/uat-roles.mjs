/**
 * UAT otomatis per role (Sprint 7, PIC: Daffa).
 * Memverifikasi setiap aktor hanya bisa mengakses modul yang diizinkan (RBAC),
 * dan menerima 403 untuk modul terlarang.
 *
 * Prasyarat: backend berjalan & DB ter-seed. Jalankan: node scripts/uat-roles.mjs
 */
const BASE = process.env.API_URL ?? "http://localhost:3000/api";
let pass = 0, fail = 0;
const ok = (m) => { console.log(`  ✅ ${m}`); pass++; };
const no = (m) => { console.log(`  ❌ ${m}`); fail++; };

async function login(email) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Simo@2026" }),
  });
  return (await r.json()).data?.accessToken;
}

async function status(token, path) {
  const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.status;
}

// path uji per modul (GET) + ekspektasi: allow (200) / deny (403)
const CASES = [
  { email: "owner@mugijaya.co.id", role: "OWNER", allow: ["/produksi/dashboard", "/audit", "/logistik/vendors"], deny: [] },
  { email: "yudi@mugijaya.co.id", role: "KEPALA_PRODUKSI", allow: ["/produksi/dashboard", "/audit"], deny: ["/qc/records"] },
  { email: "asep@mugijaya.co.id", role: "MANDOR", allow: ["/produksi/warehouses"], deny: ["/produksi/dashboard", "/qc/records", "/logistik/vendors", "/audit"] },
  { email: "qc@mugijaya.co.id", role: "INSPECTOR_QC", allow: ["/qc/records", "/qc/specifications"], deny: ["/produksi/dashboard", "/logistik/vendors", "/audit"] },
  { email: "edi@mugijaya.co.id", role: "SUPERVISOR_LAPANGAN", allow: ["/qc/specifications"], deny: ["/qc/records", "/produksi/dashboard", "/audit"] },
  { email: "admin@mugijaya.co.id", role: "ADMIN_OPERASIONAL", allow: ["/logistik/vendors", "/logistik/shipments"], deny: ["/produksi/dashboard", "/qc/records", "/audit"] },
];

async function main() {
  console.log("=== UAT per Role (RBAC) ===");
  for (const c of CASES) {
    const token = await login(c.email);
    if (!token) { no(`${c.role}: login gagal`); continue; }
    let okRole = true;
    for (const p of c.allow) {
      const s = await status(token, p);
      if (s === 403 || s === 401) { okRole = false; console.log(`     - ${c.role} seharusnya BISA ${p} tapi dapat ${s}`); }
    }
    for (const p of c.deny) {
      const s = await status(token, p);
      if (s !== 403) { okRole = false; console.log(`     - ${c.role} seharusnya DITOLAK ${p} tapi dapat ${s}`); }
    }
    okRole ? ok(`${c.role}: akses sesuai RBAC (${c.allow.length} izin, ${c.deny.length} tolak)`) : no(`${c.role}: pelanggaran RBAC`);
  }
  // Kredensial salah -> 401
  const r = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "owner@mugijaya.co.id", password: "salah" }) });
  r.status === 401 ? ok("Login kredensial salah -> 401") : no(`kredensial salah (${r.status})`);

  console.log(`\n=== HASIL UAT: ${pass} lulus, ${fail} gagal ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("UAT error:", e.message); process.exit(1); });
