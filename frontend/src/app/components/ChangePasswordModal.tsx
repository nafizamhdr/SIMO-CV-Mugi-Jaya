import { useState, type FormEvent } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "../../services/auth.service";
import { extractApiError } from "../../services/api";

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (next.length < 8) return setError("Kata sandi baru minimal 8 karakter");
    if (next !== confirm) return setError("Konfirmasi tidak cocok");
    setLoading(true);
    setError(null);
    try {
      await changePassword(current, next);
      toast.success("Kata sandi berhasil diubah");
      onClose();
    } catch (err) {
      setError(extractApiError(err, "Gagal mengubah kata sandi"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-gray-900">Ganti Kata Sandi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Kata sandi saat ini" className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:border-blue-600" />
          <input type="password" required value={next} onChange={(e) => setNext(e.target.value)} placeholder="Kata sandi baru (min. 8)" className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:border-blue-600" />
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Ulangi kata sandi baru" className="w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none focus:border-blue-600" />
          {error && <div className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700">{error}</div>}
          <p className="text-[11px] text-gray-400">Setelah diganti, sesi di perangkat lain akan otomatis keluar.</p>
          <button type="submit" disabled={loading} className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}>
            {loading && <Loader2 size={16} className="animate-spin" />} Simpan
          </button>
        </form>
      </div>
    </div>
  );
}
