-- Tambah field tujuan pengiriman + koordinat (geofencing route-aware).
ALTER TABLE "Shipment" ADD COLUMN "destination" TEXT;
ALTER TABLE "Shipment" ADD COLUMN "destLat" DOUBLE PRECISION;
ALTER TABLE "Shipment" ADD COLUMN "destLng" DOUBLE PRECISION;

-- Backfill alamat tujuan dari lokasi proyek untuk pengiriman lama (koordinat dibiarkan NULL).
UPDATE "Shipment" s
SET "destination" = p."location"
FROM "Project" p
WHERE s."projectId" = p."id" AND s."destination" IS NULL;
