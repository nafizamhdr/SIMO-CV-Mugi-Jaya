import { useState, type ReactNode } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { LoginPage } from "./components/LoginPage";
import { Layout } from "./components/Layout";
import { ForbiddenPage } from "./components/ForbiddenPage";
import { DashboardPage } from "./components/DashboardPage";
import { ProduksiPage } from "./components/ProduksiPage";
import { QCPage } from "./components/QCPage";
import { LogistikPage } from "./components/LogistikPage";
import { RepositoriPage } from "./components/RepositoriPage";
import { AuditTrailPage } from "./components/AuditTrailPage";
import { UsersPage } from "./components/UsersPage";
import { ReportsPage } from "./components/ReportsPage";
import { TrackingPage } from "./components/TrackingPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { AcceptInvitePage } from "./components/AcceptInvitePage";
import { DriverTrackingPage } from "./components/DriverTrackingPage";
import { SuratJalanModal } from "./components/SuratJalanModal";
import { type PageKey } from "./components/data";
import type { ShipmentDto } from "../services/logistik.service";
import { useAuth } from "../hooks/useAuth";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import { ROLE_CONFIG, PAGE_PATH, PAGE_ALLOW, menusFor, defaultPageFor } from "./roleConfig";

export default function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  // FR-10 — notifikasi anomali real-time ke Admin/Owner
  useRealtimeNotifications(user?.role);

  const [isOnline, setIsOnline] = useState(true);
  const [suratJalan, setSuratJalan] = useState<ShipmentDto | null>(null);

  const homePath = user ? PAGE_PATH[defaultPageFor(user.role)] : "/login";
  const canUpload = user?.role === "INSPECTOR_QC" || user?.role === "KEPALA_PRODUKSI";

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  function handleToggleConnection() {
    setIsOnline((prev) => {
      const next = !prev;
      toast(next ? "Koneksi online dipulihkan" : "Mode offline diaktifkan", { icon: next ? "✅" : "⚠️" });
      return next;
    });
  }

  // Route guard: cek auth -> role -> render dalam shell Layout.
  function guard(page: PageKey, content: ReactNode) {
    if (isLoading) return null;
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    if (!PAGE_ALLOW[page].includes(user.role)) return <Navigate to="/403" replace />;
    return (
      <Layout
        userName={user.name}
        userShort={ROLE_CONFIG[user.role].short}
        userDesc={ROLE_CONFIG[user.role].desc}
        menus={menusFor(user.role)}
        activePage={page}
        onNavigate={(p) => navigate(PAGE_PATH[p])}
        onLogout={handleLogout}
        isOnline={isOnline}
        onToggleConnection={handleToggleConnection}
      >
        {content}
      </Layout>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to={homePath} replace /> : <LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Publik (tanpa login) */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/driver/:id" element={<DriverTrackingPage />} />

        <Route path="/dashboard" element={guard("dashboard", <DashboardPage />)} />
        <Route path="/produksi" element={guard("produksi", <ProduksiPage />)} />
        <Route path="/qc" element={guard("qc", <QCPage />)} />
        <Route path="/logistik" element={guard("logistik", <LogistikPage onViewSuratJalan={setSuratJalan} />)} />
        <Route path="/repositori" element={guard("repositori", <RepositoriPage canUpload={canUpload} />)} />
        <Route path="/audit" element={guard("audit", <AuditTrailPage />)} />
        <Route path="/akun" element={guard("akun", <UsersPage />)} />
        <Route path="/laporan" element={guard("laporan", <ReportsPage />)} />
        <Route path="/tracking" element={guard("tracking", <TrackingPage />)} />

        <Route path="*" element={<Navigate to={isAuthenticated ? homePath : "/login"} replace />} />
      </Routes>

      {suratJalan && <SuratJalanModal shipment={suratJalan} onClose={() => setSuratJalan(null)} />}

      <Toaster position="top-right" richColors />
    </>
  );
}
