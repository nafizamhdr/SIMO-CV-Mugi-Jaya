import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, AlertTriangle, RefreshCw, Route } from "lucide-react";
import { toast } from "sonner";
import type { ShipmentStatus } from "../../types";
import { getShipments, getTracking, type ShipmentDto, type TrackPointDto } from "../../services/logistik.service";
import { getSocket } from "../../services/socket";

const truckIcon = (anomaly: boolean) =>
  L.divIcon({
    html: `<div class="px-2 py-1 rounded text-white text-[10px] font-bold shadow ${anomaly ? "bg-[#C00000]" : "bg-[#1E7E34]"}" style="min-width:max-content;">🚛</div>`,
    className: "custom-leaflet-icon",
    iconSize: [40, 20],
    iconAnchor: [20, 10],
  });

const STATUS: Record<ShipmentStatus, { badge: string; label: string }> = {
  DRAFT: { badge: "bg-gray-100 text-gray-600", label: "DRAFT" },
  DISPATCHED: { badge: "bg-blue-100 text-blue-700", label: "DIKIRIM" },
  IN_TRANSIT: { badge: "bg-blue-100 text-blue-700", label: "DI JALAN" },
  DELIVERED: { badge: "bg-green-100 text-green-700", label: "SAMPAI" },
  ANOMALY: { badge: "bg-red-600 text-white", label: "ANOMALI" },
};

export function TrackingPage() {
  const [shipments, setShipments] = useState<ShipmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [trail, setTrail] = useState<TrackPointDto[]>([]);
  const [trackedId, setTrackedId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const timerRef = useRef<number | null>(null);

  async function load(silent = false) {
    try {
      setShipments(await getShipments());
      setUpdatedAt(new Date());
    } catch {
      if (!silent) toast.error("Gagal memuat data pengiriman");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Real-time: dengarkan update tracking + anomali.
    const socket = getSocket();
    const onUpdate = () => void load(true);
    const onAnomaly = () => {
      toast.error("⚠ Armada terdeteksi keluar rute!");
      void load(true);
    };
    socket.on("tracking_update", onUpdate);
    socket.on("geofence_anomaly", onAnomaly);
    // Fallback polling tiap 15 detik.
    timerRef.current = window.setInterval(() => void load(true), 15000);
    return () => {
      socket.off("tracking_update", onUpdate);
      socket.off("geofence_anomaly", onAnomaly);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function handleTrack(id: string) {
    try {
      const points = await getTracking(id);
      setTrail(points);
      setTrackedId(id);
      if (points.length === 0) toast.info("Belum ada data posisi");
    } catch {
      toast.error("Gagal memuat jejak");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={18} /> Memuat...
      </div>
    );
  }

  const active = shipments.filter((s) => s.status !== "DELIVERED");

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-2">
          <div>
            <h3 className="font-bold text-gray-900">Peta Pemantauan Armada</h3>
            <p className="text-xs text-gray-400">
              Real-time · diperbarui {updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          <button onClick={() => load()} className="text-gray-400 hover:text-gray-600" title="Muat ulang"><RefreshCw size={16} /></button>
        </div>
        <div className="rounded-xl overflow-hidden relative z-0" style={{ height: 380 }}>
          <MapContainer center={[-6.24, 107.0]} zoom={11} style={{ height: "100%", width: "100%", zIndex: 0 }}>
            <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {active.map((s, i) => {
              const last = s.trackingLogs?.[0];
              const lat = last ? last.lat : -6.241 - i * 0.002;
              const lng = last ? last.lng : 106.99 + i * 0.02;
              return (
                <Marker key={s.id} position={[lat, lng]} icon={truckIcon(s.status === "ANOMALY")}>
                  <Popup>
                    <b>{s.id.slice(-8)}</b><br />Status: {STATUS[s.status].label}<br />Driver: {s.driverName}
                  </Popup>
                </Marker>
              );
            })}
            {trail.length > 1 && <Polyline positions={trail.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#2E5FA3", weight: 3, dashArray: "6,6" }} />}
          </MapContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Daftar Pengiriman ({shipments.length})</h3>
        <div className="space-y-2">
          {shipments.map((s) => (
            <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${s.status === "ANOMALY" ? "border-red-300 bg-red-50" : "border-gray-100"}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-800 font-mono">{s.id.slice(-8)}</div>
                <div className="text-xs text-gray-500 truncate">{s.project?.name} · {s.vendor?.name} · {s.driverName}</div>
                {s.status === "ANOMALY" && <div className="text-[11px] text-red-600 font-semibold flex items-center gap-1 mt-0.5"><AlertTriangle size={11} /> Keluar rute</div>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS[s.status].badge}`}>{STATUS[s.status].label}</span>
              <button onClick={() => handleTrack(s.id)} className={`text-xs font-semibold border px-3 py-1.5 rounded-lg flex items-center gap-1 ${trackedId === s.id ? "text-white bg-blue-700 border-blue-700" : "text-blue-700 border-blue-200 hover:bg-blue-50"}`}>
                <Route size={12} /> Lacak
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
