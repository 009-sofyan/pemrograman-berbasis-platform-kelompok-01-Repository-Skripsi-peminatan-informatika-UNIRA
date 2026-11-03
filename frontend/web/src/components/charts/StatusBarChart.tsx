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
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#8B94B4", fontWeight: 600 }}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#646E8E" }}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(34,211,238,0.06)" }}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(8,11,24,0.94)",
              boxShadow: "0 22px 48px -28px rgba(0,0,0,0.9)",
              fontSize: 12,
              color: "#F2F5FF",
            }}
            labelStyle={{ color: "#F2F5FF" }}
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
              style={{ fontSize: 11, fontWeight: 700, fill: "#CBD1E6" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
