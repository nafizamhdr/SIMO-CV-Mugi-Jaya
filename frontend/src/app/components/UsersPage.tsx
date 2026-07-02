import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, X, KeyRound, UserCheck, UserX, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "../../types";
import { getUsers, createUser, updateUser, resetPassword, type UserDto } from "../../services/users.service";
import { useAuth } from "../../hooks/useAuth";

const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Pemilik",
  KEPALA_PRODUKSI: "Kepala Produksi",
  MANDOR: "Mandor",
  INSPECTOR_QC: "Inspector QC",
  SUPERVISOR_LAPANGAN: "Supervisor Lapangan",
  ADMIN_OPERASIONAL: "Admin Operasional",
};

const ROLES = Object.keys(ROLE_LABEL) as Role[];

const emptyForm = { name: "", email: "", password: "", role: "MANDOR" as Role };

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [editing, setEditing] = useState<UserDto | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "MANDOR" as Role });

  async function load() {
    try {
      setUsers(await getUsers());
    } catch {
      toast.error("Gagal memuat daftar akun");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || form.password.length < 8) {
      toast.error("Lengkapi data; kata sandi minimal 8 karakter");
      return;
    }
    setBusy(true);
    try {
      await createUser(form);
      toast.success(`Akun ${form.name} berhasil dibuat`);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat akun");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(u: UserDto) {
    setEditing(u);
    setEditForm({ name: u.name, role: u.role });
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await updateUser(editing.id, editForm);
      toast.success("Akun diperbarui");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui akun");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(u: UserDto) {
    const next = !u.isActive;
    const verb = next ? "mengaktifkan" : "menonaktifkan";
    if (!window.confirm(`Yakin ${verb} akun ${u.name}?`)) return;
    setBusy(true);
    try {
      await updateUser(u.id, { isActive: next });
      toast.success(`Akun ${u.name} ${next ? "diaktifkan" : "dinonaktifkan"}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Gagal ${verb} akun`);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(u: UserDto) {
    const pwd = window.prompt(`Kata sandi baru untuk ${u.name} (min. 8 karakter):`);
    if (!pwd) return;
    if (pwd.length < 8) {
      toast.error("Kata sandi minimal 8 karakter");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(u.id, pwd);
      toast.success(`Kata sandi ${u.name} berhasil direset`);
    } catch {
      toast.error("Gagal mereset kata sandi");
    } finally {
      setBusy(false);
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
    <div className="space-y-4">
      {/* Header + tombol tambah */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
        <div>
          <h3 className="font-bold text-gray-900">Daftar Akun ({users.length})</h3>
          <p className="text-xs text-gray-400">Akun nonaktif tidak dapat masuk ke sistem.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto h-11 px-4 rounded-xl text-white font-bold text-sm flex items-center gap-2"
          style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Tutup" : "Tambah Akun"}
        </button>
      </div>

      {/* Form tambah akun */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-5 border-2 border-blue-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Nama lengkap"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:border-blue-600"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:border-blue-600"
            />
            <input
              type="password"
              placeholder="Kata sandi (min. 8 karakter)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:border-blue-600"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 h-11 px-6 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: "#1E7E34" }}
          >
            {busy ? "Menyimpan..." : "Simpan Akun"}
          </button>
        </form>
      )}

      {/* Form edit akun */}
      {editing && (
        <form onSubmit={handleEdit} className="bg-white rounded-2xl p-5 border-2 border-orange-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-gray-900 text-sm">Edit Akun — {editing.email}</div>
            <button type="button" onClick={() => setEditing(null)} className="text-gray-400 text-sm font-semibold">Batal</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:border-blue-600"
            />
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
              className="h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 h-11 px-6 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: "#E67E22" }}
          >
            {busy ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      )}

      {/* Tabel akun */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold">Nama</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-t border-gray-100 ${!u.isActive ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3 font-semibold text-gray-800">
                    {u.name}
                    {u.id === me?.id && <span className="ml-2 text-[10px] font-bold text-blue-600">(Anda)</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs font-mono">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                      {u.isActive ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        title="Edit nama/role"
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleResetPassword(u)}
                        title="Reset kata sandi"
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <KeyRound size={14} />
                      </button>
                      {u.id !== me?.id && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          className={`p-2 rounded-lg border ${u.isActive ? "border-red-200 text-red-500 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
                        >
                          {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          Semua perubahan akun tercatat otomatis di Audit Trail.
        </div>
      </div>
    </div>
  );
}
