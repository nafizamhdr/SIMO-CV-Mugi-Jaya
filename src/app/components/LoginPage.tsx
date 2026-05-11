import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const ROLES = [
  { key: "owner", short: "OW", name: "Pemilik (Owner)" },
  { key: "kaprod", short: "PY", name: "Kepala Produksi" },
  { key: "mandor", short: "MD", name: "Mandor" },
  { key: "inspector", short: "QC", name: "Inspector QC" },
  { key: "supervisor", short: "PE", name: "Supervisor Lapangan" },
  { key: "admin", short: "AO", name: "Admin Operasional" },
];

interface Props {
  onLogin: (role: string) => void;
}

export function LoginPage({ onLogin }: Props) {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [username, setUsername] = useState("admin_operasional");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [pendingRole, setPendingRole] = useState("admin");

  function handleLogin() {
    const u = username.toLowerCase();
    let role = "admin";
    if (u.includes("owner") || u.includes("pemilik")) role = "owner";
    else if (u.includes("produksi") || u.includes("yudi")) role = "kaprod";
    else if (u.includes("mandor")) role = "mandor";
    else if (u.includes("qc") || u.includes("inspector")) role = "inspector";
    else if (u.includes("edi") || u.includes("supervisor")) role = "supervisor";
    setPendingRole(role);
    setStep("otp");
  }

  function handleOtpChange(idx: number, val: string) {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 3) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      nextInput?.focus();
    }
    if (idx === 3 && val) {
      setTimeout(() => onLogin(pendingRole), 300);
    }
  }

  function handleQuickLogin(role: string) {
    onLogin(role);
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: "#f4f6f9",
      }}
    >
      {/* Left panel */}
      <div
        className="hidden md:flex w-1/2 flex-col justify-between p-14 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(150deg,#1F3864 0%,#16284a 60%,#0d1b33 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-5"
          style={{ background: "#fff" }}
        />
        <div
          className="absolute bottom-20 -left-10 w-60 h-60 rounded-full opacity-5"
          style={{ background: "#fff" }}
        />

        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-xl"
            style={{
              background: "linear-gradient(135deg,#FFA500,#ff8c00)",
              color: "#1F3864",
            }}
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
            {["Real-time Monitoring", "Live Tracking", "Digital QC"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  {tag}
                </span>
              ),
            )}
          </div>
          <div className="flex gap-6 mt-10">
            {[
              { val: "6+", label: "Warehouse" },
              { val: "98%", label: "Uptime" },
              { val: "2.4k", label: "Log/Bulan" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold">{s.val}</div>
                <div className="text-xs mt-0.5" style={{ color: "#93c5fd" }}>
                  {s.label}
                </div>
              </div>
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
          {step === "credentials" ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Selamat Datang
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Masuk untuk melanjutkan ke dashboard Anda
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-12 border border-gray-300 rounded-xl px-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 border border-gray-300 rounded-xl px-4 pr-12 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogin}
                className="mt-6 w-full h-12 rounded-xl text-white font-bold text-sm"
                style={{
                  background: "linear-gradient(135deg,#1F3864,#2E5FA3)",
                }}
              >
                Masuk ke Dashboard
              </button>

              <div className="mt-8">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Quick Login (Demo)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => handleQuickLogin(r.key)}
                      className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition"
                    >
                      <div className="text-xs font-bold text-gray-800">
                        {r.short}
                      </div>
                      <div className="text-[11px] text-gray-500">{r.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Verifikasi OTP
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Masukkan 4 digit kode (demo: angka apa pun)
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                {otp.map((val, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-600 outline-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                ))}
              </div>

              <button
                onClick={() => onLogin(pendingRole)}
                className="mt-8 w-full h-12 rounded-xl text-white font-bold"
                style={{
                  background: "linear-gradient(135deg,#1F3864,#2E5FA3)",
                }}
              >
                Verifikasi
              </button>
              <button
                onClick={() => setStep("credentials")}
                className="mt-3 w-full h-11 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm"
              >
                Kembali
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
