import { useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import type { Warehouse } from "./data";

interface Props {
  warehouses: Warehouse[];
  onSubmit: (whId: string, status: Warehouse["status"]) => void;
}

type StatusOption = "To-Do" | "In-Progress" | "Done";

const STATUS_COLORS: Record<
  StatusOption,
  { bg: string; text: string; border: string }
> = {
  "To-Do": { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
  "In-Progress": { bg: "#eff6ff", text: "#2E5FA3", border: "#2E5FA3" },
  Done: { bg: "#f0fdf4", text: "#1E7E34", border: "#1E7E34" },
};

export function ProduksiPage({ warehouses, onSubmit }: Props) {
  const [selectedWh, setSelectedWh] = useState(warehouses[0]?.id || "");
  const [selectedStatus, setSelectedStatus] = useState<StatusOption | null>(
    null,
  );
  const [hasPhoto, setHasPhoto] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentWh = warehouses.find((w) => w.id === selectedWh);

  function handleSubmit() {
    if (!selectedStatus) return;
    onSubmit(selectedWh, selectedStatus);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedStatus(null);
      setHasPhoto(false);
    }, 2500);
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-1">Input Status Pekerjaan</h3>
        <p className="text-sm text-gray-400 mb-6">
          Perbarui progres pekerjaan di warehouse Anda
        </p>

        {/* Warehouse select */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pilih Warehouse
          </label>
          <select
            value={selectedWh}
            onChange={(e) => setSelectedWh(e.target.value)}
            className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:border-blue-600"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} · {w.nama} ({w.progress}%)
              </option>
            ))}
          </select>
        </div>

        {/* Current status badge */}
        {currentWh && (
          <div className="mb-5 p-3 bg-gray-50 rounded-xl flex items-center gap-3">
            <div className="text-xs text-gray-500">Status saat ini:</div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                currentWh.status === "Done"
                  ? "bg-green-100 text-green-700"
                  : currentWh.status === "In-Progress"
                    ? "bg-blue-100 text-blue-700"
                    : currentWh.status === "Tertunda"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-600"
              }`}
            >
              {currentWh.status}
            </span>
            <div className="ml-auto text-xs text-gray-400">
              Progres:{" "}
              <span className="font-bold text-gray-700">
                {currentWh.progress}%
              </span>
            </div>
          </div>
        )}

        {/* Status selector */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Status Pekerjaan Baru
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["To-Do", "In-Progress", "Done"] as StatusOption[]).map((s) => {
              const active = selectedStatus === s;
              const colors = STATUS_COLORS[s];
              return (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className="h-11 rounded-xl border font-semibold text-sm transition-all"
                  style={{
                    background: active
                      ? s === "Done"
                        ? "#1E7E34"
                        : s === "In-Progress"
                          ? "#2E5FA3"
                          : "#64748b"
                      : colors.bg,
                    color: active ? "#fff" : colors.text,
                    borderColor: active
                      ? s === "Done"
                        ? "#1E7E34"
                        : s === "In-Progress"
                          ? "#2E5FA3"
                          : "#64748b"
                      : colors.border,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photo upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Foto Dokumentasi <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setHasPhoto(true)}
              className="w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all"
              style={{
                borderStyle: hasPhoto ? "solid" : "dashed",
                borderColor: hasPhoto ? "#2E5FA3" : "#d1d5db",
                background: hasPhoto ? "#eff6ff" : "#f9fafb",
                color: hasPhoto ? "#2E5FA3" : "#9ca3af",
              }}
            >
              {hasPhoto ? (
                <CheckCircle2 size={24} />
              ) : (
                <>
                  <Camera size={20} />
                  <span className="text-[10px]">Ambil Foto</span>
                </>
              )}
            </button>
            {hasPhoto && (
              <div className="flex-1 flex items-center">
                <div className="text-xs text-gray-500">
                  <span className="text-green-600 font-semibold">
                    ✓ Foto ditambahkan
                  </span>
                  <br />
                  dokumentasi_wh_{selectedWh.toLowerCase()}.jpg
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Catatan (Opsional)
          </label>
          <textarea
            rows={3}
            placeholder="Tambahkan catatan pekerjaan..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-600 resize-none"
          />
        </div>

        {submitted ? (
          <div className="h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center gap-2 text-green-700 font-semibold text-sm">
            <CheckCircle2 size={16} />
            Laporan terkirim — dashboard diperbarui
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!selectedStatus}
            className="w-full h-12 rounded-xl text-white font-bold text-sm transition-opacity disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
          >
            Submit Laporan
          </button>
        )}
      </div>

      {/* Warehouse status overview */}
      <div className="mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Status Semua Warehouse</h3>
        <div className="space-y-2">
          {warehouses.map((w) => (
            <div key={w.id} className="flex items-center gap-3 text-sm">
              <span className="w-16 font-mono text-gray-500 text-xs">
                {w.id}
              </span>
              <span className="flex-1 text-gray-700">{w.nama}</span>
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${w.progress}%`,
                    background:
                      w.status === "Done"
                        ? "#1E7E34"
                        : w.status === "In-Progress"
                          ? "#2E5FA3"
                          : w.status === "Tertunda"
                            ? "#E67E22"
                            : "#94a3b8",
                  }}
                />
              </div>
              <span className="w-8 text-xs font-bold text-gray-600">
                {w.progress}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
