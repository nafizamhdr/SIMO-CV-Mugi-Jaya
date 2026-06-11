import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { PAGE_PATH, defaultPageFor } from "../roleConfig";

/**
 * Halaman 403 Forbidden — ditampilkan saat role tidak berhak mengakses rute
 * (BUKAN redirect ke login, sesuai aturan RBAC CLAUDE.md §3).
 */
export function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goHome = () => {
    if (user) navigate(PAGE_PATH[defaultPageFor(user.role)], { replace: true });
    else navigate("/login", { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f4f6f9" }}
    >
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "#fee2e2", color: "#dc2626" }}
        >
          <ShieldAlert size={32} />
        </div>
        <div className="text-5xl font-extrabold text-gray-900">403</div>
        <h1 className="mt-2 text-xl font-bold text-gray-800">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-gray-500">
          Peran Anda tidak memiliki izin untuk membuka halaman ini. Silakan kembali ke halaman utama Anda.
        </p>
        <button
          onClick={goHome}
          className="mt-6 h-11 px-6 rounded-xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
