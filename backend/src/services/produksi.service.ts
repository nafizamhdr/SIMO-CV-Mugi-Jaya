import { WorkItemStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/apiResponse";
import { tallyWorkItems } from "../utils/businessRules";
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

/**
 * Daftar work item per warehouse.
 * MANDOR hanya boleh melihat warehouse miliknya (otorisasi level objek).
 */
export async function listWorkItems(warehouseId: string, userId: string, role: Role) {
  if (role === "MANDOR") {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId }, select: { mandorId: true } });
    if (!warehouse || warehouse.mandorId !== userId) {
      throw new HttpError(403, "Anda tidak memiliki akses ke warehouse ini");
    }
  }
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
  role: Role;
}

/**
 * Update status work item (FR-01). Mencatat AuditLog otomatis.
 * Mengembalikan work item terbaru untuk di-emit lewat WebSocket.
 * MANDOR hanya boleh mengubah work item di warehouse miliknya.
 */
export async function updateWorkItemStatus({ workItemId, status, photoUrl, userId, role }: UpdateStatusArgs) {
  const existing = await prisma.workItem.findUnique({
    where: { id: workItemId },
    include: { warehouse: { select: { mandorId: true } } },
  });
  if (!existing) {
    throw new HttpError(404, "Work item tidak ditemukan");
  }
  if (role === "MANDOR" && existing.warehouse.mandorId !== userId) {
    throw new HttpError(403, "Anda tidak memiliki akses ke pekerjaan ini");
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
 * Notifikasi keterlambatan produksi (FR-03).
 * Work item dianggap terlambat bila belum DONE dan tidak ada pembaruan
 * melewati ambang batas (default 48 jam).
 */
export async function getLateWorkItems(thresholdHours = 48) {
  const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
  const items = await prisma.workItem.findMany({
    where: { status: { not: "DONE" }, updatedAt: { lt: threshold } },
    orderBy: { updatedAt: "asc" },
    include: {
      warehouse: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return items.map((it) => ({
    id: it.id,
    name: it.name,
    status: it.status,
    warehouse: it.warehouse.name,
    project: it.project.name,
    updatedAt: it.updatedAt,
    hoursLate: Math.floor((Date.now() - it.updatedAt.getTime()) / (60 * 60 * 1000)),
  }));
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

  const projectStats = projects.map((p) => ({
    ...p,
    ...tallyWorkItems(workItems.filter((w) => w.projectId === p.id)),
  }));

  const warehouseStats = warehouses.map((wh) => ({
    ...wh,
    ...tallyWorkItems(workItems.filter((w) => w.warehouseId === wh.id)),
  }));

  return {
    summary: tallyWorkItems(workItems),
    projects: projectStats,
    warehouses: warehouseStats,
  };
}

/** Daftar proyek. */
export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/** Daftar user dengan role MANDOR yang aktif. */
export async function listMandors() {
  return prisma.user.findMany({
    where: { role: "MANDOR", isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

/** Buat proyek baru. */
export async function createProject(data: { name: string; location: string; startDate: string; endDate?: string }, userId: string) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: data.name,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CREATE_PROJECT",
        entity: "Project",
        entityId: project.id,
        after: { name: project.name, location: project.location },
      },
    });

    return project;
  });
}

/** Buat warehouse baru. */
export async function createWarehouse(data: { name: string; location: string; mandorId: string }, userId: string) {
  // Validate mandor
  const mandor = await prisma.user.findFirst({
    where: { id: data.mandorId, role: "MANDOR" },
  });
  if (!mandor) {
    throw new HttpError(400, "User mandor tidak valid atau tidak ditemukan");
  }

  return prisma.$transaction(async (tx) => {
    const warehouse = await tx.warehouse.create({
      data,
      include: { mandor: { select: { id: true, name: true } } },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CREATE_WAREHOUSE",
        entity: "Warehouse",
        entityId: warehouse.id,
        after: { name: warehouse.name, location: warehouse.location, mandorId: warehouse.mandorId },
      },
    });

    return warehouse;
  });
}

/** Ubah proyek. */
export async function updateProject(
  id: string,
  data: { name?: string; location?: string; startDate?: string; endDate?: string | null },
  userId: string,
) {
  const before = await prisma.project.findUnique({ where: { id } });
  if (!before) throw new HttpError(404, "Proyek tidak ditemukan");

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.startDate !== undefined ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate ? new Date(data.endDate) : null } : {}),
      },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "UPDATE_PROJECT",
        entity: "Project",
        entityId: id,
        before: { name: before.name, location: before.location },
        after: { name: project.name, location: project.location },
      },
    });
    return project;
  });
}

/** Hapus proyek — hanya bila belum dipakai work item / spesifikasi / shipment. */
export async function deleteProject(id: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new HttpError(404, "Proyek tidak ditemukan");

  const [wi, spec, ship] = await Promise.all([
    prisma.workItem.count({ where: { projectId: id } }),
    prisma.specification.count({ where: { projectId: id } }),
    prisma.shipment.count({ where: { projectId: id } }),
  ]);
  if (wi + spec + ship > 0) {
    throw new HttpError(409, `Proyek tidak dapat dihapus karena masih dipakai (${wi} pekerjaan, ${spec} spesifikasi, ${ship} pengiriman)`);
  }

  await prisma.$transaction([
    prisma.project.delete({ where: { id } }),
    prisma.auditLog.create({
      data: { userId, action: "DELETE_PROJECT", entity: "Project", entityId: id, before: { name: project.name } },
    }),
  ]);
}

/** Ubah warehouse. */
export async function updateWarehouse(
  id: string,
  data: { name?: string; location?: string; mandorId?: string },
  userId: string,
) {
  const before = await prisma.warehouse.findUnique({ where: { id } });
  if (!before) throw new HttpError(404, "Warehouse tidak ditemukan");

  if (data.mandorId) {
    const mandor = await prisma.user.findFirst({ where: { id: data.mandorId, role: "MANDOR" } });
    if (!mandor) throw new HttpError(400, "User mandor tidak valid");
  }

  return prisma.$transaction(async (tx) => {
    const warehouse = await tx.warehouse.update({
      where: { id },
      data,
      include: { mandor: { select: { id: true, name: true } } },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "UPDATE_WAREHOUSE",
        entity: "Warehouse",
        entityId: id,
        before: { name: before.name, location: before.location },
        after: { name: warehouse.name, location: warehouse.location },
      },
    });
    return warehouse;
  });
}

/** Hapus warehouse — hanya bila belum dipakai work item. */
export async function deleteWarehouse(id: string, userId: string) {
  const warehouse = await prisma.warehouse.findUnique({ where: { id } });
  if (!warehouse) throw new HttpError(404, "Warehouse tidak ditemukan");

  const wi = await prisma.workItem.count({ where: { warehouseId: id } });
  if (wi > 0) {
    throw new HttpError(409, `Warehouse tidak dapat dihapus karena masih dipakai ${wi} pekerjaan`);
  }

  await prisma.$transaction([
    prisma.warehouse.delete({ where: { id } }),
    prisma.auditLog.create({
      data: { userId, action: "DELETE_WAREHOUSE", entity: "Warehouse", entityId: id, before: { name: warehouse.name } },
    }),
  ]);
}

/** Buat pekerjaan (work item) baru. */
export async function createWorkItem(data: { name: string; description?: string; projectId: string; warehouseId: string; assigneeId?: string }, userId: string) {
  // Validate project and warehouse
  const [project, warehouse] = await Promise.all([
    prisma.project.findUnique({ where: { id: data.projectId } }),
    prisma.warehouse.findUnique({ where: { id: data.warehouseId } }),
  ]);

  if (!project) throw new HttpError(400, "Proyek tidak valid");
  if (!warehouse) throw new HttpError(400, "Warehouse tidak valid");

  return prisma.$transaction(async (tx) => {
    const item = await tx.workItem.create({
      data: {
        ...data,
        status: "TODO",
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CREATE_WORK_ITEM",
        entity: "WorkItem",
        entityId: item.id,
        after: { name: item.name, status: item.status, projectId: item.projectId, warehouseId: item.warehouseId },
      },
    });

    return item;
  });
}
