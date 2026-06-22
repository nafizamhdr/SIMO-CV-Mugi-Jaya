import { X, Printer } from "lucide-react";
import type { ShipmentDto } from "../../services/logistik.service";

interface Props {
  shipment: ShipmentDto;
  onClose: () => void;
}

export function SuratJalanModal({ shipment: s, onClose }: Props) {
  const sjNumber = `SJ-2026-${s.id.slice(-4).toUpperCase()}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Surat Jalan</div>
            <div className="text-xl font-extrabold text-gray-900 font-mono">{sjNumber}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-white" style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}>M</div>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">CV Mugi Jaya — Bekasi</div>

        <table className="w-full text-sm mb-4">
          <tbody>
            {[
              ["No. Pengiriman", s.id.slice(-8), true],
              ["QC Certificate", s.qcCertificate?.certNumber ?? "-", true],
              ["Vendor Ekspedisi", s.vendor?.name ?? s.vendorId, false],
              ["Driver", s.driverName, false],
              ["No. Kendaraan", s.vehicleNo, true],
              ["No. Polis Asuransi", s.insurancePolis, true],
              ["Tujuan", s.project?.name ?? s.projectId, false],
            ].map(([label, val, mono]) => (
              <tr key={String(label)} className="border-t border-gray-100">
                <td className="py-2 text-gray-500 w-44">{label}</td>
                <td className={`py-2 font-semibold ${label === "QC Certificate" ? "text-green-700" : "text-gray-900"}`} style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}>
                  {String(val)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5 text-xs text-green-700 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Diterbitkan otomatis dari QC Certificate. Dokumen sah secara sistem.
        </div>

        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex-1 h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2" style={{ background: "#1F3864" }}>
            <Printer size={16} /> Cetak / PDF
          </button>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm">Tutup</button>
        </div>
      </div>
    </div>
  );
}
