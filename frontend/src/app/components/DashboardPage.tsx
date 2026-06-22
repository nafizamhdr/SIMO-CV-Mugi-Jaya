import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getDashboard, getNotifications, type DashboardDto, type LateItemDto } from "../../services/produksi.service";
import { getSocket } from "../../services/socket";

const COLORS = { done: "#1E7E34", inProgress: "#2E5FA3", todo: "#94a3b8" };

export function DashboardPage() {
  const [data, setData] = useState<DashboardDto | null>(null);
  const [lateItems, setLateItems] = useState<LateItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  async function load(showToast = false) {
    try {
      const [d, late] = await Promise.all([getDashboard(), getNotifications().catch(() => [])]);
      setData(d);
      setLateItems(late);
      setUpdatedAt(new Date());
      if (showToast) toast("Dashboard diperbarui (real-time)", { icon: "🔄" });
    } catch {
      toast.error("Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Real-time: refresh saat ada perubahan status work item (FR-02)
    const socket = getSocket();
    const handler = () => void load(true);
    socket.on("work_item_updated", handler);
    return () => {
      socket.off("work_item_updated", handler);
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={18} /> Memuat dashboard...
      </div>
    );
  }

  const { summary, projects, warehouses } = data;

  const kpis = [
    { label: "Proyek Aktif", val: projects.length, sub: "Total proyek berjalan", color: "#1E7E34" },
    { label: "Warehouse Aktif", val: warehouses.length, sub: "Semua online", color: "#64748b" },
    { label: "Progres Rata-rata", val: `${summary.progress}%`, sub: `${summary.done}/${summary.total} pekerjaan selesai`, color: "#1E7E34" },
    {
      label: "Belum Dikerjakan",
      val: summary.todo,
      sub: summary.todo > 0 ? "⚠ Perlu perhatian" : "Aman",
      color: summary.todo > 0 ? "#E67E22" : "#1E7E34",
    },
  ];

  const chartData = [
    { name: "Selesai", value: summary.done, color: COLORS.done },
    { name: "Dikerjakan", value: summary.inProgress, color: COLORS.inProgress },
    { name: "To-Do", value: summary.todo, color: COLORS.todo },
  ];

  const barColor = (progress: number) =>
    progress >= 100 ? COLORS.done : progress > 0 ? COLORS.inProgress : COLORS.todo;

  return (
    <div className="space-y-5">
      {/* FR-03 — Notifikasi keterlambatan produksi */}
      {lateItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-orange-700 font-bold text-sm mb-2">
            <AlertTriangle size={16} /> {lateItems.length} pekerjaan terlambat — perlu perhatian
          </div>
          <div className="space-y-1">
            {lateItems.slice(0, 5).map((it) => (
              <div key={it.id} className="text-xs text-orange-700 flex items-center gap-2">
                <span className="font-semibold">{it.name}</span>
                <span className="text-orange-400">·</span>
                <span>{it.warehouse}</span>
                <span className="ml-auto font-mono">terlambat ~{it.hoursLate} jam</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-500 font-semibold">{k.label}</div>
            <div className="text-3xl font-extrabold text-gray-900 mt-1">{k.val}</div>
            <div className="text-[11px] font-semibold mt-1" style={{ color: k.color }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress per warehouse */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Progres per Warehouse</h3>
            <span className="text-xs text-gray-400">
              Diperbarui {updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
          <div className="space-y-4">
            {warehouses.map((w) => (
              <div key={w.id} className="flex items-center gap-4">
                <div className="w-44 text-sm font-semibold text-gray-700 flex-shrink-0 truncate">{w.name}</div>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${w.progress}%`, background: barColor(w.progress) }}
                  />
                </div>
                <div className="w-10 text-sm font-bold flex-shrink-0" style={{ color: barColor(w.progress) }}>
                  {w.progress}%
                </div>
                <div className="w-20 text-[11px] text-gray-400 hidden xl:block">
                  {w.done}/{w.total} item
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status doughnut */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Komposisi Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progres per proyek */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Progres per Proyek</h3>
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-4">
              <div className="w-48 flex-shrink-0">
                <div className="text-sm font-semibold text-gray-700 truncate">{p.name}</div>
                <div className="text-[11px] text-gray-400 truncate">{p.location}</div>
              </div>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${p.progress}%`, background: barColor(p.progress) }}
                />
              </div>
              <div className="w-10 text-sm font-bold flex-shrink-0" style={{ color: barColor(p.progress) }}>
                {p.progress}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
