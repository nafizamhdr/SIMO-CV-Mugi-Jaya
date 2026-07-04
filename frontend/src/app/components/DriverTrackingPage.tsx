import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, MapPin, Play, Square, Truck } from "lucide-react";
import { toast } from "sonner";
import { getDriverShipment, driverPostLocation, type DriverShipmentDto } from "../../services/logistik.service";

export function DriverTrackingPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [shipment, setShipment] = useState<DriverShipmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [lastPos, setLastPos] = useState<{ lat: number; lng: number; at: string } | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setShipment(await getDriverShipment(id, token));
      } catch {
        setInvalid(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [id, token]);

  async function send(lat: number, lng: number, speed?: number) {
    try {
      const { anomaly } = await driverPostLocation(id, token, lat, lng, speed);
      setLastPos({ lat, lng, at: new Date().toLocaleTimeString("id-ID") });
      if (anomaly) toast.error("⚠ Anda terdeteksi keluar rute!");
    } catch {
      toast.error("Gagal mengirim posisi");
    }
  }

  function startTracking() {
    if (!("geolocation" in navigator)) {
      toast.error("Perangkat tidak mendukung GPS");
      return;
    }
    setTracking(true);
    toast.info("Mengaktifkan GPS...");
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => send(pos.coords.latitude, pos.coords.longitude, pos.coords.speed ?? undefined),
      () => {
        toast.error("Izin lokasi ditolak");
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }

  function stopTracking() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setTracking(false);
  }

  if (loading) {
    return <Center><Loader2 className="animate-spin text-gray-400" size={22} /></Center>;
  }
  if (invalid || !shipment) {
    return <Center><div className="text-center text-gray-500"><MapPin className="mx-auto mb-2 text-red-400" size={28} />Tautan pelacakan tidak valid atau kedaluwarsa.</div></Center>;
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f4f6f9" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#1F3864,#2E5FA3)" }}><Truck size={20} /></div>
          <div>
            <div className="font-extrabold text-gray-900">Pelacakan Driver</div>
            <div className="text-xs text-gray-400">Kirim posisi GPS Anda ke pusat</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 mb-5">
          <div><span className="text-gray-500">Driver:</span> <b>{shipment.driverName}</b></div>
          <div><span className="text-gray-500">Kendaraan:</span> <b className="font-mono">{shipment.vehicleNo}</b></div>
          <div><span className="text-gray-500">Tujuan:</span> {shipment.project}</div>
          <div><span className="text-gray-500">Vendor:</span> {shipment.vendor}</div>
        </div>

        {lastPos && (
          <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4">
            Posisi terakhir terkirim: {lastPos.lat.toFixed(5)}, {lastPos.lng.toFixed(5)} · {lastPos.at}
          </div>
        )}

        {!tracking ? (
          <button onClick={startTracking} className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2" style={{ background: "#1E7E34" }}>
            <Play size={16} /> Mulai Kirim GPS
          </button>
        ) : (
          <button onClick={stopTracking} className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 animate-pulse" style={{ background: "#C00000" }}>
            <Square size={16} /> Hentikan Pelacakan
          </button>
        )}
        <p className="text-[11px] text-gray-400 text-center mt-3">
          Posisi dikirim otomatis selama pelacakan aktif. Izinkan akses lokasi saat diminta browser.
        </p>
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f4f6f9" }}>{children}</div>;
}
