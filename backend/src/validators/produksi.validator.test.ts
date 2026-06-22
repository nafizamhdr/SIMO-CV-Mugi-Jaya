import { describe, it, expect } from "vitest";
import { updateStatusSchema } from "./produksi.validator";

describe("updateStatusSchema (Produksi FR-01)", () => {
  it("menerima status valid", () => {
    expect(updateStatusSchema.parse({ status: "DONE" }).status).toBe("DONE");
  });
  it("menolak status di luar enum", () => {
    expect(() => updateStatusSchema.parse({ status: "SELESAI" })).toThrow();
  });
  it("menolak status kosong", () => {
    expect(() => updateStatusSchema.parse({})).toThrow();
  });
});
