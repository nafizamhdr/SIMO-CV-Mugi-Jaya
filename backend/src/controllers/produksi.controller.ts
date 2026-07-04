import type { NextFunction, Response } from "express";
import type { Server as SocketServer } from "socket.io";
import * as produksiService from "../services/produksi.service";
import { updateStatusSchema, listWorkItemsSchema, createProjectSchema, updateProjectSchema, createWarehouseSchema, updateWarehouseSchema, createWorkItemSchema } from "../validators/produksi.validator";
import { publicUrl } from "../middleware/upload.middleware";
import { sendSuccess, sendCreated } from "../utils/apiResponse";
import type { AuthRequest } from "../types";

export async function getWarehouses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await produksiService.listWarehouses(req.user!.sub, req.user!.role);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getWorkItems(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { warehouseId } = listWorkItemsSchema.parse(req.query);
    const data = await produksiService.listWorkItems(warehouseId, req.user!.sub, req.user!.role);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = updateStatusSchema.parse(req.body);
    const photoUrl = req.file ? publicUrl(req.file.filename) : undefined;

    const updated = await produksiService.updateWorkItemStatus({
      workItemId: req.params.id,
      status,
      photoUrl,
      userId: req.user!.sub,
      role: req.user!.role,
    });

    // Emit real-time ke dashboard (FR-02)
    const io = req.app.get("io") as SocketServer | undefined;
    io?.emit("work_item_updated", updated);

    sendSuccess(res, updated, "Status pekerjaan diperbarui");
  } catch (error) {
    next(error);
  }
}

export async function getDashboard(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await produksiService.getDashboard();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

// FR-03 — notifikasi keterlambatan produksi
export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const threshold = req.query.thresholdHours ? Number(req.query.thresholdHours) : 48;
    const data = await produksiService.getLateWorkItems(Number.isFinite(threshold) ? threshold : 48);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getProjects(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await produksiService.listProjects();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getMandors(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await produksiService.listMandors();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function createProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const validData = createProjectSchema.parse(req.body);
    const data = await produksiService.createProject(validData, req.user!.sub);
    sendCreated(res, data, "Proyek berhasil dibuat");
  } catch (error) {
    next(error);
  }
}

export async function createWarehouse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const validData = createWarehouseSchema.parse(req.body);
    const data = await produksiService.createWarehouse(validData, req.user!.sub);
    sendCreated(res, data, "Warehouse berhasil dibuat");
  } catch (error) {
    next(error);
  }
}

export async function createWorkItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const validData = createWorkItemSchema.parse(req.body);
    const data = await produksiService.createWorkItem(validData, req.user!.sub);
    sendCreated(res, data, "Pekerjaan berhasil dibuat");
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const validData = updateProjectSchema.parse(req.body);
    const data = await produksiService.updateProject(req.params.id, validData, req.user!.sub);
    sendSuccess(res, data, "Proyek diperbarui");
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await produksiService.deleteProject(req.params.id, req.user!.sub);
    sendSuccess(res, null, "Proyek dihapus");
  } catch (error) {
    next(error);
  }
}

export async function updateWarehouse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const validData = updateWarehouseSchema.parse(req.body);
    const data = await produksiService.updateWarehouse(req.params.id, validData, req.user!.sub);
    sendSuccess(res, data, "Warehouse diperbarui");
  } catch (error) {
    next(error);
  }
}

export async function deleteWarehouse(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await produksiService.deleteWarehouse(req.params.id, req.user!.sub);
    sendSuccess(res, null, "Warehouse dihapus");
  } catch (error) {
    next(error);
  }
}
