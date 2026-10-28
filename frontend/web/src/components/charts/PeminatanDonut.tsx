import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatNumber } from "../../lib/format";

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
  short?: string;
}

export function PeminatanDonut({
  data,
  total,
  height = 216,
}: {
  data: DonutDatum[];
  total: number;
  height?: number;
}) {
  if (total <= 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center"
        style={{ height }}
      >
        <p className="text-sm font-bold text-ink">Belum ada data peminatan</p>
        <p className="mt-1 text-xs text-ink-soft">
          Distribusi akan tampil setelah mahasiswa memilih peminatan.
        </p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={3}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            isAnimationActive
            animationDuration={700}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 30px -16px rgba(15,23,42,0.35)",
              fontSize: 12,
            }}
            formatter={(value, name) => [
              `${formatNumber(
                Number(Array.isArray(value) ? value[0] ?? 0 : value ?? 0),
              )} mahasiswa`,
              String(name ?? ""),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Total
        </p>
        <p className="text-2xl font-extrabold tracking-tight text-ink">
          {formatNumber(total)}
        </p>
        <p className="text-[10px] text-slate-400">mahasiswa</p>
      </div>
    </div>
  );
}

export function PeminatanLegend({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="space-y-2">
      {data.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div
            key={item.name}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">
              {item.name}
            </span>
            <span className="text-xs font-bold text-ink">{formatNumber(item.value)}</span>
            <span className="w-9 text-right text-[10px] text-slate-400">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
