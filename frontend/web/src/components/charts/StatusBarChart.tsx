import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "../../lib/format";

export interface BarDatum {
  name: string;
  value: number;
  color: string;
}

export function StatusBarChart({
  data,
  height = 216,
}: {
  data: BarDatum[];
  height?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center"
        style={{ height }}
      >
        <p className="text-sm font-bold text-ink">Belum ada skripsi</p>
        <p className="mt-1 text-xs text-ink-soft">
          Grafik status akan tampil setelah data skripsi tersedia.
        </p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(99,102,241,0.05)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 30px -16px rgba(15,23,42,0.35)",
              fontSize: 12,
            }}
            formatter={(value, name) => [
              `${formatNumber(
                Number(Array.isArray(value) ? value[0] ?? 0 : value ?? 0),
              )} skripsi`,
              String(name ?? ""),
            ]}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={44}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(value: unknown) => formatNumber(Number(value ?? 0))}
              style={{ fontSize: 11, fontWeight: 700, fill: "#334155" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
