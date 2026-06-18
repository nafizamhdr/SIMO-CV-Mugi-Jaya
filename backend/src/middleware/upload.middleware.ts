import path from "path";
import fs from "fs";
import multer from "multer";
import { HttpError } from "../utils/apiResponse";

/**
 * Penyimpanan foto (dev): simpan ke folder lokal `backend/uploads/`.
 * Produksi nantinya diganti ke AWS S3 — hanya URL yang disimpan di database.
 */
export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `wi-${unique}${ext}`);
  },
});

function imageFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new HttpError(422, "File harus berupa gambar"));
}

const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/octet-stream",
];

function docFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype.startsWith("image/") || DOC_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new HttpError(422, "File harus berupa PDF, dokumen, atau gambar"));
}

/** Upload foto (gambar saja) — dipakai Produksi & QC photo. */
export const upload = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/** Upload dokumen (PDF/blueprint/spesifikasi) — dipakai repositori QC (FR-12). */
export const uploadDoc = multer({ storage, fileFilter: docFilter, limits: { fileSize: 15 * 1024 * 1024 } });

/** Bangun URL publik dari nama file yang tersimpan. */
export function publicUrl(filename: string): string {
  return `/uploads/${filename}`;
}
