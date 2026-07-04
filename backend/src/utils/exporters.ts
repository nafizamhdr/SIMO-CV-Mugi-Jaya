import type { ReportResult } from "../services/report.service";

/**
 * Exporter laporan ke CSV & PDF — tanpa dependency eksternal.
 */

// --- CSV ---
function csvCell(value: string): string {
  // Cegah formula/DDE injection: sel yang diawali = + - @ (atau tab/CR)
  // bisa dieksekusi sebagai formula di Excel/Sheets. Netralkan dengan prefix "'".
  let safe = value;
  if (/^[=+\-@\t\r]/.test(safe)) safe = `'${safe}`;
  if (/[",\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export function toCsv(report: ReportResult): string {
  const lines: string[][] = [report.columns, ...report.rows];
  const body = lines.map((line) => line.map(csvCell).join(",")).join("\n");
  const meta = `Laporan:,${csvCell(report.title)}\nDibuat:,${csvCell(new Date(report.generatedAt).toLocaleString("id-ID"))}\n\n`;
  return meta + body;
}

// --- PDF (PDF 1.4 minimal, hand-crafted) ---
function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Ubah satu baris tabel jadi teks (kolom dipisah " | "), lalu potong ke lebar maksimum. */
function rowToLine(cells: string[], widthChars = 95): string {
  const line = cells.join("  |  ");
  return line.length > widthChars ? line.slice(0, widthChars - 1) + "…" : line;
}

export function toPdf(report: ReportResult): Buffer {
  const headerLines = [
    "SIMO — CV Mugi Jaya",
    report.title,
    `Dibuat: ${new Date(report.generatedAt).toLocaleString("id-ID")}`,
    "",
    rowToLine(report.columns),
    "".padEnd(95, "-"),
  ];
  const bodyLines = report.rows.map((r) => rowToLine(r));
  const summaryLines = ["", "Ringkasan:", ...report.summary.map((s) => `- ${s.label}: ${s.value}`)];
  const allLines = [...headerLines, ...bodyLines, ...summaryLines];

  // Bagi ke halaman (maks 52 baris/halaman).
  const perPage = 52;
  const pages: string[][] = [];
  for (let i = 0; i < allLines.length; i += perPage) {
    pages.push(allLines.slice(i, i + perPage));
  }
  if (pages.length === 0) pages.push([""]);

  const objects: string[] = [];
  // 1: Catalog, 2: Pages, 3: Font
  const fontObj = 3;
  const pageObjStart = 4;
  const contentObjStart = pageObjStart + pages.length;

  const kids = pages.map((_, i) => `${pageObjStart + i} 0 R`).join(" ");
  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
  objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";

  pages.forEach((lines, i) => {
    const contentRef = contentObjStart + i;
    objects[pageObjStart - 1 + i] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentRef} 0 R >>`;

    const text = lines
      .map((line, idx) => (idx === 0 ? `(${pdfEscape(line)}) Tj` : `0 -14 Td (${pdfEscape(line)}) Tj`))
      .join("\n");
    const stream = `BT /F1 9 Tf 40 800 Td\n${text}\nET`;
    objects[contentObjStart - 1 + i] = `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`;
  });

  // Rakit file + xref.
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((o) => `${String(o).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}
