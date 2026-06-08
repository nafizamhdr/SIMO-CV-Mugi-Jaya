import { X, Download, FileText } from "lucide-react";
import type { Document } from "./data";

interface Props {
  doc: Document;
  version: string;
  onClose: () => void;
  onDownload: () => void;
}

export function PreviewDocModal({ doc, version, onClose, onDownload }: Props) {
  const v = doc.versions.find((x) => x.v === version);
  if (!v) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              Preview Dokumen
            </div>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="font-extrabold text-gray-900">{doc.material}</h3>
              <span
                className="text-blue-600 font-bold text-sm"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ({v.v})
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {doc.proyek} · {doc.kode} · {doc.tipe}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview area */}
        <div className="mt-4 aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
          <FileText size={48} strokeWidth={1} />
          <span className="text-xs mt-2">Pratinjau blueprint {v.v}</span>
          <span className="text-[10px] mt-0.5">
            {v.tanggal} · oleh {v.oleh}
          </span>
        </div>

        <div className="text-xs text-gray-500 mt-3">
          Catatan revisi:{" "}
          <span className="text-gray-700 font-semibold">{v.catatan}</span>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onDownload}
            className="flex-1 h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: "#1E7E34" }}
          >
            <Download size={16} />
            Unduh Versi Ini
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
