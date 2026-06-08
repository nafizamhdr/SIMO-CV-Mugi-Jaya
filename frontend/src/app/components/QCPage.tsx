import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Award } from "lucide-react";
import type { QCBatch } from "./data";

interface Props {
  batches: QCBatch[];
  onUpdateBatch: (
    batchIdx: number,
    itemIdx: number,
    result: "Pass" | "Fail",
  ) => void;
  onIssueCert: (batchIdx: number) => void;
}

export function QCPage({ batches, onUpdateBatch, onIssueCert }: Props) {
  const [selectedBatch, setSelectedBatch] = useState(0);
  const [inspecting, setInspecting] = useState<number | null>(null);
  const [dims, setDims] = useState({ p: "", l: "", t: "" });

  const batch = batches[selectedBatch];
  const allPass = batch.items.every((i) => i.hasil === "Pass");
  const pendingCount = batch.items.filter((i) => i.hasil === "Pending").length;

  function handleValidate() {
    if (!dims.p || !dims.l || !dims.t || inspecting === null) return;
    const p = parseFloat(dims.p),
      l = parseFloat(dims.l),
      t = parseFloat(dims.t);
    const within = (v: number, r: [number, number]) => v >= r[0] && v <= r[1];
    const ok =
      within(p, batch.spec.p) &&
      within(l, batch.spec.l) &&
      within(t, batch.spec.t);
    onUpdateBatch(selectedBatch, inspecting, ok ? "Pass" : "Fail");
    setInspecting(null);
    setDims({ p: "", l: "", t: "" });
  }

  const itemIcon = (hasil: string) => {
    if (hasil === "Pass")
      return <CheckCircle2 size={16} className="text-green-600" />;
    if (hasil === "Fail") return <XCircle size={16} className="text-red-600" />;
    return <Clock size={16} className="text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Batch selector */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-700">
          Pilih Batch:
        </label>
        <select
          value={selectedBatch}
          onChange={(e) => {
            setSelectedBatch(+e.target.value);
            setInspecting(null);
          }}
          className="h-10 border border-gray-300 rounded-lg px-3 text-sm outline-none"
        >
          {batches.map((b, i) => (
            <option key={b.id} value={i}>
              {b.id} · {b.produk}
            </option>
          ))}
        </select>
        <div className="ml-auto text-xs text-gray-400">
          {pendingCount} item belum diinspeksi
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main inspection area */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900">
              {batch.id} — {batch.produk}
            </h3>
            <p className="text-sm text-gray-400">Proyek {batch.proyek}</p>
            <p
              className="text-xs text-gray-400 mt-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Toleransi → P:{batch.spec.p[0]}-{batch.spec.p[1]} · L:
              {batch.spec.l[0]}-{batch.spec.l[1]} · T:{batch.spec.t[0]}-
              {batch.spec.t[1]}
            </p>
          </div>

          {inspecting !== null ? (
            <div className="border-t border-gray-100 pt-4">
              <div className="text-sm font-semibold text-gray-700 mb-4">
                Inspeksi: {batch.items[inspecting].nama}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { key: "p", label: "Panjang (cm)", range: batch.spec.p },
                  { key: "l", label: "Lebar (cm)", range: batch.spec.l },
                  { key: "t", label: "Tebal (mm)", range: batch.spec.t },
                ].map(({ key, label, range }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-gray-600">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={dims[key as keyof typeof dims]}
                      onChange={(e) =>
                        setDims({ ...dims, [key]: e.target.value })
                      }
                      className="mt-1 w-full h-10 border border-gray-300 rounded-lg px-3 text-sm outline-none focus:border-blue-600"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      placeholder="0.0"
                    />
                    <div className="text-[10px] text-gray-400 mt-1">
                      Target: {range[0]}-{range[1]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleValidate}
                  className="flex-1 h-10 rounded-lg text-white font-bold text-sm"
                  style={{ background: "#1E7E34" }}
                >
                  Validasi & Submit
                </button>
                <button
                  onClick={() => setInspecting(null)}
                  className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-600 font-semibold text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">
              Pilih item "Pending" di samping untuk memulai inspeksi
            </div>
          )}
        </div>

        {/* Item list + certificate */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Status Batch</h3>
          <div className="space-y-2 mb-5">
            {batch.items.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  item.hasil === "Pass"
                    ? "bg-green-50"
                    : item.hasil === "Fail"
                      ? "bg-red-50"
                      : "bg-gray-50"
                }`}
              >
                {itemIcon(item.hasil)}
                <span className="text-sm font-semibold text-gray-700 flex-1">
                  {item.nama}
                </span>
                <span
                  className={`text-xs font-bold ${
                    item.hasil === "Pass"
                      ? "text-green-600"
                      : item.hasil === "Fail"
                        ? "text-red-600"
                        : "text-gray-400"
                  }`}
                >
                  {item.hasil.toUpperCase()}
                </span>
                {item.hasil === "Pending" && (
                  <button
                    onClick={() => setInspecting(i)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Inspeksi ▸
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Certificate area */}
          {batch.certificate ? (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <Award size={16} className="text-green-600" />
                <div className="text-xs text-gray-500 font-semibold">
                  QC Certificate
                </div>
              </div>
              <div
                className="text-sm font-bold text-green-700"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {batch.certificate}
              </div>
              <div className="text-[11px] text-green-600 mt-1">
                ✓ Batch siap untuk pengiriman
              </div>
            </div>
          ) : allPass ? (
            <button
              onClick={() => onIssueCert(selectedBatch)}
              className="w-full h-10 rounded-xl text-white font-bold text-sm"
              style={{ background: "#1E7E34" }}
            >
              Terbitkan QC Certificate
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-300 text-center">
              <div className="text-xs font-semibold text-gray-500">
                🔒 Terkunci — masih ada {pendingCount} item belum lolos
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
