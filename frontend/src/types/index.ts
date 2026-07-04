// ============================================================
// SIMO — Shared TypeScript types (selaras dengan Prisma schema backend)
// ============================================================

export type Role =
  | "OWNER"
  | "KEPALA_PRODUKSI"
  | "MANDOR"
  | "INSPECTOR_QC"
  | "ADMIN_OPERASIONAL"
  | "SUPER_ADMIN";

export type WorkItemStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type QCStatus = "PENDING" | "PASSED" | "FAILED";
export type ShipmentStatus = "DRAFT" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "ANOMALY";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate?: string | null;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  mandorId: string;
}

export interface WorkItem {
  id: string;
  name: string;
  description?: string | null;
  status: WorkItemStatus;
  projectId: string;
  warehouseId: string;
  assigneeId?: string | null;
  photoUrl?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Specification {
  id: string;
  projectId: string;
  title: string;
  version: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface QCRecord {
  id: string;
  workItemId: string;
  specificationId: string;
  inspectorId: string;
  status: QCStatus;
  dimensions: unknown;
  photoUrl?: string | null;
  notes?: string | null;
  inspectedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  licenseNo: string;
  rating: number;
  isApproved: boolean;
}

export interface Shipment {
  id: string;
  projectId: string;
  vendorId: string;
  qcCertificateId?: string | null;
  createdById: string;
  driverName: string;
  vehicleNo: string;
  insurancePolis: string;
  status: ShipmentStatus;
  departedAt?: string | null;
  arrivedAt?: string | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  createdAt: string;
}

// API response envelopes (selaras dengan format backend)
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: number;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}
