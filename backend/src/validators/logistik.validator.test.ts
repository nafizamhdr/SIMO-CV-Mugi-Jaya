import { describe, it, expect } from "vitest";
import { createShipmentSchema } from "./logistik.validator";

describe("createShipmentSchema (Logistik FR-08)", () => {
  const valid = {
    projectId: "prj-ikn",
    vendorId: "ven-01",
    qcCertificateId: "cert-01",
    driverName: "Budi",
    vehicleNo: "B 1 XY",
    insurancePolis: "POL-1",
    destination: "Penajam Paser Utara, IKN",
  };
  it("menerima manifest lengkap", () => {
    expect(createShipmentSchema.parse(valid).qcCertificateId).toBe("cert-01");
  });
  it("menerima koordinat tujuan berpasangan", () => {
    const r = createShipmentSchema.parse({ ...valid, destLat: -1.05, destLng: 116.7 });
    expect(r.destLat).toBe(-1.05);
  });
  it("menolak tanpa QC Certificate (gerbang QC wajib)", () => {
    const { qcCertificateId, ...tanpaCert } = valid;
    void qcCertificateId;
    expect(() => createShipmentSchema.parse(tanpaCert)).toThrow();
  });
  it("menolak tanpa no. polis asuransi", () => {
    expect(() => createShipmentSchema.parse({ ...valid, insurancePolis: "" })).toThrow();
  });
  it("menolak tanpa tujuan pengiriman", () => {
    expect(() => createShipmentSchema.parse({ ...valid, destination: "" })).toThrow();
  });
  it("menolak koordinat tujuan yang hanya separuh", () => {
    expect(() => createShipmentSchema.parse({ ...valid, destLat: -1.05 })).toThrow();
  });
});
