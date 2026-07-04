import path from "path";
import fs from "fs";
import { PrismaClient, QCStatus } from "@prisma/client";

/** Tulis PDF contoh sederhana ke uploads/ agar dokumen seed bisa dibuka/unduh. */
function writeSamplePdf(filename: string, title: string): string {
  const uploadDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const target = path.join(uploadDir, filename);
  if (!fs.existsSync(target)) {
    const text = `SIMO - CV Mugi Jaya\\n${title}\\n(Dokumen spesifikasi contoh)`;
    const stream = `BT /F1 14 Tf 60 760 Td (${text.replace(/\n/g, ") Tj 0 -20 Td (")}) Tj ET`;
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [4 0 R] /Count 1 >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>",
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    ];
    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((o, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    fs.writeFileSync(target, pdf);
  }
  return `/uploads/${filename}`;
}

/**
 * Seed Modul QC (PIC: Regian).
 * Data dummy: 2 specification, 5 qc record (mix PASSED/FAILED), 1 NCI, 1 certificate.
 * Bergantung pada data Produksi (work item & inspector) yang sudah di-seed lebih dulu.
 */
export async function seedQC(prisma: PrismaClient): Promise<void> {
  const specifications = [
    { id: "spec-01", projectId: "prj-ikn", title: "Spesifikasi Panel Kaca Tempered", version: "2.0", fileUrl: writeSamplePdf("spec-panel-kaca.pdf", "Spesifikasi Panel Kaca Tempered") },
    { id: "spec-02", projectId: "prj-ikn", title: "Spesifikasi Rangka Aluminium", version: "1.0", fileUrl: writeSamplePdf("spec-rangka-aluminium.pdf", "Spesifikasi Rangka Aluminium") },
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
