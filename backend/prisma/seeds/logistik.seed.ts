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
    update: { status: ShipmentStatus.DISPATCHED },
    create: {
      id: "ship-01",
      projectId: "prj-ikn",
      vendorId: "ven-02",
      qcCertificateId: "cert-01",
      createdById: "usr-admin",
      driverName: "Slamet R.",
      vehicleNo: "B 9087 KJ",
      insurancePolis: "POL-2026-100231",
      status: ShipmentStatus.DISPATCHED,
      departedAt: new Date("2026-06-05T08:00:00Z"),
    },
  });

  await prisma.shipment.upsert({
    where: { id: "ship-02" },
    update: { status: ShipmentStatus.DELIVERED },
    create: {
      id: "ship-02",
      projectId: "prj-wsk",
      vendorId: "ven-01",
      createdById: "usr-admin",
      driverName: "Budi S.",
      vehicleNo: "B 9123 LM",
      insurancePolis: "POL-2026-100199",
      status: ShipmentStatus.DELIVERED,
      departedAt: new Date("2026-05-28T07:00:00Z"),
      arrivedAt: new Date("2026-05-29T16:30:00Z"),
    },
  });

  // Tracking log untuk shipment yang sedang berjalan
  const existingLogs = await prisma.trackingLog.count({ where: { shipmentId: "ship-01" } });
  if (existingLogs === 0) {
    await prisma.trackingLog.createMany({
      data: [
        { shipmentId: "ship-01", lat: -6.2615, lng: 106.8106, speed: 0, isAnomaly: false },
        { shipmentId: "ship-01", lat: -2.5489, lng: 118.0149, speed: 62.5, isAnomaly: false },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Logistik: ${vendors.length} vendor, 2 shipment, tracking log`);
}
