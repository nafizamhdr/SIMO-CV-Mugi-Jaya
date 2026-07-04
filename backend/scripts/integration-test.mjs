/**
 * Integration test — alur bisnis lintas modul (Sprint 6, PIC: Daffa).
 * Menguji rantai: Produksi (status) -> QC (inspeksi + certificate) -> Logistik (shipment).
 *
 * Prasyarat: backend berjalan di http://localhost:3000 & database ter-seed.
 * Jalankan: node scripts/integration-test.mjs
 */
const BASE = process.env.API_URL ?? "http://localhost:3000/api";
let pass = 0;
let fail = 0;
const ok = (m) => {
  console.log(`  ✅ ${m}`);
  pass++;
};
const no = (m) => {
  console.log(`  ❌ ${m}`);
  fail++;
};

async function login(email) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Simo@2026" }),
  });
  const j = await r.json();
  return j.data?.accessToken;
}

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const jsonAuth = (t) => ({ "Content-Type": "application/json", ...auth(t) });

async function main() {
  console.log("=== Integration Test: Produksi -> QC -> Logistik ===");

  const mandor = await login("asep@mugijaya.co.id");
  const inspector = await login("qc@mugijaya.co.id");
  const admin = await login("admin@mugijaya.co.id");
  if (mandor && inspector && admin) ok("login 3 aktor (Mandor, Inspector, Admin)");
  else return no("login gagal — pastikan backend & DB jalan");

  // 1) PRODUKSI: Mandor menandai pekerjaan selesai
  const wiId = "wi-06";
  const upd = await fetch(`${BASE}/produksi/work-items/${wiId}/status`, {
    method: "PATCH",
    headers: jsonAuth(mandor),
    body: JSON.stringify({ status: "DONE" }),
  });
  (await upd.json()).data?.status === "DONE" ? ok("Produksi: work item -> DONE") : no("Produksi: update status");

  // 2) QC: Inspector inspeksi (dalam toleransi -> PASSED)
  const recForm = new FormData();
  recForm.append("workItemId", wiId);
  recForm.append("specificationId", "spec-01");
  recForm.append("dimensions", JSON.stringify({
    actual: { p: 240, l: 120, t: 12 },
    tolerance: { p: [239, 241], l: [119, 121], t: [11, 13] },
  }));
  const rec = await fetch(`${BASE}/qc/records`, { method: "POST", headers: auth(inspector), body: recForm });
  const recJson = await rec.json();
  recJson.data?.status === "PASSED" ? ok("QC: inspeksi -> PASSED (dalam toleransi)") : no("QC: create record");

  // 3) QC: terbitkan certificate untuk batch yang lolos
  const cert = await fetch(`${BASE}/qc/certificates`, {
    method: "POST",
    headers: jsonAuth(inspector),
    body: JSON.stringify({ projectId: "prj-ikn", batchIds: [wiId] }),
  });
  const certJson = await cert.json();
  const certId = certJson.data?.id;
  certId ? ok(`QC: certificate terbit (${certJson.data.certNumber})`) : no("QC: issue certificate");

  // 4) LOGISTIK: shipment WAJIB pakai certificate tsb
  const ship = await fetch(`${BASE}/logistik/shipments`, {
    method: "POST",
    headers: jsonAuth(admin),
    body: JSON.stringify({
      projectId: "prj-ikn",
      vendorId: "ven-01",
      qcCertificateId: certId,
      driverName: "Integration Driver",
      vehicleNo: "B 7777 IT",
      insurancePolis: "POL-IT-001",
      destination: "Kawasan IKN, Penajam Paser Utara",
      destLat: -1.05,
      destLng: 116.7,
    }),
  });
  const shipJson = await ship.json();
  shipJson.data?.status === "DISPATCHED" ? ok("Logistik: shipment terbit dari QC certificate") : no("Logistik: create shipment");

  // 5) INTEGRASI: certificate yang sama tidak bisa dipakai dua kali
  const dup = await fetch(`${BASE}/logistik/shipments`, {
    method: "POST",
    headers: jsonAuth(admin),
    body: JSON.stringify({
      projectId: "prj-ikn", vendorId: "ven-01", qcCertificateId: certId,
      driverName: "X", vehicleNo: "B1", insurancePolis: "P1", destination: "IKN",
    }),
  });
  dup.status === 400 ? ok("Integrasi: certificate tidak bisa dipakai 2x (400)") : no(`dup cert (${dup.status})`);

  // 6) AUDIT: jejak lintas modul tercatat
  const kaprod = await login("yudi@mugijaya.co.id");
  const audit = await (await fetch(`${BASE}/audit`, { headers: auth(kaprod) })).json();
  const cats = new Set((audit.data ?? []).map((a) => a.category));
  cats.has("Produksi") && cats.has("QC") && cats.has("Logistik")
    ? ok("Audit: jejak Produksi + QC + Logistik tercatat")
    : no("Audit: jejak lintas modul");

  console.log(`\n=== HASIL: ${pass} lulus, ${fail} gagal ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Integration test error:", e.message);
  process.exit(1);
});
