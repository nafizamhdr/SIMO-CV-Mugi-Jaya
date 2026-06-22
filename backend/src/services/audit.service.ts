import { prisma } from "../lib/prisma";

/**
 * Audit Trail lintas modul (PIC: Regian).
 * Membaca AuditLog yang ditulis otomatis oleh modul Produksi, QC, & Logistik.
 */

/** Petakan action -> kategori modul untuk pewarnaan & filter di UI. */
function categoryOf(action: string): "Produksi" | "QC" | "Logistik" | "Akses" {
  if (action.includes("WORK_ITEM")) return "Produksi";
  if (action.includes("QC") || action.includes("CERTIFICATE")) return "QC";
  if (action.includes("SHIPMENT") || action.includes("GEOFENCE") || action.includes("CHECKIN")) return "Logistik";
  return "Akses";
}

export async function listAuditLogs(filters: { category?: string; date?: string }) {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true } } },
  });

  const mapped = logs.map((log) => ({
    id: log.id,
    createdAt: log.createdAt,
    user: log.user.name,
    action: log.action,
    category: categoryOf(log.action),
    entity: `${log.entity} ${log.entityId}`,
    before: log.before,
    after: log.after,
  }));

  return mapped.filter((m) => {
    const okCat = !filters.category || filters.category === "all" || m.category === filters.category;
    const okDate = !filters.date || m.createdAt.toISOString().slice(0, 10) === filters.date;
    return okCat && okDate;
  });
}
