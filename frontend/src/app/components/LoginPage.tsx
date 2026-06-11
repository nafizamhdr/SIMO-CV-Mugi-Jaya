import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { PAGE_PATH, defaultPageFor } from "../roleConfig";

/** Akun seed (development) — semua memakai password Simo@2026. */
const QUICK_ACCOUNTS = [
  { short: "OW", name: "Pemilik (Owner)", email: "owner@mugijaya.co.id" },
  { short: "PY", name: "Kepala Produksi", email: "yudi@mugijaya.co.id" },
  { short: "MD", name: "Mandor", email: "asep@mugijaya.co.id" },
  { short: "QC", name: "Inspector QC", email: "qc@mugijaya.co.id" },
  { short: "PE", name: "Supervisor Lapangan", email: "edi@mugijaya.co.id" },
  { short: "AO", name: "Admin Operasional", email: "admin@mugijaya.co.id" },
];

const SEED_PASSWORD = "Simo@2026";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(loginEmail: string, loginPassword: string) {
    setError(null);
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      navigate(PAGE_PATH[defaultPageFor(user.role)], { replace: true });
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : "Gagal masuk. Periksa email & kata sandi.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }
    void submit(email, password);
  }

  function handleQuickLogin(accEmail: string) {
    setEmail(accEmail);
    setPassword(SEED_PASSWORD);
    void submit(accEmail, SEED_PASSWORD);
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f4f6f9" }}
    >
      {/* Left panel */}
      <div
        className="hidden md:flex w-1/2 flex-col justify-between p-14 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(150deg,#1F3864 0%,#16284a 60%,#0d1b33 100%)" }}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-5" style={{ background: "#fff" }} />
        <div className="absolute bottom-20 -left-10 w-60 h-60 rounded-full opacity-5" style={{ background: "#fff" }} />

        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-xl"
            style={{ background: "linear-gradient(135deg,#FFA500,#ff8c00)", color: "#1F3864" }}
          >
            M
          </div>
          <div>
            <div className="font-extrabold text-xl">SIMO</div>
            <div className="text-xs" style={{ color: "#bfdbfe" }}>
              CV Mugi Jaya
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight">
            Sistem Informasi
            <br />
            Manajemen Operasional
          </h1>
          <p className="mt-5 leading-relaxed" style={{ color: "#bfdbfe" }}>
            Produksi · Quality Control · Logistik
            <br />
            Satu platform untuk visibilitas penuh operasional Anda.
          </p>
          <div className="flex gap-2 mt-7 flex-wrap">
            {["Real-time Monitoring", "Live Tracking", "Digital QC"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="text-xs relative z-10" style={{ color: "#93c5fd" }}>
          Kelompok Maju Lancar — S1 Informatika AMIKOM
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900">Selamat Datang</h2>
            <p className="text-sm text-gray-500 mt-1">Masuk untuk melanjutkan ke dashboard Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@mugijaya.co.id"
                className="w-full h-12 border border-gray-300 rounded-xl px-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 border border-gray-300 rounded-xl px-4 pr-12 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm rounded-lg px-3 py-2" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="mt-8">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              Quick Login (Demo)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc.email)}
                  className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50"
                >
                  <div className="text-xs font-bold text-gray-800">{acc.short}</div>
                  <div className="text-[11px] text-gray-500">{acc.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
