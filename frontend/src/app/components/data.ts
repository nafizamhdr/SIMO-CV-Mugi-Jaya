export type RoleKey =
  | "owner"
  | "kaprod"
  | "mandor"
  | "inspector"
  | "supervisor"
  | "admin";
export type PageKey =
  | "dashboard"
  | "produksi"
  | "qc"
  | "logistik"
  | "repositori"
  | "audit"
  | "akun";

export interface User {
  roleKey: RoleKey;
  name: string;
  short: string;
  desc: string;
  menus: PageKey[];
}

export const ROLES: Record<
  RoleKey,
  { name: string; short: string; desc: string; menus: PageKey[] }
> = {
  owner: {
    name: "Pemilik (Owner)",
    short: "OW",
    desc: "Pengambil Keputusan",
    menus: ["dashboard", "audit"],
  },
  kaprod: {
    name: "Kepala Produksi",
    short: "PY",
    desc: "Pak Yudi",
    menus: ["dashboard", "audit"],
  },
  mandor: {
    name: "Mandor",
    short: "MD",
    desc: "Operator Produksi",
    menus: ["produksi"],
  },
  inspector: {
    name: "Inspector QC",
    short: "QC",
    desc: "Operator QC",
    menus: ["qc", "repositori"],
  },
  supervisor: {
    name: "Supervisor Lapangan",
    short: "PE",
    desc: "Pak Edi",
    menus: ["qc", "repositori", "audit"],
  },
  admin: {
    name: "Admin Operasional",
    short: "AO",
    desc: "Monitor Logistik",
    menus: ["logistik", "audit"],
  },
};

export const MENU_DEF: Record<
  PageKey,
  { label: string; title: string; sub: string }
> = {
  dashboard: {
    label: "Dashboard",
    title: "Dashboard Monitoring Produksi",
    sub: "Pantau progres seluruh warehouse real-time",
  },
  produksi: {
    label: "Input Produksi",
    title: "Input Status Produksi",
    sub: "Perbarui progres pekerjaan",
  },
  qc: {
    label: "Quality Control",
    title: "Quality Control — Gate-Out",
    sub: "Inspeksi sebelum pengiriman",
  },
  logistik: {
    label: "Logistik & Tracking",
    title: "Logistik & Live Tracking",
    sub: "Manifest & pelacakan armada",
  },
  repositori: {
    label: "Repositori Spesifikasi",
    title: "Repositori Spesifikasi & Blueprint",
    sub: "Dokumen teknis per proyek (cloud)",
  },
  audit: {
    label: "Audit Trail",
    title: "Audit Trail",
    sub: "Log aktivitas sistem",
  },
  akun: {
    label: "Manajemen Akun",
    title: "Manajemen Akun Pengguna",
    sub: "Kelola akun & hak akses karyawan",
  },
};

export interface Warehouse {
  id: string;
  nama: string;
  mandor: string;
  progress: number;
  status: "Done" | "In-Progress" | "Tertunda" | "To-Do";
}

export const initWarehouses = (): Warehouse[] => [
  {
    id: "WH-01",
    nama: "Partisi Ruangan",
    mandor: "Cecep",
    progress: 100,
    status: "Done",
  },
  {
    id: "WH-03",
    nama: "Rangka Aluminium",
    mandor: "Asep",
    progress: 80,
    status: "In-Progress",
  },
  {
    id: "WH-05",
    nama: "Panel Kaca",
    mandor: "Budi",
    progress: 40,
    status: "In-Progress",
  },
  {
    id: "WH-07",
    nama: "Kusen Aluminium",
    mandor: "Dadan",
    progress: 25,
    status: "Tertunda",
  },
  {
    id: "WH-02",
    nama: "Pintu Geser",
    mandor: "Eko",
    progress: 60,
    status: "In-Progress",
  },
  {
    id: "WH-04",
    nama: "Railing Tangga",
    mandor: "Fajar",
    progress: 15,
    status: "To-Do",
  },
];

export interface QCItem {
  nama: string;
  hasil: "Pass" | "Fail" | "Pending";
}
export interface QCBatch {
  id: string;
  produk: string;
  proyek: string;
  spec: { p: [number, number]; l: [number, number]; t: [number, number] };
  items: QCItem[];
  certificate: string | null;
}

export const initQCBatches = (): QCBatch[] => [
  {
    id: "BTH-2026-0142",
    produk: "Panel Kaca",
    proyek: "Fasad IKN",
    spec: { p: [239, 241], l: [119, 121], t: [11, 13] },
    items: [
      { nama: "Panel A", hasil: "Pass" },
      { nama: "Panel B", hasil: "Pass" },
      { nama: "Panel C", hasil: "Pending" },
      { nama: "Panel D", hasil: "Pending" },
      { nama: "Panel E", hasil: "Pending" },
    ],
    certificate: null,
  },
  {
    id: "BTH-2026-0140",
    produk: "Rangka Aluminium",
    proyek: "Fasad IKN",
    spec: { p: [199, 201], l: [99, 101], t: [4, 6] },
    items: [
      { nama: "Rangka 1", hasil: "Pass" },
      { nama: "Rangka 2", hasil: "Pass" },
    ],
    certificate: "QC-CERT-2026-0091",
  },
];

export interface Vendor {
  id: string;
  nama: string;
  rating: number;
  inAVL: boolean;
  hasGPS: boolean;
}
export const vendors: Vendor[] = [
  {
    id: "V-01",
    nama: "PT Logistik Mandiri",
    rating: 4.8,
    inAVL: true,
    hasGPS: true,
  },
  { id: "V-02", nama: "CV Trans Jaya", rating: 4.5, inAVL: true, hasGPS: true },
  {
    id: "V-03",
    nama: "PT Armada Nusa",
    rating: 4.1,
    inAVL: true,
    hasGPS: false,
  },
];

export interface Shipment {
  id: string;
  vendor: string;
  tujuan: string;
  status: "Normal" | "Anomali" | "Check-in";
  polis: string;
  driver: string;
  plate: string;
  cert?: string;
  suratJalan?: string;
  locked: boolean;
}

export const initShipments = (): Shipment[] => [
  {
    id: "SHIP-2026-0079",
    vendor: "CV Trans Jaya",
    tujuan: "Proyek Waskita",
    status: "Normal",
    polis: "POL-2026-100231",
    locked: true,
    driver: "Slamet R.",
    plate: "B 9087 KJ",
    cert: "QC-CERT-2026-0090",
    suratJalan: "SJ-2026-0079",
  },
];

export interface Document {
  id: string;
  proyek: string;
  material: string;
  kode: string;
  tipe: "Blueprint" | "Spesifikasi";
  versions: { v: string; tanggal: string; oleh: string; catatan: string }[];
}

export const initDocuments = (): Document[] => [
  {
    id: "DOC-001",
    proyek: "Fasad IKN",
    material: "Panel Kaca Tempered",
    kode: "PRJ-IKN-001",
    tipe: "Blueprint",
    versions: [
      {
        v: "v1",
        tanggal: "10 Jan 2026",
        oleh: "Kepala Produksi",
        catatan: "Rilis awal",
      },
      {
        v: "v2",
        tanggal: "02 Feb 2026",
        oleh: "Kepala Produksi",
        catatan: "Revisi dimensi panel",
      },
      {
        v: "v3",
        tanggal: "18 Feb 2026",
        oleh: "Kepala Produksi",
        catatan: "Penyesuaian toleransi tebal",
      },
    ],
  },
  {
    id: "DOC-002",
    proyek: "Fasad IKN",
    material: "Rangka Aluminium",
    kode: "PRJ-IKN-001",
    tipe: "Spesifikasi",
    versions: [
      {
        v: "v1",
        tanggal: "12 Jan 2026",
        oleh: "Kepala Produksi",
        catatan: "Rilis awal",
      },
      {
        v: "v2",
        tanggal: "05 Feb 2026",
        oleh: "Kepala Produksi",
        catatan: "Update profil rangka",
      },
    ],
  },
  {
    id: "DOC-003",
    proyek: "Proyek Waskita",
    material: "Partisi Ruangan",
    kode: "PRJ-WSK-007",
    tipe: "Blueprint",
    versions: [
      {
        v: "v1",
        tanggal: "20 Des 2025",
        oleh: "Kepala Produksi",
        catatan: "Rilis awal",
      },
    ],
  },
];

export interface AuditEntry {
  waktu: string;
  tgl: string;
  user: string;
  aksi: string;
  entitas: string;
  sebelum: string;
  sesudah: string;
}

export const initAuditTrail = (): AuditEntry[] => [
  {
    waktu: "24 Mei, 08:00",
    tgl: "2026-05-24",
    user: "Mandor Asep",
    aksi: "Produksi",
    entitas: "WH-03",
    sebelum: "To-Do",
    sesudah: "In-Progress",
  },
  {
    waktu: "24 Mei, 08:30",
    tgl: "2026-05-24",
    user: "Inspector QC",
    aksi: "QC",
    entitas: "Batch BTH-2026-0140",
    sebelum: "Pending",
    sesudah: "Pass",
  },
  {
    waktu: "24 Mei, 09:15",
    tgl: "2026-05-24",
    user: "Admin Operasional",
    aksi: "Logistik",
    entitas: "SHIP-2026-0079",
    sebelum: "Draft",
    sesudah: "Dispatched",
  },
  {
    waktu: "24 Mei, 09:45",
    tgl: "2026-05-24",
    user: "Inspector QC",
    aksi: "QC",
    entitas: "Certificate BTH-2026-0140",
    sebelum: "Belum terbit",
    sesudah: "QC-CERT-2026-0091",
  },
  {
    waktu: "24 Mei, 10:00",
    tgl: "2026-05-24",
    user: "Mandor Budi",
    aksi: "Produksi",
    entitas: "WH-05",
    sebelum: "To-Do",
    sesudah: "In-Progress",
  },
];
