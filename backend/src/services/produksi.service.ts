import { WorkItemStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/apiResponse";
import type { Role } from "../types";

/**
 * Modul Produksi — logika bisnis (PIC: Nafiza).
 */

/** Daftar warehouse: MANDOR hanya miliknya, role lain melihat semua. */
export async function listWarehouses(userId: string, role: Role) {
  const where = role === "MANDOR" ? { mandorId: userId } : {};
  return prisma.warehouse.findMany({
    where,
    orderBy: { name: "asc" },
    include: { mandor: { select: { id: true, name: true } } },
  });
}

/** Daftar work item per warehouse. */
export async function listWorkItems(warehouseId: string) {
  return prisma.workItem.findMany({
    where: { warehouseId },
    orderBy: { createdAt: "asc" },
    include: { project: { select: { id: true, name: true } } },
  });
}

interface UpdateStatusArgs {
  workItemId: string;
  status: WorkItemStatus;
  photoUrl?: string;
  userId: string;
}

/**
 * Update status work item (FR-01). Mencatat AuditLog otomatis.
 * Mengembalikan work item terbaru untuk di-emit lewat WebSocket.
 */
export async function updateWorkItemStatus({ workItemId, status, photoUrl, userId }: UpdateStatusArgs) {
  const existing = await prisma.workItem.findUnique({ where: { id: workItemId } });
  if (!existing) {
    throw new HttpError(404, "Work item tidak ditemukan");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.workItem.update({
      where: { id: workItemId },
      data: {
        status,
        ...(photoUrl ? { photoUrl } : {}),
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "UPDATE_WORK_ITEM_STATUS",
        entity: "WorkItem",
        entityId: workItemId,
        before: { status: existing.status, photoUrl: existing.photoUrl },
        after: { status: item.status, photoUrl: item.photoUrl },
      },
    });

    return item;
  });

  return updated;
}

/**
 * Agregasi progres produksi per project & warehouse (FR-02).
 * Progress = persentase work item berstatus DONE.
 */
export async function getDashboard() {
  const [projects, warehouses, workItems] = await Promise.all([
    prisma.project.findMany({ select: { id: true, name: true, location: true } }),
    prisma.warehouse.findMany({ select: { id: true, name: true } }),
    prisma.workItem.findMany({ select: { id: true, status: true, projectId: true, warehouseId: true } }),
  ]);

  const tally = (items: { status: WorkItemStatus }[]) => {
    const total = items.length;
    const done = items.filter((i) => i.status === "DONE").length;
    const inProgress = items.filter((i) => i.status === "IN_PROGRESS").length;
    const todo = items.filter((i) => i.status === "TODO").length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, inProgress, todo, progress };
  };

  const projectStats = projects.map((p) => ({
    ...p,
    ...tally(workItems.filter((w) => w.projectId === p.id)),
  }));

  const warehouseStats = warehouses.map((wh) => ({
    ...wh,
    ...tally(workItems.filter((w) => w.warehouseId === wh.id)),
  }));

  return {
    summary: tally(workItems),
    projects: projectStats,
    warehouses: warehouseStats,
  };
}
