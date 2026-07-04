import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { verifyInvite, acceptInvite } from "../../services/auth.service";
import { extractApiError } from "../../services/api";
import { AuthShell } from "./ForgotPasswordPage";

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [invitee, setInvitee] = useState<{ email: string; name: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!token) {
        setInvalid(true);
        setChecking(false);
        return;
      }
      try {
        setInvitee(await verifyInvite(token));
      } catch {
        setInvalid(true);
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Kata sandi minimal 8 karakter");
    if (password !== confirm) return setError("Konfirmasi kata sandi tidak cocok");
    setLoading(true);
    setError(null);
    try {
      await acceptInvite(token, password);
      toast.success("Akun diaktifkan. Silakan masuk.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(extractApiError(err, "Gagal mengaktifkan akun"));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <AuthShell title="Aktivasi Akun" subtitle="Memeriksa undangan...">
        <Loader2 className="animate-spin text-gray-400" size={20} />
      </AuthShell>
    );
  }

  if (invalid) {
    return (
      <AuthShell title="Undangan Tidak Valid" subtitle="Tautan undangan salah atau sudah kedaluwarsa.">
        <Link to="/login" className="text-sm text-blue-600 underline">Kembali ke Login</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Aktivasi Akun" subtitle={`Halo ${invitee?.name}, buat kata sandi untuk ${invitee?.email}.`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kata sandi (min. 8)" className="w-full h-12 border border-gray-300 rounded-xl px-4 outline-none focus:border-blue-600 text-sm" />
        <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Ulangi kata sandi" className="w-full h-12 border border-gray-300 rounded-xl px-4 outline-none focus:border-blue-600 text-sm" />
        {error && <div className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700">{error}</div>}
        <button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}>
          {loading && <Loader2 size={16} className="animate-spin" />} Aktifkan Akun
        </button>
      </form>
    </AuthShell>
  );
}
