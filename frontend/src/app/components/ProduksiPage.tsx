import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, RefreshCw, CloudOff, Plus, Briefcase, Box, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { extractApiError } from "../../services/api";
import type { WorkItemStatus } from "../../types";
import {
  getWarehouses,
  getWorkItems,
  updateWorkItemStatus,
  getProjects,
  getMandors,
  createProject,
  updateProject,
  deleteProject,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createWorkItem,
  type WarehouseDto,
  type WorkItemDto,
  type ProjectDto,
  type MandorDto,
} from "../../services/produksi.service";
import { enqueueStatusUpdate, flushQueue, queueSize, registerAutoSync } from "../../services/syncQueue";

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
  const { user } = useAuth();
  const isKepala = user?.role === "KEPALA_PRODUKSI" || user?.role === "OWNER";

  if (isKepala) {
    return <KepalaProduksiView />;
  }

  return <MandorView />;
}

function MandorView() {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [selectedWh, setSelectedWh] = useState("");
  const [items, setItems] = useState<WorkItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeItem, setActiveItem] = useState<WorkItemDto | null>(null);
  const [newStatus, setNewStatus] = useState<WorkItemStatus | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingSync, setPendingSync] = useState(queueSize());
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    void flushQueue().then((n) => {
      if (n > 0) toast.success(`${n} laporan offline tersinkronkan`);
      setPendingSync(queueSize());
    });
    return registerAutoSync((count) => {
      toast.success(`${count} laporan offline tersinkronkan`);
      setPendingSync(queueSize());
    });
  }, []);

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
      if (!navigator.onLine) {
        enqueueStatusUpdate(activeItem.id, newStatus);
        setPendingSync(queueSize());
        toast.warning("Offline — laporan disimpan & akan disinkronkan otomatis saat online");
        cancelUpdate();
      } else {
        toast.error("Gagal memperbarui status");
      }
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
      {pendingSync > 0 && (
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
          <CloudOff size={14} /> {pendingSync} laporan menunggu sinkronisasi (offline)
        </div>
      )}

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
          <button onClick={() => loadItems(selectedWh)} className="text-gray-400 hover:text-gray-600">
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

function KepalaProduksiView() {
  const [activeTab, setActiveTab] = useState<"PEKERJAAN" | "PROYEK" | "WAREHOUSE">("PEKERJAAN");
  
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [mandors, setMandors] = useState<MandorDto[]>([]);
  const [items, setItems] = useState<WorkItemDto[]>([]);
  
  const [selectedWh, setSelectedWh] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Forms
  const [showItemForm, setShowItemForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showWhForm, setShowWhForm] = useState(false);
  const [editProject, setEditProject] = useState<ProjectDto | null>(null);
  const [editWh, setEditWh] = useState<WarehouseDto | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (warehouses.length > 0 && !selectedWh) {
      setSelectedWh(warehouses[0].id);
    }
  }, [warehouses]);

  useEffect(() => {
    if (selectedWh) {
      loadItems(selectedWh);
    }
  }, [selectedWh]);

  async function loadAll() {
    try {
      const [p, w, m] = await Promise.all([getProjects(), getWarehouses(), getMandors()]);
      setProjects(p);
      setWarehouses(w);
      setMandors(m);
    } catch (e) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  async function loadItems(whId: string) {
    if (!whId) return;
    try {
      const it = await getWorkItems(whId);
      setItems(it);
    } catch {
      toast.error("Gagal memuat pekerjaan");
    }
  }

  // --- Handlers ---
  function openCreateProject() {
    setEditProject(null);
    setShowProjectForm(true);
  }
  function openEditProject(p: ProjectDto) {
    setEditProject(p);
    setShowProjectForm(true);
  }
  function closeProjectForm() {
    setShowProjectForm(false);
    setEditProject(null);
  }

  async function handleSubmitProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      location: fd.get("location") as string,
      startDate: new Date(fd.get("startDate") as string).toISOString(),
      endDate: fd.get("endDate") ? new Date(fd.get("endDate") as string).toISOString() : undefined,
    };
    try {
      if (editProject) {
        await updateProject(editProject.id, payload);
        toast.success("Proyek diperbarui");
      } else {
        await createProject(payload);
        toast.success("Proyek dibuat");
      }
      closeProjectForm();
      loadAll();
    } catch (err) {
      toast.error(extractApiError(err, "Gagal menyimpan proyek"));
    }
  }

  async function handleDeleteProject(p: ProjectDto) {
    if (!window.confirm(`Hapus proyek "${p.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteProject(p.id);
      toast.success("Proyek dihapus");
      loadAll();
    } catch (err) {
      toast.error(extractApiError(err, "Gagal menghapus proyek"));
    }
  }

  function openCreateWh() {
    setEditWh(null);
    setShowWhForm(true);
  }
  function openEditWh(w: WarehouseDto) {
    setEditWh(w);
    setShowWhForm(true);
  }
  function closeWhForm() {
    setShowWhForm(false);
    setEditWh(null);
  }

  async function handleSubmitWarehouse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      location: fd.get("location") as string,
      mandorId: fd.get("mandorId") as string,
    };
    try {
      if (editWh) {
        await updateWarehouse(editWh.id, payload);
        toast.success("Warehouse diperbarui");
      } else {
        await createWarehouse(payload);
        toast.success("Warehouse dibuat");
      }
      closeWhForm();
      loadAll();
    } catch (err) {
      toast.error(extractApiError(err, "Gagal menyimpan warehouse"));
    }
  }

  async function handleDeleteWarehouse(w: WarehouseDto) {
    if (!window.confirm(`Hapus warehouse "${w.name}"?`)) return;
    try {
      await deleteWarehouse(w.id);
      toast.success("Warehouse dihapus");
      loadAll();
    } catch (err) {
      toast.error(extractApiError(err, "Gagal menghapus warehouse"));
    }
  }

  async function handleCreateItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createWorkItem({
        name: fd.get("name") as string,
        description: fd.get("description") as string,
        projectId: fd.get("projectId") as string,
        warehouseId: fd.get("warehouseId") as string,
        assigneeId: (fd.get("assigneeId") as string) || undefined,
      });
      toast.success("Pekerjaan dibuat");
      setShowItemForm(false);
      if (selectedWh === fd.get("warehouseId")) {
        loadItems(selectedWh);
      }
    } catch {
      toast.error("Gagal membuat pekerjaan");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={18} /> Memuat data...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white border border-gray-200 rounded-xl w-fit shadow-sm">
        <TabButton active={activeTab === "PEKERJAAN"} onClick={() => setActiveTab("PEKERJAAN")}>
          <Briefcase size={16} /> Pekerjaan
        </TabButton>
        <TabButton active={activeTab === "PROYEK"} onClick={() => setActiveTab("PROYEK")}>
          <Box size={16} /> Proyek
        </TabButton>
        <TabButton active={activeTab === "WAREHOUSE"} onClick={() => setActiveTab("WAREHOUSE")}>
          <Users size={16} /> Warehouse
        </TabButton>
      </div>

      {activeTab === "PEKERJAAN" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900 text-lg">Manajemen Pekerjaan</h2>
            <button
              onClick={() => setShowItemForm(!showItemForm)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl"
              style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
            >
              <Plus size={16} /> Tambah Pekerjaan
            </button>
          </div>

          {showItemForm && (
            <form onSubmit={handleCreateItem} className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Pekerjaan</label>
                  <input required name="name" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Proyek</label>
                  <select required name="projectId" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- Pilih Proyek --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Warehouse</label>
                  <select required name="warehouseId" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- Pilih Warehouse --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Assignee / PIC (opsional)</label>
                  <select name="assigneeId" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- Tidak ada --</option>
                    {mandors.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi (opsional)</label>
                <input name="description" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowItemForm(false)} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg" style={{ background: "#1F3864" }}>Simpan Pekerjaan</button>
              </div>
            </form>
          )}

          <div className="mb-4">
            <label className="text-xs font-bold text-gray-500 mr-2">Filter Warehouse:</label>
            <select
              value={selectedWh}
              onChange={(e) => setSelectedWh(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-xs font-bold text-gray-500">PEKERJAAN</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500">PROYEK</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500">STATUS</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-400">Belum ada pekerjaan.</td>
                  </tr>
                ) : items.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 text-sm">{it.name}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[200px]">{it.description || "-"}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{it.project?.name}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[it.status]}`}>
                        {statusLabel(it.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-sm font-semibold text-blue-600 hover:underline" style={{ color: "#2E5FA3" }}>Edit Status (via Mandor view)</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "PROYEK" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900 text-lg">Daftar Proyek</h2>
            <button
              onClick={openCreateProject}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl"
              style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
            >
              <Plus size={16} /> Tambah Proyek
            </button>
          </div>

          {showProjectForm && (
            <form onSubmit={handleSubmitProject} className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
              <div className="text-sm font-bold text-gray-700">{editProject ? "Edit Proyek" : "Proyek Baru"}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Proyek</label>
                  <input required name="name" defaultValue={editProject?.name ?? ""} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lokasi</label>
                  <input required name="location" defaultValue={editProject?.location ?? ""} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Mulai</label>
                  <input required type="date" name="startDate" defaultValue={editProject ? new Date(editProject.startDate).toISOString().slice(0, 10) : ""} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Selesai (opsional)</label>
                  <input type="date" name="endDate" defaultValue={editProject?.endDate ? new Date(editProject.endDate).toISOString().slice(0, 10) : ""} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeProjectForm} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white rounded-lg" style={{ background: "#1F3864" }}>{editProject ? "Simpan Perubahan" : "Simpan Proyek"}</button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-xs font-bold text-gray-500">NAMA PROYEK</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500">LOKASI</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500">MULAI</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900 text-sm">{p.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{p.location}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(p.startDate).toLocaleDateString("id-ID")}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditProject(p)} title="Edit" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteProject(p)} title="Hapus" className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "WAREHOUSE" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900 text-lg">Daftar Warehouse</h2>
            <button
              onClick={openCreateWh}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl"
              style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
            >
              <Plus size={16} /> Tambah Warehouse
            </button>
          </div>

          {showWhForm && (
            <form onSubmit={handleSubmitWarehouse} className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
              <div className="text-sm font-bold text-gray-700">{editWh ? "Edit Warehouse" : "Warehouse Baru"}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Warehouse</label>
                  <input required name="name" defaultValue={editWh?.name ?? ""} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lokasi</label>
                  <input required name="location" defaultValue={editWh?.location ?? ""} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Mandor</label>
                  <select required name="mandorId" defaultValue={editWh?.mandorId ?? ""} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- Pilih Mandor --</option>
                    {mandors.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeWhForm} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white rounded-lg" style={{ background: "#1F3864" }}>{editWh ? "Simpan Perubahan" : "Simpan Warehouse"}</button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-xs font-bold text-gray-500">WAREHOUSE</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500">LOKASI</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500">MANDOR PIC</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {warehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900 text-sm">{w.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{w.location}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-700">{w.mandor?.name || "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditWh(w)} title="Edit" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteWarehouse(w)} title="Hapus" className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
        active ? "text-white" : "text-gray-500 hover:bg-gray-50"
      }`}
      style={active ? { background: "#1F3864" } : {}}
    >
      {children}
    </button>
  );
}
