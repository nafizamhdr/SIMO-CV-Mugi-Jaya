import { ReactNode } from "react";
import {
  LayoutDashboard,
  SlidersHorizontal,
  CheckCircle2,
  Truck,
  FileText,
  Shield,
  Users,
  LogOut,
} from "lucide-react";
import type { PageKey } from "./data";
import { MENU_DEF } from "./data";

const PAGE_ICONS: Record<PageKey, ReactNode> = {
  dashboard: <LayoutDashboard size={16} />,
  produksi: <SlidersHorizontal size={16} />,
  qc: <CheckCircle2 size={16} />,
  logistik: <Truck size={16} />,
  repositori: <FileText size={16} />,
  audit: <Shield size={16} />,
  akun: <Users size={16} />,
};

interface LayoutProps {
  userName: string;
  userShort: string;
  userDesc: string;
  menus: PageKey[];
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
  children: ReactNode;
  isOnline: boolean;
  onToggleConnection: () => void;
}

export function Layout({
  userName,
  userShort,
  userDesc,
  menus,
  activePage,
  onNavigate,
  onLogout,
  children,
  isOnline,
  onToggleConnection,
}: LayoutProps) {
  const pageInfo = MENU_DEF[activePage];

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: "#f4f6f9",
      }}
    >
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-white text-sm"
            style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}
          >
            M
          </div>
          <div>
            <div className="font-extrabold text-gray-900 leading-none text-sm">
              SIMO
            </div>
            <div className="text-[11px] text-gray-400">CV Mugi Jaya</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menus.map((page) => {
            const active = page === activePage;
            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-colors"
                style={{
                  background: active ? "#1F3864" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                }}
              >
                <span style={{ color: active ? "#fff" : "#9ca3af" }}>
                  {PAGE_ICONS[page]}
                </span>
                {MENU_DEF[page].label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 hover:bg-gray-50 font-semibold text-sm"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
          <div>
            <h2
              className="font-extrabold text-gray-900"
              style={{ fontSize: "1rem" }}
            >
              {pageInfo.title}
            </h2>
            <p className="text-xs text-gray-400">{pageInfo.sub}</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {/* Connection toggle */}
            <button
              onClick={onToggleConnection}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: isOnline ? "#4ade80" : "#ef4444" }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: isOnline ? "#16a34a" : "#dc2626" }}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </button>

            {/* User */}
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                style={{ background: "#1e3a5f" }}
              >
                {userShort}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-gray-800 leading-none">
                  {userName}
                </div>
                <div className="text-[11px] text-gray-400">{userDesc}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
