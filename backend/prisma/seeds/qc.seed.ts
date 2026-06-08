import { PrismaClient, QCStatus } from "@prisma/client";

/**
 * Seed Modul QC (PIC: Regian).
 * Data dummy: 2 specification, 5 qc record (mix PASSED/FAILED), 1 NCI, 1 certificate.
 * Bergantung pada data Produksi (work item & inspector) yang sudah di-seed lebih dulu.
 */
export async function seedQC(prisma: PrismaClient): Promise<void> {
  const specifications = [
    { id: "spec-01", projectId: "prj-ikn", title: "Spesifikasi Panel Kaca Tempered", version: "2.0", fileUrl: "s3://simo/specs/panel-kaca-v2.pdf" },
    { id: "spec-02", projectId: "prj-ikn", title: "Spesifikasi Rangka Aluminium", version: "1.0", fileUrl: "s3://simo/specs/rangka-aluminium-v1.pdf" },
  ];

  for (const s of specifications) {
    await prisma.specification.upsert({ where: { id: s.id }, update: s, create: s });
  }

  const dims = (passed: boolean) => ({
    actual: { p: 240, l: 120, t: passed ? 12 : 15 },
    tolerance: { p: [239, 241], l: [119, 121], t: [11, 13] },
    passed,
  });

  const records = [
    { id: "qc-01", workItemId: "wi-01", specificationId: "spec-01", status: QCStatus.PASSED, passed: true },
    { id: "qc-02", workItemId: "wi-02", specificationId: "spec-01", status: QCStatus.PASSED, passed: true },
    { id: "qc-03", workItemId: "wi-03", specificationId: "spec-02", status: QCStatus.PASSED, passed: true },
    { id: "qc-04", workItemId: "wi-05", specificationId: "spec-01", status: QCStatus.FAILED, passed: false },
    { id: "qc-05", workItemId: "wi-06", specificationId: "spec-01", status: QCStatus.PENDING, passed: false },
  ];

  for (const r of records) {
    await prisma.qCRecord.upsert({
      where: { id: r.id },
      update: { status: r.status, dimensions: dims(r.passed) },
      create: {
        id: r.id,
        workItemId: r.workItemId,
        specificationId: r.specificationId,
        inspectorId: "usr-inspector",
        status: r.status,
        dimensions: dims(r.passed),
        notes: r.status === QCStatus.FAILED ? "Tebal di luar toleransi" : undefined,
      },
    });
  }

  // Non-Conforming Item untuk record yang FAILED (qc-04)
  await prisma.nCItem.upsert({
    where: { qcRecordId: "qc-04" },
    update: {},
    create: {
      qcRecordId: "qc-04",
      defectDesc: "Ketebalan panel 15mm melebihi toleransi maksimum 13mm",
      picRework: "Mandor Asep",
      estimatedDone: new Date("2026-06-15"),
    },
  });

  // QC Certificate untuk batch yang lolos
  await prisma.qCCertificate.upsert({
    where: { id: "cert-01" },
    update: {},
    create: {
      id: "cert-01",
      certNumber: "QC-CERT-2026-0091",
      projectId: "prj-ikn",
      batchIds: ["wi-01", "wi-02", "wi-03"],
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✓ QC: ${specifications.length} specification, ${records.length} qc record, 1 NCI, 1 certificate`);
}
