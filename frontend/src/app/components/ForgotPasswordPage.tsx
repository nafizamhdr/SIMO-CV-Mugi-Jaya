import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { forgotPassword } from "../../services/auth.service";
import { extractApiError } from "../../services/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
      setDevUrl(res.resetUrl ?? null); // hanya muncul di mode dev
    } catch (err) {
      setError(extractApiError(err, "Gagal memproses permintaan"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Lupa Kata Sandi" subtitle="Masukkan email Anda untuk menerima tautan reset.">
      {message ? (
        <div className="space-y-3">
          <div className="text-sm rounded-lg px-3 py-2 bg-green-50 text-green-700">{message}</div>
          {devUrl && (
            <div className="text-xs rounded-lg px-3 py-2 bg-blue-50 text-blue-700 break-all">
              <b>Mode demo</b> — buka tautan ini untuk reset:{" "}
              <Link to={devUrl.replace(/^https?:\/\/[^/]+/, "")} className="underline font-semibold">
                {devUrl.replace(/^https?:\/\/[^/]+/, "")}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@mugijaya.co.id"
            className="w-full h-12 border border-gray-300 rounded-xl px-4 outline-none focus:border-blue-600 text-sm"
          />
          {error && <div className="text-sm rounded-lg px-3 py-2 bg-red-50 text-red-700">{error}</div>}
          <button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70" style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}>
            {loading && <Loader2 size={16} className="animate-spin" />} Kirim Tautan Reset
          </button>
        </form>
      )}
      <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Kembali ke Login
      </Link>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f4f6f9" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white" style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}>M</div>
          <div className="font-extrabold text-gray-900">SIMO</div>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
