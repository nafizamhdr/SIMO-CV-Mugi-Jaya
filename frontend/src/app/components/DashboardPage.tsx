import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Warehouse, QCBatch } from "./data";

interface Props {
  warehouses: Warehouse[];
  qcBatches: QCBatch[];
}

const STATUS_COLORS: Record<string, string> = {
  Done: "#1E7E34",
  "In-Progress": "#2E5FA3",
  Tertunda: "#E67E22",
  "To-Do": "#94a3b8",
};

const BADGE_STYLE: Record<string, string> = {
  Done: "bg-green-100 text-green-700",
  "In-Progress": "bg-blue-100 text-blue-700",
  Tertunda: "bg-orange-100 text-orange-700",
  "To-Do": "bg-gray-100 text-gray-600",
};

export function DashboardPage({ warehouses, qcBatches }: Props) {
  const aktif = warehouses.filter((w) => w.status !== "Done").length;
  const avg = Math.round(
    warehouses.reduce((s, w) => s + w.progress, 0) / warehouses.length,
  );
  const tertunda = warehouses.filter((w) => w.status === "Tertunda").length;
  const proyekAktif = [...new Set(qcBatches.map((b) => b.proyek))].length + 5;

  const kpis = [
    {
      label: "Proyek Aktif",
      val: proyekAktif,
      sub: "▲ 2 dari bulan lalu",
      color: "#1E7E34",
    },
    {
      label: "Warehouse Aktif",
      val: warehouses.length,
      sub: "Semua online",
      color: "#64748b",
    },
    {
      label: "Progres Rata-rata",
      val: avg + "%",
      sub: "On track",
      color: "#1E7E34",
    },
    {
      label: "Laporan Tertunda",
      val: tertunda,
      sub: tertunda > 0 ? "⚠ Perlu perhatian" : "Aman",
      color: tertunda > 0 ? "#E67E22" : "#1E7E34",
    },
  ];

  const counts: Record<string, number> = {
    Done: 0,
    "In-Progress": 0,
    Tertunda: 0,
    "To-Do": 0,
  };
  warehouses.forEach((w) => counts[w.status]++);
  const chartData = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="text-xs text-gray-500 font-semibold">{k.label}</div>
            <div className="text-3xl font-extrabold text-gray-900 mt-1">
              {k.val}
            </div>
            <div
              className="text-[11px] font-semibold mt-1"
              style={{ color: k.color }}
            >
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Progress + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Warehouse progress */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Progres per Warehouse</h3>
            <span className="text-xs text-gray-400">Diperbarui baru saja</span>
          </div>
          <div className="space-y-4">
            {warehouses.map((w) => (
              <div key={w.id} className="flex items-center gap-4">
                <div className="w-44 text-sm font-semibold text-gray-700 flex-shrink-0">
                  {w.id} · {w.nama}
                </div>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${w.progress}%`,
                      background: STATUS_COLORS[w.status],
                    }}
                  />
                </div>
                <div
                  className="w-10 text-sm font-bold flex-shrink-0"
                  style={{ color: STATUS_COLORS[w.status] }}
                >
                  {w.progress}%
                </div>
                <div className="w-24 flex-shrink-0">
                  <span
                    className={`text-[11px] font-semibold px-2 py-1 rounded-full ${BADGE_STYLE[w.status]}`}
                  >
                    {w.status}
                  </span>
                </div>
                <div className="w-20 text-[11px] text-gray-400 hidden xl:block">
                  Mandor {w.mandor}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status doughnut chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Komposisi Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Aktivitas Terbaru</h3>
        <div className="space-y-3">
          {[
            {
              dot: "#1E7E34",
              text: "WH-01 Partisi Ruangan — 100% selesai",
              time: "Hari ini, 07:30",
            },
            {
              dot: "#2E5FA3",
              text: "WH-03 Rangka Aluminium — progres 80%",
              time: "Hari ini, 08:00",
            },
            {
              dot: "#E67E22",
              text: "WH-07 Kusen Aluminium — status tertunda",
              time: "Kemarin, 16:45",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: item.dot }}
              />
              <span className="text-gray-700 flex-1">{item.text}</span>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
