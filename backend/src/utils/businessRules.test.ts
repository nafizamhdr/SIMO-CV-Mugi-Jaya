import { describe, it, expect } from "vitest";
import { tallyWorkItems, isLate, evaluateDimensions, isOffRoute, haversineKm, ORIGIN_BEKASI } from "./businessRules";

describe("tallyWorkItems (Produksi FR-02)", () => {
  it("menghitung progres 0% saat kosong", () => {
    expect(tallyWorkItems([]).progress).toBe(0);
  });

  it("menghitung progres berdasarkan item DONE", () => {
    const r = tallyWorkItems([{ status: "DONE" }, { status: "DONE" }, { status: "TODO" }, { status: "IN_PROGRESS" }]);
    expect(r.total).toBe(4);
    expect(r.done).toBe(2);
    expect(r.progress).toBe(50);
  });
});

describe("isLate (Produksi FR-03)", () => {
  const now = new Date("2026-06-22T00:00:00Z");
  it("item DONE tidak pernah terlambat", () => {
    expect(isLate("DONE", new Date("2026-01-01"), 48, now)).toBe(false);
  });
  it("item belum selesai & melewati ambang -> terlambat", () => {
    const old = new Date("2026-06-19T00:00:00Z"); // 72 jam lalu
    expect(isLate("IN_PROGRESS", old, 48, now)).toBe(true);
  });
  it("item belum selesai tapi masih dalam ambang -> tidak terlambat", () => {
    const recent = new Date("2026-06-21T12:00:00Z"); // 12 jam lalu
    expect(isLate("TODO", recent, 48, now)).toBe(false);
  });
});

describe("evaluateDimensions (QC FR-04)", () => {
  const tolerance = { p: [239, 241] as [number, number], l: [119, 121] as [number, number], t: [11, 13] as [number, number] };
  it("LOLOS bila semua dalam toleransi", () => {
    expect(evaluateDimensions({ actual: { p: 240, l: 120, t: 12 }, tolerance })).toBe(true);
  });
  it("GAGAL bila salah satu di luar toleransi", () => {
    expect(evaluateDimensions({ actual: { p: 240, l: 120, t: 15 }, tolerance })).toBe(false);
  });
  it("LOLOS tepat di batas toleransi", () => {
    expect(evaluateDimensions({ actual: { p: 239, l: 121, t: 11 }, tolerance })).toBe(true);
  });
});

describe("geofencing route-aware (Logistik FR-10)", () => {
  const IKN = { lat: -1.05, lng: 116.7 }; // tujuan contoh: IKN Penajam

  it("titik di sepanjang rute -> normal", () => {
    expect(isOffRoute(ORIGIN_BEKASI.lat, ORIGIN_BEKASI.lng, IKN)).toBe(false); // di asal
    expect(isOffRoute(IKN.lat, IKN.lng, IKN)).toBe(false); // di tujuan
    expect(isOffRoute(-6.2, 107.0, IKN)).toBe(false); // dekat asal Bekasi
  });

  it("titik jauh dari rute -> anomali", () => {
    expect(isOffRoute(-20.0, 130.0, IKN)).toBe(true); // jauh di selatan/timur
  });

  it("tanpa koordinat tujuan -> tidak dicek (tak anomali palsu)", () => {
    expect(isOffRoute(-20.0, 130.0, null)).toBe(false);
  });

  it("haversine memberi jarak Bekasi->IKN yang masuk akal", () => {
    const d = haversineKm(ORIGIN_BEKASI, IKN);
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(1600);
  });
});
