import type { Role } from "../types";
import type { PageKey } from "./components/data";

/**
 * Pemetaan Role (backend) -> tampilan & hak akses menu (RBAC, CLAUDE.md §3).
 * Menentukan menu apa yang muncul di shell dan halaman default tiap role.
 */
export interface RoleConfig {
  short: string;
  desc: string;
  menus: PageKey[];
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  OWNER: { short: "OW", desc: "Pemilik", menus: ["dashboard", "tracking", "laporan", "audit"] },
  KEPALA_PRODUKSI: { short: "PY", desc: "Kepala Produksi", menus: ["dashboard", "produksi", "repositori", "tracking", "laporan", "audit"] },
  MANDOR: { short: "MD", desc: "Mandor", menus: ["produksi"] },
  INSPECTOR_QC: { short: "QC", desc: "Inspector QC", menus: ["qc", "repositori"] },
  ADMIN_OPERASIONAL: { short: "AO", desc: "Admin Operasional", menus: ["logistik"] },
  SUPER_ADMIN: { short: "SA", desc: "Super Admin", menus: ["akun"] },
};

export const PAGE_PATH: Record<PageKey, string> = {
  dashboard: "/dashboard",
  produksi: "/produksi",
  qc: "/qc",
  logistik: "/logistik",
  repositori: "/repositori",
  audit: "/audit",
  akun: "/akun",
  laporan: "/laporan",
  tracking: "/tracking",
};

export const PATH_PAGE: Record<string, PageKey> = Object.entries(PAGE_PATH).reduce(
  (acc, [page, path]) => {
    acc[path] = page as PageKey;
    return acc;
  },
  {} as Record<string, PageKey>,
);

export function menusFor(role: Role): PageKey[] {
  return ROLE_CONFIG[role].menus;
}

export function defaultPageFor(role: Role): PageKey {
  return ROLE_CONFIG[role].menus[0];
}

/** Role yang diizinkan mengakses tiap halaman (untuk route guard -> 403). */
export const PAGE_ALLOW: Record<PageKey, Role[]> = {
  dashboard: ["OWNER", "KEPALA_PRODUKSI"],
  produksi: ["KEPALA_PRODUKSI", "MANDOR"],
  qc: ["INSPECTOR_QC"],
  logistik: ["ADMIN_OPERASIONAL"],
  repositori: ["INSPECTOR_QC", "KEPALA_PRODUKSI"],
  audit: ["OWNER", "KEPALA_PRODUKSI"],
  akun: ["SUPER_ADMIN"],
  laporan: ["OWNER", "KEPALA_PRODUKSI"],
  tracking: ["OWNER", "KEPALA_PRODUKSI"],
};
