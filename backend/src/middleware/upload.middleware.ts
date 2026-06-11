import path from "path";
import fs from "fs";
import multer from "multer";

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

function fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("File harus berupa gambar"));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/** Bangun URL publik dari nama file yang tersimpan. */
export function publicUrl(filename: string): string {
  return `/uploads/${filename}`;
}
