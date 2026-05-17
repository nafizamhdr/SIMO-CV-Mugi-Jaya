import { useState } from "react";
import { Lock } from "lucide-react";
import type { AuditEntry } from "./data";

interface Props {
  auditTrail: AuditEntry[];
}

const AKSI_COLOR: Record<string, string> = {
  Produksi: "text-blue-600 bg-blue-50",
  QC: "text-green-600 bg-green-50",
  Logistik: "text-orange-600 bg-orange-50",
  Akses: "text-red-600 bg-red-50",
};

export function AuditTrailPage({ auditTrail }: Props) {
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = auditTrail.filter(
    (a) =>
      (filter === "all" || a.aksi === filter) &&
      (!dateFilter || a.tgl === dateFilter),
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header + filters */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-gray-900">
            Audit Trail — Log Aktivitas
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {filtered.length} entri ditampilkan
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">Semua Aksi</option>
            <option value="Produksi">Produksi</option>
            <option value="QC">QC</option>
            <option value="Logistik">Logistik</option>
            <option value="Akses">Akses</option>
          </select>
          <button
            onClick={() => {
              setFilter("all");
              setDateFilter("");
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-5 py-3 font-semibold">Waktu</th>
              <th className="px-5 py-3 font-semibold">Pengguna</th>
              <th className="px-5 py-3 font-semibold">Aksi</th>
              <th className="px-5 py-3 font-semibold">Entitas</th>
              <th className="px-5 py-3 font-semibold">Nilai Sebelum</th>
              <th className="px-5 py-3 font-semibold">Nilai Sesudah</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-gray-400"
                >
                  Tidak ada aktivitas pada filter ini.
                </td>
              </tr>
            ) : (
              filtered.map((a, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td
                    className="px-5 py-3 text-gray-500 text-xs"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {a.waktu}
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-700">
                    {a.user}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${AKSI_COLOR[a.aksi] || "text-gray-600 bg-gray-100"}`}
                    >
                      {a.aksi}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{a.entitas}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {a.sebelum || "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-700 text-xs font-semibold">
                    {a.sesudah || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2 text-xs text-gray-400">
        <Lock size={12} />
        Log bersifat append-only &amp; tidak dapat dihapus oleh pengguna biasa
        (hanya Administrator dengan otorisasi khusus).
      </div>
    </div>
  );
}
