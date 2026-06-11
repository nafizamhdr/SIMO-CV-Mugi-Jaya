import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { WorkItemStatus } from "../../types";
import {
  getWarehouses,
  getWorkItems,
  updateWorkItemStatus,
  type WarehouseDto,
  type WorkItemDto,
} from "../../services/produksi.service";

const API_ORIGIN = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000";

const STATUS_OPTIONS: { value: WorkItemStatus; label: string; color: string }[] = [
  { value: "TODO", label: "To-Do", color: "#64748b" },
  { value: "IN_PROGRESS", label: "Dikerjakan", color: "#2E5FA3" },
  { value: "DONE", label: "Selesai", color: "#1E7E34" },
];

const STATUS_BADGE: Record<WorkItemStatus, string> = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

const statusLabel = (s: WorkItemStatus) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;

export function ProduksiPage() {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [selectedWh, setSelectedWh] = useState("");
  const [items, setItems] = useState<WorkItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeItem, setActiveItem] = useState<WorkItemDto | null>(null);
  const [newStatus, setNewStatus] = useState<WorkItemStatus | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Muat warehouse milik mandor saat pertama render.
  useEffect(() => {
    (async () => {
      try {
        const data = await getWarehouses();
        setWarehouses(data);
        if (data.length > 0) setSelectedWh(data[0].id);
      } catch {
        toast.error("Gagal memuat warehouse");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Muat work item saat warehouse berubah.
  async function loadItems(whId: string) {
    if (!whId) return;
    try {
      setItems(await getWorkItems(whId));
    } catch {
      toast.error("Gagal memuat daftar pekerjaan");
    }
  }

  useEffect(() => {
    void loadItems(selectedWh);
  }, [selectedWh]);

  function openUpdate(item: WorkItemDto) {
    setActiveItem(item);
    setNewStatus(item.status);
    setPhoto(null);
  }

  function cancelUpdate() {
    setActiveItem(null);
    setNewStatus(null);
    setPhoto(null);
  }

  async function handleSubmit() {
    if (!activeItem || !newStatus) return;
    setSubmitting(true);
    try {
      await updateWorkItemStatus(activeItem.id, newStatus, photo);
      toast.success("Status pekerjaan diperbarui — dashboard diperbarui");
      cancelUpdate();
      await loadItems(selectedWh);
    } catch {
      toast.error("Gagal memperbarui status");
    } finally {
      setSubmitting(false);
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
    <div className="max-w-xl mx-auto">
      {/* Pilih warehouse */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Warehouse</label>
        <select
          value={selectedWh}
          onChange={(e) => setSelectedWh(e.target.value)}
          className="w-full h-12 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:border-blue-600"
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Panel update status */}
      {activeItem && (
        <div className="mt-4 bg-white rounded-2xl p-5 border-2 border-blue-200 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-gray-400">Perbarui Status</div>
              <div className="font-bold text-gray-900">{activeItem.name}</div>
            </div>
            <button onClick={cancelUpdate} className="text-gray-400 text-sm font-semibold">
              Batal
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {STATUS_OPTIONS.map((s) => {
              const active = newStatus === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setNewStatus(s.value)}
                  className="h-12 rounded-xl border font-semibold text-sm transition-all"
                  style={{
                    background: active ? s.color : "#f8fafc",
                    color: active ? "#fff" : s.color,
                    borderColor: active ? s.color : "#e2e8f0",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Foto dokumentasi */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-12 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 mb-4 text-sm font-semibold"
            style={{
              borderColor: photo ? "#1E7E34" : "#d1d5db",
              color: photo ? "#1E7E34" : "#6b7280",
              background: photo ? "#f0fdf4" : "#f9fafb",
            }}
          >
            {photo ? <CheckCircle2 size={18} /> : <Camera size={18} />}
            {photo ? photo.name : "Ambil / Pilih Foto (opsional)"}
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || !newStatus}
            className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Mengirim..." : "Simpan Laporan"}
          </button>
        </div>
      )}

      {/* Daftar work item */}
      <div className="mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Daftar Pekerjaan</h3>
          <button
            onClick={() => loadItems(selectedWh)}
            className="text-gray-400 hover:text-gray-600"
            title="Muat ulang"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-gray-400 py-6 text-center">Belum ada pekerjaan di warehouse ini.</div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => openUpdate(it)}
                className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/40 transition flex items-center gap-3"
              >
                {it.photoUrl ? (
                  <img
                    src={`${API_ORIGIN}${it.photoUrl}`}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm truncate">{it.name}</div>
                  <div className="text-[11px] text-gray-400 truncate">{it.project?.name}</div>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[it.status]}`}>
                  {statusLabel(it.status)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
