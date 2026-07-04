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

// --- Logistik (FR-09 / FR-10) — geofencing route-aware ---

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Titik asal seluruh pengiriman: Gudang CV Mugi Jaya, Bekasi. */
export const ORIGIN_BEKASI: GeoPoint = { lat: -6.241586, lng: 106.992416 };

/** Lebar koridor rute yang ditoleransi (km) sebelum dianggap keluar rute. */
export const DEFAULT_CORRIDOR_KM = 75;

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Jarak great-circle antara dua titik (km). */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Bearing awal (radian) dari titik a ke b. */
function bearing(a: GeoPoint, b: GeoPoint): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return Math.atan2(y, x);
}

/**
 * Jarak terpendek (km) titik p ke SEGMEN rute a->b pada bola bumi.
 * Memakai cross-track distance, dengan clamping bila proyeksi jatuh
 * di luar ujung segmen (pakai jarak ke ujung terdekat).
 */
export function distanceToRouteKm(p: GeoPoint, a: GeoPoint, b: GeoPoint): number {
  const routeLen = haversineKm(a, b);
  if (routeLen === 0) return haversineKm(p, a);

  const d13 = haversineKm(a, p) / EARTH_RADIUS_KM; // angular distance a->p
  const crossTrack = Math.asin(Math.sin(d13) * Math.sin(bearing(a, p) - bearing(a, b))) * EARTH_RADIUS_KM;
  // along-track: proyeksi p pada garis a->b
  const alongTrack = Math.acos(Math.min(1, Math.cos(d13) / Math.cos(crossTrack / EARTH_RADIUS_KM))) * EARTH_RADIUS_KM;

  if (alongTrack < 0) return haversineKm(p, a); // sebelum titik asal
  if (alongTrack > routeLen) return haversineKm(p, b); // setelah tujuan
  return Math.abs(crossTrack);
}

/**
 * FR-10: apakah posisi (lat,lng) keluar dari koridor rute asal->tujuan.
 * Bila tujuan belum diketahui (dest null), geofencing tidak aktif → tidak anomali.
 */
export function isOffRoute(
  lat: number,
  lng: number,
  dest: GeoPoint | null,
  origin: GeoPoint = ORIGIN_BEKASI,
  corridorKm: number = DEFAULT_CORRIDOR_KM,
): boolean {
  if (!dest) return false;
  return distanceToRouteKm({ lat, lng }, origin, dest) > corridorKm;
}
