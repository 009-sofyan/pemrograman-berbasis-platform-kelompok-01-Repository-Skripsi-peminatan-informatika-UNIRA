import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartPie, RefreshCw, Sparkles } from "lucide-react";
import type { PemetaanAngkatan } from "../../types";
import { formatNumber, percent } from "../../lib/format";
import { SelectMenu } from "../ui/SelectMenu";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";

export function PeminatanChart({
  data,
  loading,
  error,
  onRetry,
  height = 260,
}: {
  data: PemetaanAngkatan[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  height?: number;
}) {
  const [selectedYear, setSelectedYear] = useState("");
  const [showBi, setShowBi] = useState(true);
  const [showSa, setShowSa] = useState(true);

  const rows = useMemo(
    () => [...data].sort((a, b) => Number(a.angkatan) - Number(b.angkatan)),
    [data],
  );
  const selected = rows.find((row) => row.angkatan === selectedYear) ?? null;
  const chartData = selected ? [selected] : rows;
  const chartTotal = chartData.reduce((sum, row) => sum + row.bi + row.sa, 0);

  const summary = useMemo(() => {
    if (rows.length === 0) return "Belum ada data pemetaan untuk ditampilkan.";
    if (selected) {
      const winner = selected.bi >= selected.sa ? "BI" : "SA";
      const value = Math.max(selected.bi, selected.sa);
      return `${winner} mendominasi angkatan ${selected.angkatan} sebesar ${percent(
        value,
        Math.max(1, selected.bi + selected.sa),
      )}%.`;
    }
    const bi = rows.reduce((sum, row) => sum + row.bi, 0);
    const sa = rows.reduce((sum, row) => sum + row.sa, 0);
    if (bi + sa === 0) return "Mahasiswa belum memilih peminatan.";
    const winner = bi >= sa ? "Business Intelligence" : "Smart Agriculture";
    return `${winner} mendominasi dengan ${formatNumber(
      Math.max(bi, sa),
    )} mahasiswa dari ${formatNumber(bi + sa)} yang sudah memilih.`;
  }, [rows, selected]);

  const yearOptions = [
    { value: "", label: "Semua tahun", hint: "Kelompokkan per angkatan" },
    ...rows
      .slice()
      .reverse()
      .map((row) => ({
        value: row.angkatan,
        label: `Angkatan ${row.angkatan}`,
        hint: `${formatNumber(row.totalMahasiswa)} mahasiswa`,
      })),
  ];

  if (loading) {
    return <Skeleton className="h-[320px] w-full rounded-card" />;
  }

  if (error) {
    return (
      <EmptyState
        compact
        icon={<RefreshCw className="size-5" />}
        title="Gagal memuat pemetaan"
        description={error}
        action={
          onRetry ? (
            <Button variant="secondary" size="sm" icon={<RefreshCw />} onClick={onRetry}>
              Coba lagi
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        compact
        icon={<ChartPie className="size-5" />}
        title="Belum ada data pemetaan"
        description="Distribusi akan tampil setelah mahasiswa memilih peminatan."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBi((value) => !value)}
            aria-pressed={showBi}
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold transition",
              showBi
                ? "border-bi-200 bg-bi-50 text-bi-700"
                : "border-navy-100 bg-white text-ink-faint",
            )}
          >
            <span className={cn("size-2 rounded-full", showBi ? "bg-bi-500" : "bg-navy-200")} />
            Business Intelligence
          </button>
          <button
            type="button"
            onClick={() => setShowSa((value) => !value)}
            aria-pressed={showSa}
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold transition",
              showSa
                ? "border-sa-200 bg-sa-50 text-sa-700"
                : "border-navy-100 bg-white text-ink-faint",
            )}
          >
            <span className={cn("size-2 rounded-full", showSa ? "bg-sa-500" : "bg-navy-200")} />
            Smart Agriculture
          </button>
        </div>
        <SelectMenu
          label=""
          value={selectedYear}
          options={yearOptions}
          onChange={setSelectedYear}
          className="sm:w-48"
        />
      </div>

      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barGap={6}>
            <CartesianGrid vertical={false} stroke="#E9ECF5" strokeDasharray="3 3" />
            <XAxis
              dataKey="angkatan"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#5B6785", fontWeight: 600 }}
              dy={8}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#8992A9" }}
              width={42}
            />
            <Tooltip
              cursor={{ fill: "rgba(20,35,79,0.04)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(8,18,42,0.9)",
                boxShadow: "0 22px 48px -28px rgba(20,35,79,0.55)",
                fontSize: 12,
                color: "#fff",
                backdropFilter: "blur(14px)",
              }}
              labelStyle={{ color: "#fff", fontWeight: 700, marginBottom: 4 }}
              itemStyle={{ color: "#fff" }}
              formatter={(value, name) => {
                const numeric = Number(Array.isArray(value) ? value[0] : value) || 0;
                return [
                  `${formatNumber(numeric)} mahasiswa (${percent(numeric, Math.max(1, chartTotal))}%)`,
                  name === "bi" ? "Business Intelligence" : "Smart Agriculture",
                ];
              }}
            />
            {showBi ? (
              <Bar
                dataKey="bi"
                name="bi"
                fill="#6366F1"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
                animationDuration={600}
              />
            ) : null}
            {showSa ? (
              <Bar
                dataKey="sa"
                name="sa"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
                animationDuration={600}
              />
            ) : null}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-input border border-gold-200/70 bg-gold-50/70 px-3 py-2.5">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold-600" />
        <p className="text-[11px] font-semibold leading-relaxed text-navy-800">{summary}</p>
      </div>
    </div>
  );
}
