-- Tambah alamat & koordinat keberangkatan (asal rute) untuk geofencing route-aware.
ALTER TABLE "Shipment" ADD COLUMN "origin" TEXT;
ALTER TABLE "Shipment" ADD COLUMN "originLat" DOUBLE PRECISION;
ALTER TABLE "Shipment" ADD COLUMN "originLng" DOUBLE PRECISION;

-- Default asal untuk pengiriman lama: Gudang CV Mugi Jaya, Bekasi.
UPDATE "Shipment"
SET "origin" = 'Gudang CV Mugi Jaya, Bekasi', "originLat" = -6.241586, "originLng" = 106.992416
WHERE "origin" IS NULL;
