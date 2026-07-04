import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import type { Role } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { extractApiError } from "../../services/api";
import { PAGE_PATH, defaultPageFor } from "../roleConfig";

/** Pilihan role pada form login — divalidasi backend harus cocok dengan akun. */
const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "OWNER", label: "Pemilik (Owner)" },
  { value: "KEPALA_PRODUKSI", label: "Kepala Produksi" },
  { value: "MANDOR", label: "Mandor" },
  { value: "INSPECTOR_QC", label: "Inspector QC" },
  { value: "ADMIN_OPERASIONAL", label: "Admin Operasional" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState<Role | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!role) {
      setError("Silakan pilih role Anda.");
      return;
    }
    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password, role);
      navigate(PAGE_PATH[defaultPageFor(user.role)], { replace: true });
    } catch (err) {
      setError(extractApiError(err, "Gagal masuk. Periksa email & kata sandi."));
    } finally {
      setLoading(false);
    }
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Masuk Sebagai</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role | "")}
                className="w-full h-12 border border-gray-300 rounded-xl px-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm bg-white"
              >
                <option value="">— Pilih Role —</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
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
          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              Lupa kata sandi?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
