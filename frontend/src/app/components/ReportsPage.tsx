import { useEffect, useState } from "react";
import { Loader2, FileDown, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  getReportTypes,
  getReportPreview,
  downloadReport,
  type ReportTypeInfo,
  type ReportPreview,
} from "../../services/report.service";

export function ReportsPage() {
  const [types, setTypes] = useState<ReportTypeInfo[]>([]);
  const [activeType, setActiveType] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await getReportTypes();
        setTypes(t);
        if (t.length) setActiveType(t[0].type);
      } catch {
        toast.error("Gagal memuat jenis laporan");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadPreview(type: string, s?: string, e?: string) {
    if (!type) return;
    setBusy(true);
    try {
      setPreview(await getReportPreview(type, s, e));
    } catch {
      toast.error("Gagal memuat pratinjau laporan");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadPreview(activeType, start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  async function handleDownload(format: "csv" | "pdf") {
    try {
      await downloadReport(activeType, format, start, end);
      toast.success(`Laporan ${format.toUpperCase()} diunduh`);
    } catch {
      toast.error("Gagal mengunduh laporan");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={18} /> Memuat...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pilih jenis laporan */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          {types.map((t) => (
            <button
              key={t.type}
              onClick={() => setActiveType(t.type)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeType === t.type ? "text-white" : "text-gray-500 hover:bg-gray-50 border border-gray-200"
              }`}
              style={activeType === t.type ? { background: "#1F3864" } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filter periode + export */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">DARI TANGGAL</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-10 border border-gray-300 rounded-lg px-3 text-sm" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">SAMPAI TANGGAL</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-10 border border-gray-300 rounded-lg px-3 text-sm" />
          </div>
          <button
            onClick={() => loadPreview(activeType, start, end)}
            className="h-10 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 flex items-center gap-2 hover:bg-gray-50"
          >
            <Filter size={14} /> Terapkan
          </button>
          <div className="ml-auto flex gap-2">
            <button onClick={() => handleDownload("csv")} className="h-10 px-4 rounded-lg text-white text-sm font-bold flex items-center gap-2" style={{ background: "#1E7E34" }}>
              <FileDown size={14} /> CSV
            </button>
            <button onClick={() => handleDownload("pdf")} className="h-10 px-4 rounded-lg text-white text-sm font-bold flex items-center gap-2" style={{ background: "#C00000" }}>
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      {preview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {preview.summary.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="text-xs text-gray-500 font-semibold">{s.label}</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pratinjau tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{preview?.title ?? "Pratinjau"}</h3>
          {preview && (
            <span className="text-xs text-gray-400">
              Menampilkan {preview.rows.length} dari {preview.totalRows} baris
            </span>
          )}
        </div>
        <div className="overflow-x-auto max-h-[480px]">
          {busy ? (
            <div className="py-16 text-center text-gray-400"><Loader2 className="animate-spin inline mr-2" size={16} /> Memuat...</div>
          ) : !preview || preview.rows.length === 0 ? (
            <div className="py-16 text-center text-gray-400">Tidak ada data pada periode ini.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left sticky top-0">
                <tr>
                  {preview.columns.map((c) => (
                    <th key={c} className="px-5 py-3 font-semibold whitespace-nowrap">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    {row.map((cell, j) => (
                      <td key={j} className="px-5 py-2.5 text-gray-700 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
