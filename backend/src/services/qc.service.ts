import { Prisma, QCStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/apiResponse";
import { evaluateDimensions } from "../utils/businessRules";
import type { DimensionsInput } from "../validators/qc.validator";

/**
 * Modul QC — logika bisnis (PIC: Regian).
 * Evaluasi toleransi dimensi memakai pure function di utils/businessRules.
 */
export { evaluateDimensions };

/** Daftar project (untuk pemilihan batch inspeksi). */
export async function listProjects() {
  return prisma.project.findMany({ select: { id: true, name: true, location: true }, orderBy: { name: "asc" } });
}

// --- Specifications (FR-12) ---

export async function listSpecifications(projectId?: string) {
  return prisma.specification.findMany({
    where: projectId ? { projectId } : {},
    orderBy: { uploadedAt: "desc" },
    include: { project: { select: { id: true, name: true } } },
  });
}

export async function createSpecification(input: {
  projectId: string;
  title: string;
  version?: string;
  fileUrl: string;
}) {
  return prisma.specification.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      version: input.version ?? "1.0",
      fileUrl: input.fileUrl,
    },
  });
}

// --- Inspection items & records (FR-04) ---

/** Daftar work item suatu project beserta status QC terkininya. */
export async function listInspectionItems(projectId: string) {
  const items = await prisma.workItem.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: { qcRecords: { orderBy: { inspectedAt: "desc" }, take: 1 } },
  });

  return items.map((it) => {
    const latest = it.qcRecords[0];
    return {
      id: it.id,
      name: it.name,
      qcStatus: latest ? latest.status : null,
      qcRecordId: latest?.id ?? null,
      photoUrl: latest?.photoUrl ?? null,
    };
  });
}

export async function listRecords() {
  return prisma.qCRecord.findMany({
    orderBy: { inspectedAt: "desc" },
    include: {
      workItem: { select: { id: true, name: true } },
      specification: { select: { id: true, title: true } },
      ncItem: true,
    },
  });
}

export async function createRecord(input: {
  workItemId: string;
  specificationId: string;
  inspectorId: string;
  dimensions: DimensionsInput;
  notes?: string;
  photoUrl?: string;
}) {
  const passed = evaluateDimensions(input.dimensions);
  const status = passed ? QCStatus.PASSED : QCStatus.FAILED;

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.qCRecord.create({
      data: {
        workItemId: input.workItemId,
        specificationId: input.specificationId,
        inspectorId: input.inspectorId,
        status,
        dimensions: { ...input.dimensions, passed },
        notes: input.notes,
        photoUrl: input.photoUrl,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: input.inspectorId,
        action: "CREATE_QC_RECORD",
        entity: "QCRecord",
        entityId: created.id,
        after: { status, workItemId: input.workItemId },
      },
    });
    return created;
  });

  return record;
}

export async function updateRecord(
  id: string,
  inspectorId: string,
  input: { dimensions?: DimensionsInput; notes?: string; photoUrl?: string },
) {
  const existing = await prisma.qCRecord.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "QC record tidak ditemukan");

  const data: Prisma.QCRecordUpdateInput = {};
  if (input.dimensions) {
    const passed = evaluateDimensions(input.dimensions);
    data.status = passed ? QCStatus.PASSED : QCStatus.FAILED;
    data.dimensions = { ...input.dimensions, passed };
  }
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.photoUrl) data.photoUrl = input.photoUrl;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.qCRecord.update({ where: { id }, data });
    await tx.auditLog.create({
      data: {
        userId: inspectorId,
        action: "UPDATE_QC_RECORD",
        entity: "QCRecord",
        entityId: id,
        before: { status: existing.status },
        after: { status: updated.status },
      },
    });
    return updated;
  });
}

// --- Non-Conforming Item (FR-06) ---

export async function createNCItem(input: {
  qcRecordId: string;
  defectDesc: string;
  picRework: string;
  estimatedDone: string;
  photoUrl?: string;
}) {
  const record = await prisma.qCRecord.findUnique({ where: { id: input.qcRecordId } });
  if (!record) throw new HttpError(404, "QC record tidak ditemukan");
  if (record.status !== QCStatus.FAILED) {
    throw new HttpError(400, "NCI hanya untuk QC record berstatus FAILED");
  }

  return prisma.nCItem.upsert({
    where: { qcRecordId: input.qcRecordId },
    update: {
      defectDesc: input.defectDesc,
      picRework: input.picRework,
      estimatedDone: new Date(input.estimatedDone),
      ...(input.photoUrl ? { photoUrl: input.photoUrl } : {}),
    },
    create: {
      qcRecordId: input.qcRecordId,
      defectDesc: input.defectDesc,
      picRework: input.picRework,
      estimatedDone: new Date(input.estimatedDone),
      photoUrl: input.photoUrl,
    },
  });
}

// --- QC Certificate (FR-05) ---

export async function listCertificates() {
  return prisma.qCCertificate.findMany({ orderBy: { issuedAt: "desc" } });
}

export async function issueCertificate(input: { projectId: string; batchIds: string[]; userId: string }) {
  // Validasi: setiap work item dalam batch wajib punya QC record PASSED.
  const records = await prisma.qCRecord.findMany({
    where: { workItemId: { in: input.batchIds }, status: QCStatus.PASSED },
    select: { workItemId: true },
  });
  const passedIds = new Set(records.map((r) => r.workItemId));
  const notPassed = input.batchIds.filter((id) => !passedIds.has(id));
  if (notPassed.length > 0) {
    throw new HttpError(400, `Batch belum lolos QC sepenuhnya: ${notPassed.join(", ")}`);
  }

  const count = await prisma.qCCertificate.count();
  const certNumber = `QC-CERT-2026-${String(92 + count).padStart(4, "0")}`;

  return prisma.$transaction(async (tx) => {
    const cert = await tx.qCCertificate.create({
      data: { certNumber, projectId: input.projectId, batchIds: input.batchIds },
    });
    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "ISSUE_QC_CERTIFICATE",
        entity: "QCCertificate",
        entityId: cert.id,
        after: { certNumber, batchIds: input.batchIds },
      },
    });
    return cert;
  });
}
