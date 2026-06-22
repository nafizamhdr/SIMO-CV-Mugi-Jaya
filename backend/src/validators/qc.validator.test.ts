import { describe, it, expect } from "vitest";
import { createRecordSchema, certificateSchema } from "./qc.validator";

describe("createRecordSchema (QC FR-04)", () => {
  const valid = {
    workItemId: "wi-01",
    specificationId: "spec-01",
    dimensions: {
      actual: { p: 240, l: 120, t: 12 },
      tolerance: { p: [239, 241], l: [119, 121], t: [11, 13] },
    },
  };
  it("menerima input inspeksi lengkap", () => {
    expect(createRecordSchema.parse(valid).workItemId).toBe("wi-01");
  });
  it("menolak tanpa dimensions", () => {
    expect(() => createRecordSchema.parse({ workItemId: "wi-01", specificationId: "spec-01" })).toThrow();
  });
});

describe("certificateSchema (QC FR-05)", () => {
  it("menolak batch kosong", () => {
    expect(() => certificateSchema.parse({ projectId: "p1", batchIds: [] })).toThrow();
  });
  it("menerima batch berisi", () => {
    expect(certificateSchema.parse({ projectId: "p1", batchIds: ["wi-01"] }).batchIds).toHaveLength(1);
  });
});
