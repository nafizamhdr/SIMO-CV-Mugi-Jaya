import type { NextFunction, Response } from "express";
import type { Server as SocketServer } from "socket.io";
import * as produksiService from "../services/produksi.service";
import { updateStatusSchema, listWorkItemsSchema } from "../validators/produksi.validator";
import { publicUrl } from "../middleware/upload.middleware";
import { sendSuccess } from "../utils/apiResponse";
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
    const data = await produksiService.listWorkItems(warehouseId);
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
