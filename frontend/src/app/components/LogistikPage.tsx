import { useEffect, useState } from "react";
import { FileText, AlertTriangle, MapPin, Navigation, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ShipmentStatus } from "../../types";
import {
  getVendors,
  getShipments,
  getAvailableCertificates,
  createShipment,
  postTracking,
  postCheckin,
  type VendorDto,
  type ShipmentDto,
  type CertOptionDto,
} from "../../services/logistik.service";

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

  const [form, setForm] = useState({
    qcCertificateId: "",
    vendorId: "",
    driverName: "Budi Santoso",
    vehicleNo: "B 1234 XYZ",
    insurancePolis: "",
  });

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
    setBusy(true);
    try {
      const cert = certs.find((c) => c.id === form.qcCertificateId)!;
      await createShipment({ ...form, projectId: cert.projectId });
      toast.success("Manifest terbit — pengiriman diberangkatkan");
      setForm((f) => ({ ...f, insurancePolis: "" }));
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
        <div className="rounded-xl overflow-hidden relative" style={{ height: 280, background: "linear-gradient(135deg,#e8f0fe,#dbeafe)" }}>
          <svg className="absolute inset-0 w-full h-full opacity-20">
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={`${(i + 1) * 16}%`} x2="100%" y2={`${(i + 1) * 16}%`} stroke="#2E5FA3" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <line key={`v${i}`} x1={`${(i + 1) * 12}%`} y1="0" x2={`${(i + 1) * 12}%`} y2="100%" stroke="#2E5FA3" strokeWidth="0.5" />
            ))}
          </svg>
          <svg className="absolute inset-0 w-full h-full">
            <line x1="15%" y1="70%" x2="85%" y2="30%" stroke="#2E5FA3" strokeWidth="2.5" strokeDasharray="8,4" opacity="0.7" />
          </svg>
          <div className="absolute" style={{ left: "12%", top: "62%" }}>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md" style={{ background: "#1F3864" }}>
                <Package size={14} />
              </div>
              <div className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: "#1F3864" }}>Gudang Bekasi</div>
            </div>
          </div>
          {shipments.filter((s) => s.status !== "DELIVERED").map((s, i) => {
            const color = s.status === "ANOMALY" ? "#C00000" : "#1E7E34";
            return (
              <div key={s.id} className="absolute" style={{ left: `${35 + i * 14}%`, top: `${48 - i * 5}%` }}>
                <div className="flex flex-col items-center">
                  <div className="px-2 py-1 rounded text-white text-[10px] font-bold shadow" style={{ background: color }}>🚛 {s.id.slice(-4)}</div>
                </div>
              </div>
            );
          })}
          <div className="absolute" style={{ left: "82%", top: "22%" }}>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md" style={{ background: "#1E7E34" }}>
                <MapPin size={14} />
              </div>
              <div className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: "#1E7E34" }}>Proyek IKN</div>
            </div>
          </div>
          <div className="absolute top-3 right-3"><Navigation size={20} className="text-blue-900 opacity-50" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Manifest form */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Buat Manifest Pengiriman</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">QC Certificate <span className="text-red-500">*wajib</span></label>
              <select value={form.qcCertificateId} onChange={(e) => setForm({ ...form, qcCertificateId: e.target.value })} className="mt-1 w-full h-11 border border-gray-300 rounded-xl px-3 text-sm outline-none">
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
                    <div className="text-xs text-gray-500">Tujuan: {s.project?.name ?? s.projectId}</div>
                    <div className="text-xs text-gray-500 font-mono">Cert: {s.qcCertificate?.certNumber ?? "-"}</div>
                    {s.status === "ANOMALY" && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-semibold">
                        <AlertTriangle size={12} /> Truk keluar rute — notifikasi terkirim
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => onViewSuratJalan(s)} className="text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1">
                        <FileText size={12} /> Surat Jalan
                      </button>
                      {s.status !== "DELIVERED" && (
                        <button onClick={() => handleCheckin(s.id)} className="text-xs font-semibold text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50">
                          Check-in
                        </button>
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
