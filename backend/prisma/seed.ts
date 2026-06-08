import { PrismaClient } from "@prisma/client";
import { seedProduksi } from "./seeds/produksi.seed";
import { seedQC } from "./seeds/qc.seed";

/**
 * Seed orchestrator. Menjalankan seed tiap modul secara berurutan.
 * Tiap modul menambahkan pemanggilan seed-nya di sini:
 *   - Produksi (Nafiza)  -> seedProduksi
 *   - QC (Regian)        -> seedQC
 *   - Logistik (Redomas) -> seedLogistik
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("🌱 Menjalankan seed database SIMO...");
  await seedProduksi(prisma);
  await seedQC(prisma);
  // eslint-disable-next-line no-console
  console.log("✅ Seed selesai.");
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("❌ Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
