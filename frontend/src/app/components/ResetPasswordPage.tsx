import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resetPassword } from "../../services/auth.service";
import { extractApiError } from "../../services/api";
import { AuthShell } from "./ForgotPasswordPage";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Kata sandi minimal 8 karakter");
    if (password !== confirm) return setError("Konfirmasi kata sandi tidak cocok");
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      toast.success("Kata sandi berhasil direset. Silakan masuk.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(extractApiError(err, "Gagal mereset kata sandi"));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Reset Kata Sandi" subtitle="Token tidak ditemukan.">
        <Link to="/forgot-password" className="text-sm text-blue-600 underline">Minta tautan baru</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset Kata Sandi" subtitle="Buat kata sandi baru untuk akun Anda.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kata sandi baru (min. 8)" className="w-full h-12 border border-gray-300 rounded-xl px-4 outline-none focus:border-blue-600 text-sm" />
        <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Ulangi kata sandi" className="w-full h-12 border border-gray-300 rounded-xl px-4 outline-none focus:border-blue-600 text-sm" />
        {error && <div className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700">{error}</div>}
        <button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}>
          {loading && <Loader2 size={16} className="animate-spin" />} Simpan Kata Sandi Baru
        </button>
      </form>
    </AuthShell>
  );
}
