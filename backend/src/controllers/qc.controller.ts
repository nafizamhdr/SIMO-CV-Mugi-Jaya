import type { NextFunction, Response } from "express";
import * as qc from "../services/qc.service";
import {
  createRecordSchema,
  updateRecordSchema,
  createSpecSchema,
  ncItemSchema,
  certificateSchema,
} from "../validators/qc.validator";
import { publicUrl } from "../middleware/upload.middleware";
import { sendSuccess } from "../utils/apiResponse";
import { HttpError } from "../utils/apiResponse";
import type { AuthRequest } from "../types";

/** Parse field JSON yang dikirim sebagai string (multipart/form-data). */
function parseJsonField(body: Record<string, unknown>, key: string): void {
  if (typeof body[key] === "string") {
    try {
      body[key] = JSON.parse(body[key] as string);
    } catch {
      throw new HttpError(422, `Field ${key} bukan JSON yang valid`);
    }
  }
}

export async function getProjects(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await qc.listProjects());
  } catch (e) {
    next(e);
  }
}

// --- Specifications (FR-12) ---
export async function getSpecifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
    sendSuccess(res, await qc.listSpecifications(projectId));
  } catch (e) {
    next(e);
  }
}

export async function createSpecification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { projectId, title, version } = createSpecSchema.parse(req.body);
    if (!req.file) throw new HttpError(422, "File spesifikasi wajib diunggah");
    const spec = await qc.createSpecification({ projectId, title, version, fileUrl: publicUrl(req.file.filename) });
    sendSuccess(res, spec, "Spesifikasi diunggah", 201);
  } catch (e) {
    next(e);
  }
}

// --- Inspection items & records (FR-04) ---
export async function getInspectionItems(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
    if (!projectId) throw new HttpError(422, "projectId wajib diisi");
    sendSuccess(res, await qc.listInspectionItems(projectId));
  } catch (e) {
    next(e);
  }
}

export async function getRecords(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await qc.listRecords());
  } catch (e) {
    next(e);
  }
}

export async function createRecord(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    parseJsonField(req.body, "dimensions");
    const input = createRecordSchema.parse(req.body);
    const photoUrl = req.file ? publicUrl(req.file.filename) : undefined;
    const record = await qc.createRecord({ ...input, inspectorId: req.user!.sub, photoUrl });
    sendSuccess(res, record, "Hasil inspeksi disimpan", 201);
  } catch (e) {
    next(e);
  }
}

export async function updateRecord(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    parseJsonField(req.body, "dimensions");
    const input = updateRecordSchema.parse(req.body);
    const photoUrl = req.file ? publicUrl(req.file.filename) : undefined;
    const record = await qc.updateRecord(req.params.id, req.user!.sub, { ...input, photoUrl });
    sendSuccess(res, record, "Hasil inspeksi diperbarui");
  } catch (e) {
    next(e);
  }
}

// --- NCI (FR-06) ---
export async function createNCItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = ncItemSchema.parse(req.body);
    const photoUrl = req.file ? publicUrl(req.file.filename) : undefined;
    const nci = await qc.createNCItem({ ...input, photoUrl });
    sendSuccess(res, nci, "Non-Conforming Item dicatat", 201);
  } catch (e) {
    next(e);
  }
}

// --- Certificate (FR-05) ---
export async function getCertificates(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await qc.listCertificates());
  } catch (e) {
    next(e);
  }
}

export async function issueCertificate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { projectId, batchIds } = certificateSchema.parse(req.body);
    const cert = await qc.issueCertificate({ projectId, batchIds, userId: req.user!.sub });
    sendSuccess(res, cert, "QC Certificate diterbitkan", 201);
  } catch (e) {
    next(e);
  }
}
