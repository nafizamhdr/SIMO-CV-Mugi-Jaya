import { useEffect, useRef, useState } from "react";
import { Search, Download, Plus, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  getSpecifications,
  getProjects,
  uploadSpecification,
  type SpecificationDto,
  type ProjectDto,
} from "../../services/qc.service";

const API_ORIGIN = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000";

interface Props {
  canUpload: boolean;
}

export function RepositoriPage({ canUpload }: Props) {
  const [specs, setSpecs] = useState<SpecificationDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ projectId: "", title: "", version: "1.0" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      setSpecs(await getSpecifications());
      if (canUpload) {
        const p = await getProjects();
        setProjects(p);
        setForm((f) => ({ ...f, projectId: f.projectId || p[0]?.id || "" }));
      }
    } catch {
      toast.error("Gagal memuat repositori");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload() {
    if (!form.projectId || !form.title || !file) {
      toast.error("Lengkapi proyek, judul, dan file");
      return;
    }
    setBusy(true);
    try {
      await uploadSpecification({ ...form, file });
      toast.success("Spesifikasi diunggah");
      setShowForm(false);
      setForm({ projectId: projects[0]?.id ?? "", title: "", version: "1.0" });
      setFile(null);
      await load();
    } catch {
      toast.error("Gagal mengunggah spesifikasi");
    } finally {
      setBusy(false);
    }
  }

  function handleDownload(spec: SpecificationDto) {
    if (spec.fileUrl.startsWith("/uploads")) {
      window.open(`${API_ORIGIN}${spec.fileUrl}`, "_blank");
    } else {
      toast.info("File tersimpan di cloud (S3) — demo, tidak dapat diunduh");
    }
  }

  const filtered = specs.filter(
    (s) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      (s.project?.name ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={18} /> Memuat...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + upload */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari spesifikasi atau proyek..."
            className="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm outline-none focus:border-blue-600"
          />
        </div>
        {canUpload ? (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="h-11 px-4 rounded-xl text-white font-bold text-sm flex items-center gap-2"
            style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Tutup" : "Unggah Spesifikasi"}
          </button>
        ) : (
          <span className="text-xs text-gray-400 px-2">Mode baca (read-only)</span>
        )}
      </div>

      {/* Form upload */}
      {showForm && canUpload && (
        <div className="bg-white rounded-2xl p-5 border-2 border-blue-200 shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="h-11 border border-gray-300 rounded-xl px-3 text-sm"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              placeholder="Judul spesifikasi"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-11 border border-gray-300 rounded-xl px-3 text-sm md:col-span-1"
            />
            <input
              placeholder="Versi (mis. 1.0)"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              className="h-11 border border-gray-300 rounded-xl px-3 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button onClick={() => fileRef.current?.click()} className="h-11 px-4 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700">
              {file ? file.name : "Pilih File (PDF/gambar)"}
            </button>
            <button onClick={handleUpload} disabled={busy} className="h-11 px-5 rounded-xl text-white font-bold text-sm disabled:opacity-50 ml-auto" style={{ background: "#1E7E34" }}>
              {busy ? "Mengunggah..." : "Unggah"}
            </button>
          </div>
        </div>
      )}

      {/* Daftar spesifikasi */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-16 bg-white rounded-2xl border border-gray-100">Tidak ada dokumen yang cocok.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((spec) => (
            <div key={spec.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  <div>
                    <h3 className="font-bold text-gray-900">{spec.title}</h3>
                    <div className="text-xs text-gray-400">{spec.project?.name ?? spec.projectId}</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">v{spec.version}</span>
              </div>
              <div className="text-[11px] text-gray-400 mb-3">
                Diunggah {new Date(spec.uploadedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
              <button
                onClick={() => handleDownload(spec)}
                className="w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                style={{ background: "#1E7E34" }}
              >
                <Download size={14} /> Unduh / Buka
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
