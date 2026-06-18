import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Award, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import type { QCStatus } from "../../types";
import {
  getProjects,
  getInspectionItems,
  getSpecifications,
  getCertificates,
  createRecord,
  createNCItem,
  issueCertificate,
  type ProjectDto,
  type InspectionItemDto,
  type SpecificationDto,
  type CertificateDto,
} from "../../services/qc.service";

const DEFAULT_TOL = { p: "239-241", l: "119-121", t: "11-13" };
const parseRange = (s: string): [number, number] => {
  const [a, b] = s.split("-").map((x) => parseFloat(x.trim()));
  return [a, b];
};

function statusIcon(s: QCStatus | null) {
  if (s === "PASSED") return <CheckCircle2 size={16} className="text-green-600" />;
  if (s === "FAILED") return <XCircle size={16} className="text-red-600" />;
  return <Clock size={16} className="text-gray-400" />;
}
const statusText = (s: QCStatus | null) => (s === "PASSED" ? "LOLOS" : s === "FAILED" ? "GAGAL" : "BELUM");

export function QCPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [projectId, setProjectId] = useState("");
  const [items, setItems] = useState<InspectionItemDto[]>([]);
  const [specs, setSpecs] = useState<SpecificationDto[]>([]);
  const [certs, setCerts] = useState<CertificateDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [inspect, setInspect] = useState<InspectionItemDto | null>(null);
  const [specId, setSpecId] = useState("");
  const [actual, setActual] = useState({ p: "", l: "", t: "" });
  const [tol, setTol] = useState(DEFAULT_TOL);
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const [ncFor, setNcFor] = useState<string | null>(null);
  const [nc, setNc] = useState({ defectDesc: "", picRework: "", estimatedDone: "" });

  useEffect(() => {
    (async () => {
      try {
        const p = await getProjects();
        setProjects(p);
        if (p.length) setProjectId(p[0].id);
      } catch {
        toast.error("Gagal memuat proyek");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadProject(pid: string) {
    if (!pid) return;
    try {
      const [it, sp, ct] = await Promise.all([getInspectionItems(pid), getSpecifications(pid), getCertificates()]);
      setItems(it);
      setSpecs(sp);
      setCerts(ct.filter((c) => c.projectId === pid));
      if (sp.length) setSpecId((prev) => prev || sp[0].id);
    } catch {
      toast.error("Gagal memuat data QC");
    }
  }
  useEffect(() => {
    void loadProject(projectId);
  }, [projectId]);

  function openInspect(item: InspectionItemDto) {
    setInspect(item);
    setActual({ p: "", l: "", t: "" });
    setTol(DEFAULT_TOL);
    setPhoto(null);
    setNcFor(null);
    if (specs.length) setSpecId(specs[0].id);
  }

  async function submitInspection() {
    if (!inspect || !specId) {
      toast.error("Pilih spesifikasi dahulu");
      return;
    }
    if (!actual.p || !actual.l || !actual.t) {
      toast.error("Lengkapi dimensi P/L/T");
      return;
    }
    setBusy(true);
    try {
      const dimensions = {
        actual: { p: parseFloat(actual.p), l: parseFloat(actual.l), t: parseFloat(actual.t) },
        tolerance: { p: parseRange(tol.p), l: parseRange(tol.l), t: parseRange(tol.t) },
      };
      const rec = await createRecord({ workItemId: inspect.id, specificationId: specId, dimensions, photo });
      if (rec.status === "PASSED") {
        toast.success("Item LOLOS QC");
        setInspect(null);
      } else {
        toast.error("Di luar toleransi — catat sebagai NCI");
        setNcFor(rec.id); // tampilkan form NCI
      }
      await loadProject(projectId);
    } catch {
      toast.error("Gagal menyimpan inspeksi");
    } finally {
      setBusy(false);
    }
  }

  async function submitNC() {
    if (!ncFor || !nc.defectDesc || !nc.picRework || !nc.estimatedDone) {
      toast.error("Lengkapi data NCI");
      return;
    }
    setBusy(true);
    try {
      await createNCItem({ qcRecordId: ncFor, ...nc });
      toast.success("Non-Conforming Item dicatat");
      setNcFor(null);
      setInspect(null);
      setNc({ defectDesc: "", picRework: "", estimatedDone: "" });
    } catch {
      toast.error("Gagal mencatat NCI");
    } finally {
      setBusy(false);
    }
  }

  async function handleIssueCert() {
    setBusy(true);
    try {
      const cert = await issueCertificate(projectId, items.map((i) => i.id));
      toast.success(`Certificate ${cert.certNumber} terbit — batch siap kirim`);
      await loadProject(projectId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menerbitkan certificate");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={18} /> Memuat...
      </div>
    );
  }

  const allPassed = items.length > 0 && items.every((i) => i.qcStatus === "PASSED");
  const pending = items.filter((i) => i.qcStatus !== "PASSED").length;

  return (
    <div className="space-y-4">
      {/* Pilih proyek (batch) */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-700">Pilih Batch (Proyek):</label>
        <select
          value={projectId}
          onChange={(e) => { setProjectId(e.target.value); setInspect(null); }}
          className="h-10 border border-gray-300 rounded-lg px-3 text-sm outline-none"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="ml-auto text-xs text-gray-400">{pending} item belum lolos</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area inspeksi */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          {!inspect ? (
            <div className="text-sm text-gray-400 py-8 text-center border border-dashed border-gray-200 rounded-xl">
              Pilih item di samping untuk memulai inspeksi (checklist QC + toleransi).
            </div>
          ) : ncFor ? (
            // Form NCI (FR-06)
            <div>
              <div className="flex items-center gap-2 mb-4 text-red-600 font-bold">
                <XCircle size={18} /> Non-Conforming Item — {inspect.name}
              </div>
              <textarea
                placeholder="Deskripsi cacat / penyimpangan..."
                value={nc.defectDesc}
                onChange={(e) => setNc({ ...nc, defectDesc: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 resize-none"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                  placeholder="PIC Rework"
                  value={nc.picRework}
                  onChange={(e) => setNc({ ...nc, picRework: e.target.value })}
                  className="h-10 border border-gray-300 rounded-lg px-3 text-sm"
                />
                <input
                  type="date"
                  value={nc.estimatedDone}
                  onChange={(e) => setNc({ ...nc, estimatedDone: e.target.value })}
                  className="h-10 border border-gray-300 rounded-lg px-3 text-sm"
                />
              </div>
              <button
                onClick={submitNC}
                disabled={busy}
                className="w-full h-11 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "#E67E22" }}
              >
                Simpan NCI
              </button>
            </div>
          ) : (
            // Form inspeksi (FR-04)
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-3">Inspeksi: {inspect.name}</div>
              <label className="text-xs font-semibold text-gray-600">Spesifikasi</label>
              <select
                value={specId}
                onChange={(e) => setSpecId(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm mb-4 mt-1"
              >
                {specs.length === 0 && <option value="">(belum ada spesifikasi)</option>}
                {specs.map((s) => (
                  <option key={s.id} value={s.id}>{s.title} ({s.version})</option>
                ))}
              </select>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {(["p", "l", "t"] as const).map((k) => (
                  <div key={k}>
                    <label className="text-xs font-semibold text-gray-600">
                      {k === "p" ? "Panjang" : k === "l" ? "Lebar" : "Tebal"}
                    </label>
                    <input
                      type="number" step="0.1" placeholder="aktual"
                      value={actual[k]}
                      onChange={(e) => setActual({ ...actual, [k]: e.target.value })}
                      className="mt-1 w-full h-10 border border-gray-300 rounded-lg px-2 text-sm"
                    />
                    <input
                      value={tol[k]}
                      onChange={(e) => setTol({ ...tol, [k]: e.target.value })}
                      className="mt-1 w-full h-8 border border-gray-200 rounded-lg px-2 text-[11px] text-gray-500"
                      title="toleransi min-max"
                    />
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 mb-4 cursor-pointer">
                <Camera size={16} />
                <span>{photo ? photo.name : "Foto bukti (opsional)"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
              </label>

              <div className="flex gap-3">
                <button onClick={submitInspection} disabled={busy} className="flex-1 h-11 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ background: "#1E7E34" }}>
                  {busy ? "Memvalidasi..." : "Validasi & Simpan"}
                </button>
                <button onClick={() => setInspect(null)} className="flex-1 h-11 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm">Batal</button>
              </div>
            </div>
          )}
        </div>

        {/* Daftar item + certificate */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Status Batch</h3>
          <div className="space-y-2 mb-5">
            {items.map((it) => (
              <div key={it.id} className={`flex items-center gap-2 p-2.5 rounded-lg ${it.qcStatus === "PASSED" ? "bg-green-50" : it.qcStatus === "FAILED" ? "bg-red-50" : "bg-gray-50"}`}>
                {statusIcon(it.qcStatus)}
                <span className="text-sm font-semibold text-gray-700 flex-1 truncate">{it.name}</span>
                <span className={`text-[11px] font-bold ${it.qcStatus === "PASSED" ? "text-green-600" : it.qcStatus === "FAILED" ? "text-red-600" : "text-gray-400"}`}>{statusText(it.qcStatus)}</span>
                {it.qcStatus !== "PASSED" && (
                  <button onClick={() => openInspect(it)} className="text-[11px] font-semibold text-blue-600 hover:text-blue-800">Inspeksi ▸</button>
                )}
              </div>
            ))}
          </div>

          {certs.length > 0 && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 mb-3">
              <div className="flex items-center gap-2 mb-1"><Award size={15} className="text-green-600" /><span className="text-xs text-gray-500 font-semibold">QC Certificate</span></div>
              {certs.map((c) => (
                <div key={c.id} className="text-sm font-bold text-green-700 font-mono">{c.certNumber}</div>
              ))}
            </div>
          )}

          {allPassed ? (
            <button onClick={handleIssueCert} disabled={busy} className="w-full h-10 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ background: "#1E7E34" }}>
              Terbitkan QC Certificate
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-gray-50 border border-dashed border-gray-300 text-center text-xs font-semibold text-gray-500">
              🔒 Terkunci — {pending} item belum lolos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
