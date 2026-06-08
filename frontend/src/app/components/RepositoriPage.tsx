import { useState } from "react";
import { Search, Download, Eye, Plus, FileText } from "lucide-react";
import type { Document } from "./data";

interface Props {
  documents: Document[];
  canUpload: boolean;
  onUploadVersion: () => void;
  onPreview: (docId: string, ver: string) => void;
  onDownload: (docId: string, ver: string) => void;
}

const TIPE_STYLE: Record<string, string> = {
  Blueprint: "bg-blue-100 text-blue-700",
  Spesifikasi: "bg-green-100 text-green-700",
};

export function RepositoriPage({
  documents,
  canUpload,
  onUploadVersion,
  onPreview,
  onDownload,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = documents.filter(
    (d) =>
      d.kode.toLowerCase().includes(query.toLowerCase()) ||
      d.material.toLowerCase().includes(query.toLowerCase()) ||
      d.proyek.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Search + upload */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berdasarkan kode proyek atau nama material..."
            className="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm outline-none focus:border-blue-600"
          />
        </div>
        {canUpload ? (
          <button
            onClick={onUploadVersion}
            className="h-11 px-4 rounded-xl text-white font-bold text-sm flex items-center gap-2"
            style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
          >
            <Plus size={16} />
            Versi Baru
          </button>
        ) : (
          <span className="text-xs text-gray-400 px-2">
            Mode baca (read-only)
          </span>
        )}
      </div>

      {/* Document grid */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-16 bg-white rounded-2xl border border-gray-100">
          Tidak ada dokumen yang cocok.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((doc) => {
            const latest = doc.versions[doc.versions.length - 1];
            const reversedVersions = [...doc.versions].reverse();
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={15} className="text-gray-400" />
                      <h3 className="font-bold text-gray-900">
                        {doc.material}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPE_STYLE[doc.tipe] || "bg-gray-100 text-gray-600"}`}
                      >
                        {doc.tipe}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {doc.proyek} ·{" "}
                      <span
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {doc.kode}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold text-gray-300"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {doc.id}
                  </span>
                </div>

                {/* Version history */}
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                    Riwayat Versi (Versioning)
                  </div>
                  <div className="space-y-0">
                    {reversedVersions.map((v) => {
                      const isLatest = v.v === latest.v;
                      return (
                        <div
                          key={v.v}
                          className="flex items-center gap-2 text-xs py-1.5 border-t border-gray-100 first:border-t-0"
                        >
                          <span
                            className="font-bold w-6"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: isLatest ? "#2E5FA3" : "#94a3b8",
                            }}
                          >
                            {v.v}
                          </span>
                          <span className="text-gray-500">{v.tanggal}</span>
                          <span className="text-gray-400">· {v.catatan}</span>
                          {isLatest ? (
                            <span className="ml-auto text-[10px] font-bold text-blue-600">
                              TERBARU
                            </span>
                          ) : (
                            <button
                              onClick={() => onPreview(doc.id, v.v)}
                              className="ml-auto text-[11px] text-blue-500 font-semibold hover:text-blue-700"
                            >
                              Lihat
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onPreview(doc.id, latest.v)}
                    className="flex-1 h-10 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} />
                    Preview {latest.v}
                  </button>
                  <button
                    onClick={() => onDownload(doc.id, latest.v)}
                    className="flex-1 h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                    style={{ background: "#1E7E34" }}
                  >
                    <Download size={14} />
                    Unduh
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
