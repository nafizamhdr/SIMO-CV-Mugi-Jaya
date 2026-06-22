import { useEffect } from "react";
import { toast } from "sonner";
import { getSocket } from "../services/socket";
import type { Role } from "../types";

/**
 * Notifikasi real-time lintas modul (FR-10).
 * Mendengarkan event Socket.io dan menampilkan toast ke role yang relevan:
 *  - geofence_anomaly  -> ADMIN_OPERASIONAL & OWNER (armada keluar rute)
 */
export function useRealtimeNotifications(role: Role | undefined) {
  useEffect(() => {
    if (!role) return;
    const socket = getSocket();

    const onAnomaly = (payload: { shipmentId?: string }) => {
      if (role === "ADMIN_OPERASIONAL" || role === "OWNER") {
        toast.error(`⚠ Anomali rute terdeteksi pada pengiriman ${payload.shipmentId?.slice(-5) ?? ""} — armada keluar jalur!`, {
          duration: 6000,
        });
      }
    };

    socket.on("geofence_anomaly", onAnomaly);
    return () => {
      socket.off("geofence_anomaly", onAnomaly);
    };
  }, [role]);
}
