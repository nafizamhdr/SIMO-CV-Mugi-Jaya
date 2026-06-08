import { useState } from "react";
import {
  Truck,
  FileText,
  AlertTriangle,
  MapPin,
  Navigation,
  Package,
} from "lucide-react";
import type { Shipment, QCBatch, Vendor } from "./data";
import { vendors } from "./data";

interface Props {
  shipments: Shipment[];
  qcBatches: QCBatch[];
  onDispatch: (shipment: Omit<Shipment, "id">) => void;
  onSimulateAnomaly: () => void;
  onViewSuratJalan: (id: string) => void;
}

export function LogistikPage({
  shipments,
  qcBatches,
  onDispatch,
  onSimulateAnomaly,
  onViewSuratJalan,
}: Props) {
  const [driver, setDriver] = useState("Budi Santoso");
  const [plate, setPlate] = useState("B 1234 XYZ");
  const [polis, setPolis] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(vendors[0].id);
  const [selectedBatch, setSelectedBatch] = useState("");

  const certifiedBatches = qcBatches.filter((b) => b.certificate);

  function handleDispatch() {
    if (!polis.trim()) return;
    const vendor = vendors.find((v) => v.id === selectedVendor)!;
    const batch = certifiedBatches.find((b) => b.id === selectedBatch);
    onDispatch({
      vendor: vendor.nama,
      tujuan: "Proyek Fasad IKN",
      status: vendor.hasGPS ? "Normal" : "Check-in",
      polis,
      driver,
      plate,
      cert: batch?.certificate || "-",
      suratJalan: "SJ-2026-NEW",
      locked: true,
    });
    setPolis("");
  }

  const statusMap: Record<
    string,
    { border: string; badge: string; label: string }
  > = {
    Normal: {
      border: "border-gray-200",
      badge: "bg-green-100 text-green-700",
      label: "NORMAL",
    },
    Anomali: {
      border: "border-red-300 bg-red-50",
      badge: "bg-red-600 text-white",
      label: "ANOMALI",
    },
    "Check-in": {
      border: "border-orange-200",
      badge: "bg-orange-100 text-orange-700",
      label: "CHECK-IN",
    },
  };

  return (
    <div className="space-y-4">
      {/* Map placeholder */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-2">
          <div>
            <h3 className="font-bold text-gray-900">Live Tracking Armada</h3>
            <p className="text-xs text-gray-400">
              Pelacakan posisi real-time · rute Bekasi → lokasi proyek
            </p>
          </div>
          <button
            onClick={onSimulateAnomaly}
            className="text-xs font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            ⚡ Simulasi Anomali Rute
          </button>
        </div>

        {/* Stylized map */}
        <div
          className="rounded-xl overflow-hidden relative"
          style={{
            height: 320,
            background: "linear-gradient(135deg,#e8f0fe,#dbeafe)",
          }}
        >
          {/* Grid lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            xmlns="http://www.w3.org/2000/svg"
          >
            {Array.from({ length: 8 }, (_, i) => (
              <line
                key={`h${i}`}
                x1="0"
                y1={`${(i + 1) * 12.5}%`}
                x2="100%"
                y2={`${(i + 1) * 12.5}%`}
                stroke="#2E5FA3"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <line
                key={`v${i}`}
                x1={`${(i + 1) * 10}%`}
                y1="0"
                x2={`${(i + 1) * 10}%`}
                y2="100%"
                stroke="#2E5FA3"
                strokeWidth="0.5"
              />
            ))}
          </svg>

          {/* Route line */}
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="15%"
              y1="70%"
              x2="85%"
              y2="30%"
              stroke="#2E5FA3"
              strokeWidth="2.5"
              strokeDasharray="8,4"
              opacity="0.7"
            />
          </svg>

          {/* Origin marker */}
          <div className="absolute" style={{ left: "13%", top: "62%" }}>
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md"
                style={{ background: "#1F3864" }}
              >
                <Package size={14} />
              </div>
              <div
                className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded text-white"
                style={{ background: "#1F3864" }}
              >
                Gudang Bekasi
              </div>
            </div>
          </div>

          {/* Truck markers */}
          {shipments.map((s, i) => {
            const anomaly = s.status === "Anomali";
            const checkin = s.status === "Check-in";
            const color = anomaly ? "#C00000" : checkin ? "#E67E22" : "#1E7E34";
            const leftPct = 35 + i * 15;
            const topPct = 48 - i * 5;
            return (
              <div
                key={s.id}
                className="absolute"
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              >
                <div className="flex flex-col items-center">
                  <div
                    className="px-2 py-1 rounded text-white text-[10px] font-bold shadow"
                    style={{ background: color }}
                  >
                    🚛 {s.id.slice(-4)}
                  </div>
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: `6px solid ${color}`,
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Destination marker */}
          <div className="absolute" style={{ left: "82%", top: "22%" }}>
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md"
                style={{ background: "#1E7E34" }}
              >
                <MapPin size={14} />
              </div>
              <div
                className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded text-white"
                style={{ background: "#1E7E34" }}
              >
                Proyek IKN
              </div>
            </div>
          </div>

          {/* Compass */}
          <div className="absolute top-3 right-3">
            <Navigation size={20} className="text-blue-900 opacity-50" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 px-2 text-xs text-gray-500">
          {[
            ["#1E7E34", "Normal"],
            ["#E67E22", "Check-in (tanpa GPS)"],
            ["#C00000", "Anomali / Keluar Rute"],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Manifest form */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">
            Buat Manifest Pengiriman
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Batch (ber-QC Certificate)
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none"
              >
                {certifiedBatches.length === 0 ? (
                  <option value="">— Tidak ada batch ber-sertifikat —</option>
                ) : (
                  certifiedBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} · {b.produk}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                Vendor (AVL)
              </label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none"
              >
                {vendors
                  .filter((v) => v.inAVL)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nama} (★{v.rating}
                      {!v.hasGPS ? " · tanpa GPS" : ""})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Driver
                </label>
                <input
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  No. Kendaraan
                </label>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">
                No. Polis Asuransi <span className="text-red-500">*wajib</span>
              </label>
              <input
                value={polis}
                onChange={(e) => setPolis(e.target.value)}
                placeholder="POL-2026-..."
                className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
          </div>

          <button
            onClick={handleDispatch}
            disabled={!polis.trim()}
            className="mt-5 w-full h-12 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#E67E22,#f39c12)" }}
          >
            Berangkatkan (Dispatch) →
          </button>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Manifest terkunci & Surat Jalan terbit otomatis setelah dispatch.
          </p>
        </div>

        {/* Active shipments */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Pengiriman Aktif</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {shipments.length === 0 ? (
              <p className="text-sm text-gray-400">
                Belum ada pengiriman aktif.
              </p>
            ) : (
              shipments.map((s) => {
                const { border, badge, label } = statusMap[s.status];
                return (
                  <div key={s.id} className={`border ${border} rounded-xl p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-sm font-bold text-gray-900"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {s.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${badge}`}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Vendor: {s.vendor}
                    </div>
                    <div className="text-xs text-gray-500">
                      Tujuan: {s.tujuan}
                    </div>
                    <div
                      className="text-xs text-gray-500"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Asuransi: {s.polis}
                    </div>
                    {s.status === "Anomali" && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-semibold">
                        <AlertTriangle size={12} />
                        Truk keluar rute — notifikasi terkirim
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => onViewSuratJalan(s.id)}
                        className="text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1"
                      >
                        <FileText size={12} />
                        Surat Jalan
                      </button>
                      {s.locked && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          🔒 Manifest terkunci
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
