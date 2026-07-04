import type { NextFunction, Response } from "express";
import * as reportService from "../services/report.service";
import { toCsv, toPdf } from "../utils/exporters";
import { prisma } from "../lib/prisma";
import { sendSuccess } from "../utils/apiResponse";
import type { AuthRequest } from "../types";

function range(req: AuthRequest) {
  return {
    start: typeof req.query.start === "string" ? req.query.start : undefined,
    end: typeof req.query.end === "string" ? req.query.end : undefined,
  };
}

export async function getTypes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, reportService.listReportTypes(req.user!.role));
  } catch (e) {
    next(e);
  }
}

export async function getPreview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.buildReport(req.params.type, req.user!.role, range(req));
    // Preview dibatasi 100 baris agar ringan.
    sendSuccess(res, { ...report, rows: report.rows.slice(0, 100), totalRows: report.rows.length });
  } catch (e) {
    next(e);
  }
}

async function logExport(req: AuthRequest, type: string, format: string) {
  await prisma.auditLog.create({
    data: {
      userId: req.user!.sub,
      action: "EXPORT_REPORT",
      entity: "Report",
      entityId: type,
      after: { format },
    },
  });
}

export async function exportCsv(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.buildReport(req.params.type, req.user!.role, range(req));
    await logExport(req, req.params.type, "csv");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="laporan-${req.params.type}.csv"`);
    res.send(toCsv(report));
  } catch (e) {
    next(e);
  }
}

export async function exportPdf(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await reportService.buildReport(req.params.type, req.user!.role, range(req));
    await logExport(req, req.params.type, "pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="laporan-${req.params.type}.pdf"`);
    res.send(toPdf(report));
  } catch (e) {
    next(e);
  }
}
