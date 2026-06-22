import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAuditLogs, type AuditLogDto } from "../../services/audit.service";

const CAT_COLOR: Record<string, string> = {
  Produksi: "text-blue-600 bg-blue-50",
  QC: "text-green-600 bg-green-50",
  Logistik: "text-orange-600 bg-orange-50",
  Akses: "text-red-600 bg-red-50",
};

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if ("status" in obj) return String(obj.status);
    if ("certNumber" in obj) return String(obj.certNumber);
    return JSON.stringify(obj).slice(0, 40);
  }
  return String(v);
}

export function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  async function load() {
    setLoading(true);
    try {
      setLogs(await getAuditLogs(filter, dateFilter));
    } catch {
      toast.error("Gagal memuat audit trail");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, dateFilter]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-gray-900">Audit Trail — Log Aktivitas Lintas Modul</h3>
          <p className="text-xs text-gray-400 mt-0.5">{logs.length} entri ditampilkan</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none">
            <option value="all">Semua Modul</option>
            <option value="Produksi">Produksi</option>
            <option value="QC">QC</option>
            <option value="Logistik">Logistik</option>
            <option value="Akses">Akses</option>
          </select>
          <button onClick={() => { setFilter("all"); setDateFilter(""); }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-50">Reset</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-5 py-3 font-semibold">Waktu</th>
              <th className="px-5 py-3 font-semibold">Pengguna</th>
              <th className="px-5 py-3 font-semibold">Modul</th>
              <th className="px-5 py-3 font-semibold">Aksi</th>
              <th className="px-5 py-3 font-semibold">Entitas</th>
              <th className="px-5 py-3 font-semibold">Sebelum</th>
              <th className="px-5 py-3 font-semibold">Sesudah</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400"><Loader2 className="animate-spin inline mr-2" size={16} /> Memuat...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">Tidak ada aktivitas pada filter ini.</td></tr>
            ) : (
              logs.map((a) => (
                <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-500 text-xs font-mono">
                    {new Date(a.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-700">{a.user}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${CAT_COLOR[a.category]}`}>{a.category}</span></td>
                  <td className="px-5 py-3 text-gray-600 text-xs font-mono">{a.action}</td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{a.entity}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{fmtValue(a.before)}</td>
                  <td className="px-5 py-3 text-gray-700 text-xs font-semibold">{fmtValue(a.after)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2 text-xs text-gray-400">
        <Lock size={12} /> Log bersifat append-only &amp; tidak dapat dihapus oleh pengguna biasa.
      </div>
    </div>
  );
}
