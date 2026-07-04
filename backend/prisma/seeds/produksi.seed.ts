import { PrismaClient, Role, WorkItemStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Seed Modul Produksi (PIC: Nafiza).
 * Data dummy: 6 user (1 per role), 2 project, 4 warehouse, 10 work item.
 * ID dibuat eksplisit & deterministik agar bisa direferensikan seed modul lain.
 */
export async function seedProduksi(prisma: PrismaClient): Promise<void> {
  // Password default semua user seed (lihat CLAUDE.md §13).
  const passwordHash = await bcrypt.hash("Simo@2026", 12);

  const users: { id: string; name: string; email: string; role: Role }[] = [
    { id: "usr-owner", name: "Bpk. Pemilik", email: "owner@mugijaya.co.id", role: Role.OWNER },
    { id: "usr-kaprod", name: "Pak Yudi", email: "yudi@mugijaya.co.id", role: Role.KEPALA_PRODUKSI },
    { id: "usr-mandor", name: "Mandor Asep", email: "asep@mugijaya.co.id", role: Role.MANDOR },
    { id: "usr-inspector", name: "Inspector QC", email: "qc@mugijaya.co.id", role: Role.INSPECTOR_QC },
    { id: "usr-admin", name: "Admin Operasional", email: "admin@mugijaya.co.id", role: Role.ADMIN_OPERASIONAL },
    { id: "usr-superadmin", name: "Super Admin", email: "superadmin@mugijaya.co.id", role: Role.SUPER_ADMIN },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { name: u.name, email: u.email, role: u.role, password: passwordHash },
      create: { ...u, password: passwordHash },
    });
  }

  const projects = [
    { id: "prj-ikn", name: "Fasad Gedung IKN", location: "Penajam Paser Utara, IKN", startDate: new Date("2026-01-05") },
    { id: "prj-wsk", name: "Proyek Waskita", location: "Jakarta Selatan", startDate: new Date("2025-12-20") },
  ];

  for (const p of projects) {
    await prisma.project.upsert({ where: { id: p.id }, update: p, create: p });
  }

  const warehouses = [
    { id: "wh-01", name: "WH-01 Partisi Ruangan", location: "Bekasi", mandorId: "usr-mandor" },
    { id: "wh-02", name: "WH-03 Rangka Aluminium", location: "Bekasi", mandorId: "usr-mandor" },
    { id: "wh-03", name: "WH-05 Panel Kaca", location: "Bekasi", mandorId: "usr-mandor" },
    { id: "wh-04", name: "WH-07 Kusen Aluminium", location: "Bekasi", mandorId: "usr-mandor" },
  ];

  for (const w of warehouses) {
    await prisma.warehouse.upsert({ where: { id: w.id }, update: w, create: w });
  }

  const S = WorkItemStatus;
  const workItems = [
    { id: "wi-01", name: "Partisi Lantai 1", status: S.DONE, projectId: "prj-ikn", warehouseId: "wh-01" },
    { id: "wi-02", name: "Partisi Lantai 2", status: S.IN_PROGRESS, projectId: "prj-ikn", warehouseId: "wh-01" },
    { id: "wi-03", name: "Rangka Fasad Utara", status: S.IN_PROGRESS, projectId: "prj-ikn", warehouseId: "wh-02" },
    { id: "wi-04", name: "Rangka Fasad Selatan", status: S.TODO, projectId: "prj-ikn", warehouseId: "wh-02" },
    { id: "wi-05", name: "Panel Kaca Tower A", status: S.IN_PROGRESS, projectId: "prj-ikn", warehouseId: "wh-03" },
    { id: "wi-06", name: "Panel Kaca Tower B", status: S.TODO, projectId: "prj-ikn", warehouseId: "wh-03" },
    { id: "wi-07", name: "Kusen Jendela Blok C", status: S.TODO, projectId: "prj-ikn", warehouseId: "wh-04" },
    { id: "wi-08", name: "Partisi Ruang Rapat", status: S.DONE, projectId: "prj-wsk", warehouseId: "wh-01" },
    { id: "wi-09", name: "Rangka Lobi", status: S.IN_PROGRESS, projectId: "prj-wsk", warehouseId: "wh-02" },
    { id: "wi-10", name: "Panel Kaca Lobi", status: S.TODO, projectId: "prj-wsk", warehouseId: "wh-03" },
  ];

  for (const wi of workItems) {
    await prisma.workItem.upsert({
      where: { id: wi.id },
      update: wi,
      create: { ...wi, assigneeId: "usr-mandor" },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Produksi: ${users.length} user, ${projects.length} project, ${warehouses.length} warehouse, ${workItems.length} work item`);
}
