import { useEffect, useState } from "react";
import { FileText, AlertTriangle, MapPin, Navigation, Package, Loader2, Route, LocateFixed, Link2, Plus, Check, X, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { ShipmentStatus } from "../../types";
import {
  getVendors,
  getShipments,
  getAvailableCertificates,
  createShipment,
  postTracking,
  postCheckin,
  deliverShipment,
  getTracking,
  regenerateTrackingToken,
  createVendor,
  updateVendor,
  type VendorDto,
  type ShipmentDto,
  type CertOptionDto,
  type TrackPointDto,
} from "../../services/logistik.service";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const truckIconNormal = L.divIcon({
  html: `<div class="px-2 py-1 rounded text-white text-[10px] font-bold shadow bg-[#1E7E34] text-center" style="min-width: max-content;">🚛</div>`,
  className: "custom-leaflet-icon",
  iconSize: [40, 20],
  iconAnchor: [20, 10],
});
const truckIconAnomaly = L.divIcon({
  html: `<div class="px-2 py-1 rounded text-white text-[10px] font-bold shadow bg-[#C00000] text-center" style="min-width: max-content;">🚛</div>`,
  className: "custom-leaflet-icon",
  iconSize: [40, 20],
  iconAnchor: [20, 10],
});
const whIcon = L.divIcon({
  html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md bg-[#1F3864] text-sm">📦</div>`,
  className: "custom-leaflet-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
const destIcon = L.divIcon({
  html: `<div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md bg-[#C0392B] text-sm">🏁</div>`,
  className: "custom-leaflet-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/** Titik asal seluruh pengiriman: Gudang CV Mugi Jaya, Bekasi. */
const ORIGIN_LATLNG: [number, number] = [-6.241586, 106.992416];

/** Tujuan yang diketahui per proyek seed — untuk prefill form. */
const KNOWN_DEST: Record<string, { address: string; lat: number; lng: number }> = {
  "prj-ikn": { address: "Kawasan IKN, Penajam Paser Utara", lat: -1.05, lng: 116.7 },
  "prj-wsk": { address: "Kantor Proyek Waskita, Jakarta Selatan", lat: -6.2607, lng: 106.8107 },
};

/** Menangkap klik pada peta untuk menandai sebuah titik (keberangkatan/tujuan). */
function MapClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Geser peta saat koordinat tujuan berubah (mis. prefill dari proyek). */
function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], 6);
  }, [lat, lng, map]);
  return null;
}

interface Props {
  onViewSuratJalan: (shipment: ShipmentDto) => void;
}

const STATUS_MAP: Record<ShipmentStatus, { border: string; badge: string; label: string }> = {
  DRAFT: { border: "border-gray-200", badge: "bg-gray-100 text-gray-600", label: "DRAFT" },
  DISPATCHED: { border: "border-blue-200", badge: "bg-blue-100 text-blue-700", label: "DIKIRIM" },
  IN_TRANSIT: { border: "border-blue-200", badge: "bg-blue-100 text-blue-700", label: "DI JALAN" },
  DELIVERED: { border: "border-gray-200", badge: "bg-green-100 text-green-700", label: "SAMPAI" },
  ANOMALY: { border: "border-red-300 bg-red-50", badge: "bg-red-600 text-white", label: "ANOMALI" },
};

export function LogistikPage({ onViewSuratJalan }: Props) {
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [shipments, setShipments] = useState<ShipmentDto[]>([]);
  const [certs, setCerts] = useState<CertOptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [trail, setTrail] = useState<TrackPointDto[]>([]);
  const [trackedId, setTrackedId] = useState<string | null>(null);
  const [showVendors, setShowVendors] = useState(false);
  const [vendorForm, setVendorForm] = useState({ name: "", contact: "", licenseNo: "", rating: "4.5" });

  const [form, setForm] = useState({
    qcCertificateId: "",
    vendorId: "",
    driverName: "Budi Santoso",
    vehicleNo: "B 1234 XYZ",
    insurancePolis: "",
    origin: "Gudang CV Mugi Jaya, Bekasi",
    originLat: ORIGIN_LATLNG[0] as number | null,
    originLng: ORIGIN_LATLNG[1] as number | null,
    destination: "",
    destLat: null as number | null,
    destLng: null as number | null,
  });
  // Titik mana yang di-set saat mengklik peta: keberangkatan atau tujuan.
  const [pickMode, setPickMode] = useState<"origin" | "dest">("dest");

  /** Saat certificate dipilih, prefill tujuan dari proyek terkait (bila dikenal). */
  function selectCert(certId: string) {
    const cert = certs.find((c) => c.id === certId);
    const known = cert ? KNOWN_DEST[cert.projectId] : undefined;
    setForm((f) => ({
      ...f,
      qcCertificateId: certId,
      ...(known && !f.destination ? { destination: known.address, destLat: known.lat, destLng: known.lng } : {}),
    }));
  }

  async function load() {
    try {
      const [v, s, c] = await Promise.all([getVendors(), getShipments(), getAvailableCertificates()]);
      setVendors(v);
      setShipments(s);
      setCerts(c);
      setForm((f) => ({
        ...f,
        vendorId: f.vendorId || v.find((x) => x.isApproved)?.id || "",
        qcCertificateId: f.qcCertificateId || c[0]?.id || "",
      }));
    } catch {
      toast.error("Gagal memuat data logistik");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function handleDispatch() {
    if (!form.qcCertificateId) {
      toast.error("Pilih QC Certificate terlebih dahulu (wajib)");
      return;
    }
    if (!form.insurancePolis.trim()) {
      toast.error("No. polis asuransi wajib diisi");
      return;
    }
    if (!form.destination.trim()) {
      toast.error("Tujuan pengiriman wajib diisi");
      return;
    }
    setBusy(true);
    try {
      const cert = certs.find((c) => c.id === form.qcCertificateId)!;
      await createShipment({
        projectId: cert.projectId,
        vendorId: form.vendorId,
        qcCertificateId: form.qcCertificateId,
        driverName: form.driverName,
        vehicleNo: form.vehicleNo,
        insurancePolis: form.insurancePolis,
        destination: form.destination,
        ...(form.origin.trim() ? { origin: form.origin } : {}),
        ...(form.originLat != null && form.originLng != null ? { originLat: form.originLat, originLng: form.originLng } : {}),
        ...(form.destLat != null && form.destLng != null ? { destLat: form.destLat, destLng: form.destLng } : {}),
      });
      toast.success("Manifest terbit — pengiriman diberangkatkan");
      setForm((f) => ({ ...f, insurancePolis: "", destination: "", destLat: null, destLng: null }));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membuat manifest");
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulateAnomaly() {
    const target = shipments.find((s) => s.status === "DISPATCHED" || s.status === "IN_TRANSIT");
    if (!target) {
      toast.info("Tidak ada pengiriman aktif untuk disimulasikan");
      return;
    }
    toast.warning(`Memantau ${target.id.slice(-5)} — kirim koordinat di luar rute...`);
    try {
      await postTracking({ shipmentId: target.id, lat: -20.0, lng: 130.0, speed: 80 });
      toast.error("⚠ Armada keluar rute! Notifikasi anomali terkirim ke Admin");
      await load();
    } catch {
      toast.error("Gagal mengirim koordinat");
    }
  }

  async function handleCheckin(shipmentId: string) {
    try {
      await postCheckin(shipmentId, "Check-in manual oleh driver");
      toast.success("Check-in manual tercatat");
    } catch {
      toast.error("Gagal check-in");
    }
  }

  async function handleDeliver(shipmentId: string) {
    if (!window.confirm("Tandai pengiriman ini sudah SAMPAI di tujuan?")) return;
    try {
      await deliverShipment(shipmentId);
      toast.success("Pengiriman ditandai sampai di tujuan");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menandai sampai");
    }
  }

  // Tampilkan jejak (polyline) posisi asli dari TrackingLog.
  async function handleTrack(shipmentId: string) {
    try {
      const points = await getTracking(shipmentId);
      setTrail(points);
      setTrackedId(shipmentId);
      if (points.length === 0) toast.info("Belum ada data posisi untuk pengiriman ini");
      else toast.success(`Menampilkan ${points.length} titik posisi di peta`);
    } catch {
      toast.error("Gagal memuat jejak posisi");
    }
  }

  async function handleAddVendor() {
    if (!vendorForm.name || !vendorForm.contact || !vendorForm.licenseNo) {
      toast.error("Lengkapi nama, kontak, dan no. lisensi vendor");
      return;
    }
    setBusy(true);
    try {
      await createVendor({
        name: vendorForm.name,
        contact: vendorForm.contact,
        licenseNo: vendorForm.licenseNo,
        rating: parseFloat(vendorForm.rating) || 0,
        isApproved: true,
      });
      toast.success("Vendor ditambahkan & disetujui (AVL)");
      setVendorForm({ name: "", contact: "", licenseNo: "", rating: "4.5" });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menambah vendor");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleVendor(v: VendorDto) {
    try {
      await updateVendor(v.id, { isApproved: !v.isApproved });
      toast.success(`Vendor ${v.name} ${!v.isApproved ? "disetujui" : "dicabut dari AVL"}`);
      await load();
    } catch {
      toast.error("Gagal memperbarui vendor");
    }
  }

  // Salin tautan halaman driver (untuk dibagikan ke driver — akses tanpa login).
  async function handleDriverLink(s: ShipmentDto) {
    try {
      let token = s.trackingToken;
      if (!token) {
        token = (await regenerateTrackingToken(s.id)).trackingToken;
        await load();
      }
      const url = `${window.location.origin}/driver/${s.id}?token=${token}`;
      await navigator.clipboard?.writeText(url);
      toast.success("Tautan driver disalin ke clipboard");
    } catch {
      toast.error("Gagal membuat tautan driver");
    }
  }

  // FR-09 — kirim posisi GPS asli dari browser (geolocation).
  function handleSendGps(shipmentId: string) {
    if (!("geolocation" in navigator)) {
      toast.error("Browser tidak mendukung GPS");
      return;
    }
    toast.info("Meminta izin & membaca lokasi GPS...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await postTracking({
            shipmentId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed ?? undefined,
          });
          toast.success("Posisi GPS terkirim & tercatat");
          await load();
          if (trackedId === shipmentId) await handleTrack(shipmentId);
        } catch {
          toast.error("Gagal mengirim posisi GPS");
        }
      },
      () => toast.error("Izin lokasi ditolak / GPS tidak tersedia"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={18} /> Memuat...
      </div>
    );
  }

  const approvedVendors = vendors.filter((v) => v.isApproved);

  return (
    <div className="space-y-4">
      {/* Kelola Vendor (AVL) */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-gray-500" />
            <h3 className="font-bold text-gray-900">Kelola Vendor (AVL)</h3>
            <span className="text-xs text-gray-400">{vendors.length} vendor</span>
          </div>
          <button onClick={() => setShowVendors((v) => !v)} className="text-sm font-semibold text-blue-600 flex items-center gap-1">
            {showVendors ? <X size={14} /> : <Plus size={14} />} {showVendors ? "Tutup" : "Kelola"}
          </button>
        </div>
        {showVendors && (
          <div className="mt-4 space-y-3">
            {/* Form tambah vendor */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input placeholder="Nama vendor" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} className="h-10 border border-gray-300 rounded-lg px-3 text-sm" />
              <input placeholder="Kontak" value={vendorForm.contact} onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })} className="h-10 border border-gray-300 rounded-lg px-3 text-sm" />
              <input placeholder="No. Lisensi" value={vendorForm.licenseNo} onChange={(e) => setVendorForm({ ...vendorForm, licenseNo: e.target.value })} className="h-10 border border-gray-300 rounded-lg px-3 text-sm" />
              <input type="number" step="0.1" min="0" max="5" placeholder="Rating" value={vendorForm.rating} onChange={(e) => setVendorForm({ ...vendorForm, rating: e.target.value })} className="h-10 border border-gray-300 rounded-lg px-3 text-sm" />
            </div>
            <button onClick={handleAddVendor} disabled={busy} className="h-10 px-4 rounded-lg text-white font-bold text-sm disabled:opacity-50" style={{ background: "#1E7E34" }}>
              + Tambah Vendor
            </button>
            {/* Daftar vendor */}
            <div className="divide-y divide-gray-100 border-t border-gray-100">
              {vendors.map((v) => (
                <div key={v.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex-1 font-semibold text-gray-800">{v.name} <span className="text-gray-400 font-normal">★{v.rating}</span></span>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${v.isApproved ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                    {v.isApproved ? "AVL" : "BELUM"}
                  </span>
                  <button onClick={() => handleToggleVendor(v)} title={v.isApproved ? "Cabut dari AVL" : "Setujui"} className={`p-2 rounded-lg border ${v.isApproved ? "border-red-200 text-red-500 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                    {v.isApproved ? <X size={14} /> : <Check size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-2">
          <div>
            <h3 className="font-bold text-gray-900">Live Tracking Armada</h3>
            <p className="text-xs text-gray-400">Pelacakan posisi · rute Bekasi → lokasi proyek</p>
          </div>
          <button
            onClick={handleSimulateAnomaly}
            className="text-xs font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            ⚡ Simulasi Anomali Rute
          </button>
        </div>
        <div className="rounded-xl overflow-hidden relative z-0" style={{ height: 350 }}>
          <MapContainer center={[-4.5, 111.5]} zoom={5} style={{ height: "100%", width: "100%", zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Gudang (asal) */}
            <Marker position={ORIGIN_LATLNG} icon={whIcon}>
              <Popup>Gudang Bekasi (asal)</Popup>
            </Marker>

            {/* Tujuan tiap pengiriman aktif (koordinat asli) */}
            {shipments
              .filter((s) => s.status !== "DELIVERED" && s.destLat != null && s.destLng != null)
              .map((s) => (
                <Marker key={`dest-${s.id}`} position={[s.destLat!, s.destLng!]} icon={destIcon}>
                  <Popup>Tujuan: {s.destination ?? "-"}</Popup>
                </Marker>
              ))}

            {/* Armada — posisi ASLI dari TrackingLog terakhir (fallback bila belum ada) */}
            {shipments.filter((s) => s.status !== "DELIVERED").map((s, i) => {
              const icon = s.status === "ANOMALY" ? truckIconAnomaly : truckIconNormal;
              const last = s.trackingLogs?.[0];
              const lat = last ? last.lat : -6.241586 - i * 0.002;
              const lng = last ? last.lng : 106.992416 + i * 0.02 + 0.01;
              return (
                <Marker key={s.id} position={[lat, lng]} icon={icon}>
                  <Popup>
                    <strong>ID: {s.id.slice(-8)}</strong>
                    <br />
                    Status: {STATUS_MAP[s.status].label}
                    <br />
                    {last ? `Posisi asli: ${lat.toFixed(4)}, ${lng.toFixed(4)}` : "Belum ada data GPS"}
                  </Popup>
                </Marker>
              );
            })}

            {/* Jejak rute (polyline) posisi asli pengiriman yang dipilih */}
            {trail.length > 1 && (
              <Polyline positions={trail.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#2E5FA3", weight: 3, dashArray: "6,6" }} />
            )}
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Manifest form */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Buat Manifest Pengiriman</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">QC Certificate <span className="text-red-500">*wajib</span></label>
              <select value={form.qcCertificateId} onChange={(e) => selectCert(e.target.value)} className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none">
                {certs.length === 0 ? <option value="">— Tidak ada certificate tersedia —</option> : certs.map((c) => <option key={c.id} value={c.id}>{c.certNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Vendor (AVL — sudah disetujui)</label>
              <select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none">
                {approvedVendors.map((v) => <option key={v.id} value={v.id}>{v.name} (★{v.rating})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Driver</label>
                <input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">No. Kendaraan</label>
                <input value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">No. Polis Asuransi <span className="text-red-500">*wajib</span></label>
              <input value={form.insurancePolis} onChange={(e) => setForm({ ...form, insurancePolis: e.target.value })} placeholder="POL-2026-..." className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none font-mono" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Alamat Keberangkatan</label>
              <input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="mis. Gudang CV Mugi Jaya, Bekasi" className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Tujuan Pengiriman (Alamat) <span className="text-red-500">*wajib</span></label>
              <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="mis. Kawasan IKN, Penajam Paser Utara" className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Titik Rute di Peta (deteksi keluar rute)</label>
              <div className="flex gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => setPickMode("origin")}
                  className={`flex-1 h-8 rounded-lg text-xs font-semibold border ${pickMode === "origin" ? "bg-[#1F3864] text-white border-[#1F3864]" : "text-gray-600 border-gray-300"}`}
                >
                  📦 Set Keberangkatan
                </button>
                <button
                  type="button"
                  onClick={() => setPickMode("dest")}
                  className={`flex-1 h-8 rounded-lg text-xs font-semibold border ${pickMode === "dest" ? "bg-[#C0392B] text-white border-[#C0392B]" : "text-gray-600 border-gray-300"}`}
                >
                  🏁 Set Tujuan
                </button>
              </div>
              <div className="mt-1 rounded-xl overflow-hidden border border-gray-300" style={{ height: 180 }}>
                <MapContainer center={[form.destLat ?? form.originLat ?? -6.2416, form.destLng ?? form.originLng ?? 106.9924]} zoom={form.destLat != null ? 6 : 9} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                  <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapClickPicker
                    onPick={(lat, lng) =>
                      setForm((f) => (pickMode === "origin" ? { ...f, originLat: lat, originLng: lng } : { ...f, destLat: lat, destLng: lng }))
                    }
                  />
                  <Recenter lat={pickMode === "origin" ? form.originLat : form.destLat} lng={pickMode === "origin" ? form.originLng : form.destLng} />
                  {form.originLat != null && form.originLng != null && (
                    <Marker position={[form.originLat, form.originLng]} icon={whIcon}>
                      <Popup>Keberangkatan: {form.origin || "-"}</Popup>
                    </Marker>
                  )}
                  {form.destLat != null && form.destLng != null && (
                    <Marker position={[form.destLat, form.destLng]} icon={destIcon}>
                      <Popup>Tujuan: {form.destination || "-"}</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Klik peta untuk menandai <b>{pickMode === "origin" ? "titik keberangkatan" : "titik tujuan"}</b>.
                {form.destLat != null && ` Tujuan: ${form.destLat.toFixed(3)}, ${form.destLng!.toFixed(3)}.`}
              </p>
            </div>
          </div>
          <button onClick={handleDispatch} disabled={busy || certs.length === 0} className="mt-5 w-full h-12 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ background: "linear-gradient(135deg,#E67E22,#f39c12)" }}>
            {busy ? "Memproses..." : "Berangkatkan (Dispatch) →"}
          </button>
          <p className="text-[11px] text-gray-400 mt-2 text-center">Pengiriman hanya bisa dibuat bila ada QC Certificate yang valid & belum dipakai.</p>
        </div>

        {/* Active shipments */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Pengiriman</h3>
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {shipments.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada pengiriman.</p>
            ) : (
              shipments.map((s) => {
                const { border, badge, label } = STATUS_MAP[s.status];
                return (
                  <div key={s.id} className={`border ${border} rounded-xl p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-900 font-mono">{s.id.slice(-8)}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${badge}`}>{label}</span>
                    </div>
                    <div className="text-xs text-gray-500">Vendor: {s.vendor?.name ?? s.vendorId}</div>
                    <div className="text-xs text-gray-500">Tujuan: {s.destination ?? s.project?.name ?? s.projectId}</div>
                    <div className="text-xs text-gray-500 font-mono">Cert: {s.qcCertificate?.certNumber ?? "-"}</div>
                    {s.status === "ANOMALY" && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-semibold">
                        <AlertTriangle size={12} /> Truk keluar rute — notifikasi terkirim
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <button onClick={() => onViewSuratJalan(s)} className="text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1">
                        <FileText size={12} /> Surat Jalan
                      </button>
                      <button onClick={() => handleTrack(s.id)} className={`text-xs font-semibold border px-3 py-1.5 rounded-lg flex items-center gap-1 ${trackedId === s.id ? "text-white bg-blue-700 border-blue-700" : "text-blue-700 border-blue-200 hover:bg-blue-50"}`}>
                        <Route size={12} /> Lacak
                      </button>
                      {s.status !== "DELIVERED" && (
                        <button onClick={() => handleDriverLink(s)} className="text-xs font-semibold text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 flex items-center gap-1">
                          <Link2 size={12} /> Link Driver
                        </button>
                      )}
                      {s.status !== "DELIVERED" && (
                        <>
                          <button onClick={() => handleSendGps(s.id)} className="text-xs font-semibold text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 flex items-center gap-1">
                            <LocateFixed size={12} /> Kirim GPS
                          </button>
                          <button onClick={() => handleCheckin(s.id)} className="text-xs font-semibold text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50">
                            Check-in
                          </button>
                          <button onClick={() => handleDeliver(s.id)} className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: "#1E7E34" }}>
                            <Check size={12} /> Tandai Sampai
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
