/**
 * Aturan bisnis murni (pure functions) — tanpa akses database.
 * Dipisah agar mudah di-unit-test oleh tiap modul.
 */

// --- Produksi (FR-02 / FR-03) ---

export type SimpleStatus = "TODO" | "IN_PROGRESS" | "DONE";

/** Hitung ringkasan & persentase progres dari sekumpulan work item. */
export function tallyWorkItems(items: { status: SimpleStatus }[]) {
  const total = items.length;
  const done = items.filter((i) => i.status === "DONE").length;
  const inProgress = items.filter((i) => i.status === "IN_PROGRESS").length;
  const todo = items.filter((i) => i.status === "TODO").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, inProgress, todo, progress };
}

/** FR-03: apakah pekerjaan terlambat (belum DONE & melewati ambang jam). */
export function isLate(status: SimpleStatus, updatedAt: Date, thresholdHours: number, now: Date = new Date()): boolean {
  if (status === "DONE") return false;
  const hours = (now.getTime() - updatedAt.getTime()) / (60 * 60 * 1000);
  return hours >= thresholdHours;
}

// --- QC (FR-04) ---

export interface Dimensions {
  actual: { p: number; l: number; t: number };
  tolerance: { p: [number, number]; l: [number, number]; t: [number, number] };
}

/** Evaluasi dimensi terhadap toleransi → lolos bila semua nilai dalam rentang. */
export function evaluateDimensions(dims: Dimensions): boolean {
  const within = (v: number, [min, max]: [number, number]) => v >= min && v <= max;
  return (
    within(dims.actual.p, dims.tolerance.p) &&
    within(dims.actual.l, dims.tolerance.l) &&
    within(dims.actual.t, dims.tolerance.t)
  );
}

// --- Logistik (FR-10) ---

/** Koridor rute yang diizinkan (bounding box kasar Bekasi -> IKN). */
export const ROUTE_BOUNDS = { minLat: -7.5, maxLat: 1.5, minLng: 106.0, maxLng: 119.5 };

/** FR-10: apakah koordinat berada di luar koridor rute (anomali). */
export function isOutsideRoute(lat: number, lng: number): boolean {
  return (
    lat < ROUTE_BOUNDS.minLat ||
    lat > ROUTE_BOUNDS.maxLat ||
    lng < ROUTE_BOUNDS.minLng ||
    lng > ROUTE_BOUNDS.maxLng
  );
}
