import path from "path";
import fs from "fs";
import multer from "multer";
import type { NextFunction, Response } from "express";
import { HttpError } from "../utils/apiResponse";
import type { AuthRequest } from "../types";

/**
 * Penyimpanan foto (dev): simpan ke folder lokal `backend/uploads/`.
 * Produksi nantinya diganti ke AWS S3 — hanya URL yang disimpan di database.
 */
export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Ekstensi yang boleh disimpan. Ekstensi lain (mis. .html, .svg, .js) ditolak
// jadi ".bin" agar tidak pernah ter-render sebagai HTML/script saat dilayani statis.
const SAFE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!SAFE_EXT.has(ext)) ext = ".bin";
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

/**
 * Validasi "magic bytes" file gambar — memastikan ISI file benar-benar
 * JPEG/PNG/WEBP, bukan sekadar mengandalkan ekstensi/MIME yang bisa dipalsukan.
 * Dijalankan SETELAH multer menulis file; bila tidak valid, file dihapus + 422.
 */
function isValidImageSignature(buf: Buffer): boolean {
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // WEBP: "RIFF"...."WEBP"
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return true;
  return false;
}

export function verifyImageMagic(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.file) {
    next();
    return;
  }
  try {
    const fd = fs.openSync(req.file.path, "r");
    const head = Buffer.alloc(12);
    fs.readSync(fd, head, 0, 12, 0);
    fs.closeSync(fd);
    if (!isValidImageSignature(head)) {
      fs.unlink(req.file.path, () => {}); // buang file tidak valid
      next(new HttpError(422, "Isi file bukan gambar yang sah (JPEG/PNG/WEBP)"));
      return;
    }
    next();
  } catch {
    next(new HttpError(500, "Gagal memvalidasi file"));
  }
}
