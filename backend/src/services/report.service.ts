import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/apiResponse";
import type { Role } from "../types";

/**
 * Report Center — menyusun data laporan operasional untuk preview & export.
 */

export interface ReportResult {
  type: string;
  title: string;
  columns: string[];
  rows: string[][];
  summary: { label: string; value: string | number }[];
  generatedAt: string;
}

export interface ReportTypeInfo {
  type: string;
  label: string;
}

// Tipe laporan yang boleh diakses per role.
const REPORT_TYPES: { type: string; label: string; roles: Role[] }[] = [
  { type: "operational-summary", label: "Ringkasan Operasional", roles: ["OWNER", "KEPALA_PRODUKSI"] },
  { type: "production", label: "Produksi (Work Item)", roles: ["OWNER", "KEPALA_PRODUKSI"] },
  { type: "qc", label: "Quality Control", roles: ["OWNER", "KEPALA_PRODUKSI"] },
  { type: "logistics", label: "Logistik (Pengiriman)", roles: ["OWNER", "KEPALA_PRODUKSI"] },
  { type: "audit", label: "Audit Trail", roles: ["OWNER", "KEPALA_PRODUKSI"] },
];

export function listReportTypes(role: Role): ReportTypeInfo[] {
  return REPORT_TYPES.filter((r) => r.roles.includes(role)).map((r) => ({ type: r.type, label: r.label }));
}

function assertAccess(type: string, role: Role): { type: string; label: string } {
  const def = REPORT_TYPES.find((r) => r.type === type);
  if (!def) throw new HttpError(404, "Jenis laporan tidak dikenal");
  if (!def.roles.includes(role)) throw new HttpError(403, "Anda tidak berhak mengakses laporan ini");
  return def;
}

/** Rentang tanggal opsional; default: sepanjang waktu. */
function dateRange(start?: string, end?: string) {
  const gte = start ? new Date(start) : undefined;
  // Sertakan sepanjang hari 'end'.
  const lte = end ? new Date(new Date(end).setHours(23, 59, 59, 999)) : undefined;
  if (gte && lte && gte > lte) throw new HttpError(422, "Tanggal mulai tidak boleh setelah tanggal akhir");
  const filter: { gte?: Date; lte?: Date } = {};
  if (gte) filter.gte = gte;
  if (lte) filter.lte = lte;
  return Object.keys(filter).length ? filter : undefined;
}

const fmt = (d: Date | null | undefined) => (d ? new Date(d).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-");

export async function buildReport(
  type: string,
  role: Role,
  opts: { start?: string; end?: string },
): Promise<ReportResult> {
  const def = assertAccess(type, role);
  const range = dateRange(opts.start, opts.end);
  const generatedAt = new Date().toISOString();
  const base = { type, title: def.label, generatedAt };

  if (type === "production") {
    const items = await prisma.workItem.findMany({
      where: range ? { updatedAt: range } : {},
      orderBy: { updatedAt: "desc" },
      include: { project: { select: { name: true } }, warehouse: { select: { name: true } } },
    });
    const rows = items.map((i) => [i.name, i.project.name, i.warehouse.name, i.status, fmt(i.updatedAt)]);
    return {
      ...base,
      columns: ["Pekerjaan", "Proyek", "Warehouse", "Status", "Diperbarui"],
      rows,
      summary: [
        { label: "Total pekerjaan", value: items.length },
        { label: "Selesai", value: items.filter((i) => i.status === "DONE").length },
        { label: "Dikerjakan", value: items.filter((i) => i.status === "IN_PROGRESS").length },
        { label: "Belum mulai", value: items.filter((i) => i.status === "TODO").length },
      ],
    };
  }

  if (type === "qc") {
    const records = await prisma.qCRecord.findMany({
      where: range ? { inspectedAt: range } : {},
      orderBy: { inspectedAt: "desc" },
      include: { workItem: { select: { name: true } }, inspector: { select: { name: true } } },
    });
    const rows = records.map((r) => [r.workItem.name, r.inspector.name, r.status, fmt(r.inspectedAt)]);
    return {
      ...base,
      columns: ["Pekerjaan", "Inspektor", "Status", "Waktu Inspeksi"],
      rows,
      summary: [
        { label: "Total inspeksi", value: records.length },
        { label: "Lolos", value: records.filter((r) => r.status === "PASSED").length },
        { label: "Gagal", value: records.filter((r) => r.status === "FAILED").length },
      ],
    };
  }

  if (type === "logistics") {
    const shipments = await prisma.shipment.findMany({
      where: range ? { createdAt: range } : {},
      orderBy: { createdAt: "desc" },
      include: { vendor: { select: { name: true } }, project: { select: { name: true } } },
    });
    const rows = shipments.map((s) => [s.id.slice(-8), s.project.name, s.vendor.name, s.driverName, s.status, fmt(s.departedAt)]);
    return {
      ...base,
      columns: ["ID", "Proyek", "Vendor", "Driver", "Status", "Berangkat"],
      rows,
      summary: [
        { label: "Total pengiriman", value: shipments.length },
        { label: "Sampai", value: shipments.filter((s) => s.status === "DELIVERED").length },
        { label: "Anomali", value: shipments.filter((s) => s.status === "ANOMALY").length },
      ],
    };
  }

  if (type === "audit") {
    const logs = await prisma.auditLog.findMany({
      where: range ? { createdAt: range } : {},
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { user: { select: { name: true } } },
    });
    const rows = logs.map((l) => [fmt(l.createdAt), l.user.name, l.action, `${l.entity} ${l.entityId}`]);
    return {
      ...base,
      columns: ["Waktu", "Pengguna", "Aksi", "Entitas"],
      rows,
      summary: [{ label: "Total aktivitas", value: logs.length }],
    };
  }

  // operational-summary
  const [projects, warehouses, workItems, qc, shipments] = await Promise.all([
    prisma.project.count(),
    prisma.warehouse.count(),
    prisma.workItem.findMany({ select: { status: true } }),
    prisma.qCRecord.findMany({ select: { status: true } }),
    prisma.shipment.findMany({ select: { status: true } }),
  ]);
  const rows: string[][] = [
    ["Proyek", String(projects)],
    ["Warehouse", String(warehouses)],
    ["Total pekerjaan", String(workItems.length)],
    ["Pekerjaan selesai", String(workItems.filter((w) => w.status === "DONE").length)],
    ["QC lolos", String(qc.filter((q) => q.status === "PASSED").length)],
    ["QC gagal", String(qc.filter((q) => q.status === "FAILED").length)],
    ["Total pengiriman", String(shipments.length)],
    ["Pengiriman sampai", String(shipments.filter((s) => s.status === "DELIVERED").length)],
  ];
  return {
    ...base,
    columns: ["Metrik", "Nilai"],
    rows,
    summary: [
      { label: "Proyek", value: projects },
      { label: "Warehouse", value: warehouses },
      { label: "Pekerjaan", value: workItems.length },
    ],
  };
}
