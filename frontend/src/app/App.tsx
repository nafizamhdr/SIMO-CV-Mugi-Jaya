import { useState, type ReactNode } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { LoginPage } from "./components/LoginPage";
import { Layout } from "./components/Layout";
import { ForbiddenPage } from "./components/ForbiddenPage";
import { DashboardPage } from "./components/DashboardPage";
import { ProduksiPage } from "./components/ProduksiPage";
import { QCPage } from "./components/QCPage";
import { LogistikPage } from "./components/LogistikPage";
import { RepositoriPage } from "./components/RepositoriPage";
import { AuditTrailPage } from "./components/AuditTrailPage";
import { SuratJalanModal } from "./components/SuratJalanModal";
import { PreviewDocModal } from "./components/PreviewDocModal";
import {
  initQCBatches,
  initShipments,
  initDocuments,
  initAuditTrail,
  type PageKey,
  type Shipment,
  type AuditEntry,
} from "./components/data";
import { useAuth } from "../hooks/useAuth";
import {
  ROLE_CONFIG,
  PAGE_PATH,
  PAGE_ALLOW,
  menusFor,
  defaultPageFor,
} from "./roleConfig";

let shipCounter = 78;
let certCounter = 91;

export default function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(true);
  const [qcBatches, setQcBatches] = useState(initQCBatches());
  const [shipments, setShipments] = useState(initShipments());
  const [documents, setDocuments] = useState(initDocuments());
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>(initAuditTrail());

  const [suratJalanId, setSuratJalanId] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<{ docId: string; ver: string } | null>(null);

  const homePath = user ? PAGE_PATH[defaultPageFor(user.role)] : "/login";

  function addAudit(aksi: string, entitas: string, sebelum = "—", sesudah = "—") {
    const now = new Date();
    const waktu =
      now.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) +
      ", " +
      now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setAuditTrail((prev) => [
      {
        waktu,
        tgl: now.toISOString().slice(0, 10),
        user: user?.name || "Sistem",
        aksi,
        entitas,
        sebelum,
        sesudah,
      },
      ...prev,
    ]);
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  function handleToggleConnection() {
    setIsOnline((prev) => {
      const next = !prev;
      toast(next ? "Koneksi online dipulihkan" : "Mode offline diaktifkan", {
        icon: next ? "✅" : "⚠️",
      });
      return next;
    });
  }

  // QC
  function handleQCUpdate(batchIdx: number, itemIdx: number, result: "Pass" | "Fail") {
    setQcBatches((prev) => {
      const updated = prev.map((b, bi) => {
        if (bi !== batchIdx) return b;
        const items = b.items.map((it, ii) => (ii === itemIdx ? { ...it, hasil: result } : it));
        return { ...b, items };
      });
      const b = updated[batchIdx];
      addAudit("QC", `${b.id} / ${b.items[itemIdx].nama}`, "Pending", result === "Pass" ? "PASS" : "FAIL (NCI)");
      return updated;
    });
    toast[result === "Pass" ? "success" : "error"](
      result === "Pass" ? "Item lolos QC" : "Di luar toleransi — dicatat sebagai NCI",
    );
  }

  function handleIssueCert(batchIdx: number) {
    const cert = `QC-CERT-2026-${String(++certCounter).padStart(4, "0")}`;
    setQcBatches((prev) => prev.map((b, i) => (i === batchIdx ? { ...b, certificate: cert } : b)));
    const b = qcBatches[batchIdx];
    addAudit("QC", `Certificate ${b.id}`, "Belum terbit", cert);
    toast.success(`QC Certificate ${cert} terbit — batch siap kirim`);
  }

  // Logistik
  function handleDispatch(data: Omit<Shipment, "id">) {
    const id = `SHIP-2026-${String(++shipCounter).padStart(4, "0")}`;
    const newShipment: Shipment = {
      ...data,
      id,
      suratJalan: `SJ-2026-${String(shipCounter).padStart(4, "0")}`,
    };
    setShipments((prev) => [newShipment, ...prev]);
    addAudit("Logistik", `${id} (${data.vendor})`, "Draft", "Dispatched");
    toast.success(`${id} diberangkatkan — Surat Jalan & tracking aktif`);
  }

  function handleSimulateAnomaly() {
    const target = shipments.find((s) => s.status === "Normal");
    if (!target) {
      toast.info("Tidak ada pengiriman normal untuk disimulasikan");
      return;
    }
    toast.warning(`Memantau ${target.id} — terdeteksi berhenti di luar rute...`);
    setTimeout(() => {
      setShipments((prev) => prev.map((s) => (s.id === target.id ? { ...s, status: "Anomali" } : s)));
      addAudit("Logistik", `${target.id} berhenti di luar jadwal > 2 jam`, "Normal", "ANOMALI (keluar rute)");
      toast.error(`⚠ ${target.id} keluar rute > 2 jam! Notifikasi anomali terkirim ke Admin`);
    }, 2000);
  }

  // Repositori
  const canUpload = user?.role === "INSPECTOR_QC" || user?.role === "KEPALA_PRODUKSI";

  function handleUploadVersion() {
    if (!canUpload) {
      toast.error("Hanya Kepala Produksi / Inspector yang dapat mengunggah versi baru");
      return;
    }
    setDocuments((prev) => {
      const updated = [...prev];
      const d = { ...updated[0], versions: [...updated[0].versions] };
      const newV = `v${d.versions.length + 1}`;
      d.versions.push({
        v: newV,
        tanggal: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        oleh: user!.name,
        catatan: "Versi baru diunggah via sistem",
      });
      updated[0] = d;
      addAudit("QC", `Dokumen ${d.id} (${d.material})`, `v${d.versions.length - 1}`, newV);
      toast.success(`Versi ${newV} berhasil diunggah untuk ${d.material}`);
      return updated;
    });
  }

  function handleDownloadDoc(docId: string, ver: string) {
    const d = documents.find((x) => x.id === docId)!;
    toast.success(`Mengunduh ${d.material} ${ver} (${d.kode})...`);
    setPreviewState(null);
  }

  // Route guard: cek auth -> role -> render dalam shell Layout.
  function guard(page: PageKey, content: ReactNode) {
    if (isLoading) return null;
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    if (!PAGE_ALLOW[page].includes(user.role)) return <Navigate to="/403" replace />;
    return (
      <Layout
        userName={user.name}
        userShort={ROLE_CONFIG[user.role].short}
        userDesc={ROLE_CONFIG[user.role].desc}
        menus={menusFor(user.role)}
        activePage={page}
        onNavigate={(p) => navigate(PAGE_PATH[p])}
        onLogout={handleLogout}
        isOnline={isOnline}
        onToggleConnection={handleToggleConnection}
      >
        {content}
      </Layout>
    );
  }

  const suratJalan = suratJalanId ? shipments.find((s) => s.id === suratJalanId) : null;
  const previewDoc = previewState ? documents.find((d) => d.id === previewState.docId) : null;

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={homePath} replace /> : <LoginPage />}
        />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route path="/dashboard" element={guard("dashboard", <DashboardPage />)} />
        <Route path="/produksi" element={guard("produksi", <ProduksiPage />)} />
        <Route path="/qc" element={guard("qc", <QCPage />)} />
        <Route
          path="/logistik"
          element={guard(
            "logistik",
            <LogistikPage
              shipments={shipments}
              qcBatches={qcBatches}
              onDispatch={handleDispatch}
              onSimulateAnomaly={handleSimulateAnomaly}
              onViewSuratJalan={(id) => setSuratJalanId(id)}
            />,
          )}
        />
        <Route path="/repositori" element={guard("repositori", <RepositoriPage canUpload={canUpload} />)} />
        <Route path="/audit" element={guard("audit", <AuditTrailPage auditTrail={auditTrail} />)} />

        <Route path="*" element={<Navigate to={isAuthenticated ? homePath : "/login"} replace />} />
      </Routes>

      {suratJalan && <SuratJalanModal shipment={suratJalan} onClose={() => setSuratJalanId(null)} />}
      {previewDoc && previewState && (
        <PreviewDocModal
          doc={previewDoc}
          version={previewState.ver}
          onClose={() => setPreviewState(null)}
          onDownload={() => handleDownloadDoc(previewDoc.id, previewState.ver)}
        />
      )}

      <Toaster position="top-right" richColors />
    </>
  );
}
