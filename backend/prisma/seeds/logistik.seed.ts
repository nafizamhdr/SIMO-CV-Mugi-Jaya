import { PrismaClient, ShipmentStatus } from "@prisma/client";

/**
 * Seed Modul Logistik (PIC: Redomas).
 * Data dummy: 3 vendor, 2 shipment (1 DISPATCHED, 1 DELIVERED) + tracking log.
 * Bergantung pada data Produksi (project, user) & QC (certificate).
 */
export async function seedLogistik(prisma: PrismaClient): Promise<void> {
  const vendors = [
    { id: "ven-01", name: "PT Logistik Mandiri", contact: "0811-1000-001", licenseNo: "AVL-2026-001", rating: 4.8, isApproved: true },
    { id: "ven-02", name: "CV Trans Jaya", contact: "0811-1000-002", licenseNo: "AVL-2026-002", rating: 4.5, isApproved: true },
    { id: "ven-03", name: "PT Armada Nusa", contact: "0811-1000-003", licenseNo: "AVL-2026-003", rating: 4.1, isApproved: false },
  ];

  for (const v of vendors) {
    await prisma.vendor.upsert({ where: { id: v.id }, update: v, create: v });
  }

  await prisma.shipment.upsert({
    where: { id: "ship-01" },
    update: { status: ShipmentStatus.DISPATCHED, destination: "Kawasan IKN, Penajam Paser Utara", destLat: -1.05, destLng: 116.7 },
    create: {
      id: "ship-01",
      projectId: "prj-ikn",
      vendorId: "ven-02",
      qcCertificateId: "cert-01",
      createdById: "usr-admin",
      driverName: "Slamet R.",
      vehicleNo: "B 9087 KJ",
      insurancePolis: "POL-2026-100231",
      origin: "Gudang CV Mugi Jaya, Bekasi",
      originLat: -6.241586,
      originLng: 106.992416,
      destination: "Kawasan IKN, Penajam Paser Utara",
      destLat: -1.05,
      destLng: 116.7,
      status: ShipmentStatus.DISPATCHED,
      departedAt: new Date("2026-06-05T08:00:00Z"),
    },
  });

  await prisma.shipment.upsert({
    where: { id: "ship-02" },
    update: { status: ShipmentStatus.DELIVERED, destination: "Kantor Proyek Waskita, Jakarta Selatan", destLat: -6.2607, destLng: 106.8107 },
    create: {
      id: "ship-02",
      projectId: "prj-wsk",
      vendorId: "ven-01",
      createdById: "usr-admin",
      driverName: "Budi S.",
      vehicleNo: "B 9123 LM",
      insurancePolis: "POL-2026-100199",
      origin: "Gudang CV Mugi Jaya, Bekasi",
      originLat: -6.241586,
      originLng: 106.992416,
      destination: "Kantor Proyek Waskita, Jakarta Selatan",
      destLat: -6.2607,
      destLng: 106.8107,
      status: ShipmentStatus.DELIVERED,
      departedAt: new Date("2026-05-28T07:00:00Z"),
      arrivedAt: new Date("2026-05-29T16:30:00Z"),
    },
  });

  // Tracking log untuk shipment yang sedang berjalan (titik di sepanjang rute Bekasi->IKN)
  const existingLogs = await prisma.trackingLog.count({ where: { shipmentId: "ship-01" } });
  if (existingLogs === 0) {
    await prisma.trackingLog.createMany({
      data: [
        { shipmentId: "ship-01", lat: -6.2615, lng: 106.8106, speed: 0, isAnomaly: false },
        { shipmentId: "ship-01", lat: -3.65, lng: 111.85, speed: 62.5, isAnomaly: false },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Logistik: ${vendors.length} vendor, 2 shipment, tracking log`);
}
