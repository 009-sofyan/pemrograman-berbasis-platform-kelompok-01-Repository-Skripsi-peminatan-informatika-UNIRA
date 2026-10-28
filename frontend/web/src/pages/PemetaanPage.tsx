import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  ChartPie,
  CheckCircle2,
  Download,
  Info,
  RefreshCw,
  Sprout,
  TrendingUp,
  UserRoundX,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApiQuery } from "../hooks/useApiQuery";
import { pemetaanService } from "../services/dashboardService";
import { BI, CHART_COLORS, SA, getPeminatanMeta } from "../constants";
import type { PeminatanValue } from "../types";
import { clampPercent, formatNumber, percent } from "../lib/format";
import { cn } from "../lib/cn";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import {
  PeminatanDonut,
  PeminatanLegend,
  type DonutDatum,
} from "../components/charts/PeminatanDonut";

interface DistributionGroup {
  label: string;
  short: string;
  value: number;
  color: string;
  tone: "sky" | "mint" | "slate" | "violet";
  key: string;
}

export default function PemetaanPage() {
  useDocumentTitle("Pemetaan Peminatan");
  const { user } = useAuth();
  const toast = useToast();

  const query = useApiQuery(() => pemetaanService.get(), []);

  const aggregation = useMemo(() => {
    let bi = 0;
    let sa = 0;
    let unset = 0;
    let other = 0;
    const legacy = new Map<string, number>();

    for (const row of query.data?.data ?? []) {
      const total = Number(row.totalMahasiswa);
      if (!row.peminatan) {
        unset += total;
      } else if (row.peminatan === BI) {
        bi += total;
      } else if (row.peminatan === SA) {
        sa += total;
      } else {
        other += total;
        legacy.set(row.peminatan, (legacy.get(row.peminatan) ?? 0) + total);
      }
    }

    const total = bi + sa + unset + other;
    const memilih = bi + sa + other;
    return { bi, sa, unset, other, total, memilih, legacy };
  }, [query.data]);

  const donutData = useMemo<DonutDatum[]>(() => {
    const data: DonutDatum[] = [
      {
        name: "Business Intelligence",
        short: "BI",
        value: aggregation.bi,
        color: CHART_COLORS.sky,
      },
      {
        name: "Smart Agriculture",
        short: "SA",
        value: aggregation.sa,
        color: CHART_COLORS.mint,
      },
    ];
    if (aggregation.unset > 0) {
      data.push({
        name: "Belum memilih",
        short: "—",
        value: aggregation.unset,
        color: CHART_COLORS.slate,
      });
    }
    if (aggregation.other > 0) {
      data.push({
        name: "Peminatan lain (lama)",
        short: "Lain",
        value: aggregation.other,
        color: CHART_COLORS.violet,
      });
    }
    return data;
  }, [aggregation]);

  const distribution = useMemo<DistributionGroup[]>(() => {
    const groups: DistributionGroup[] = [
      {
        key: "bi",
        label: "Business Intelligence",
        short: "BI",
        value: aggregation.bi,
        color: CHART_COLORS.sky,
        tone: "sky",
      },
      {
        key: "sa",
        label: "Smart Agriculture",
        short: "SA",
        value: aggregation.sa,
        color: CHART_COLORS.mint,
        tone: "mint",
      },
      {
        key: "unset",
        label: "Belum memilih",
        short: "—",
        value: aggregation.unset,
        color: CHART_COLORS.slate,
        tone: "slate",
      },
    ];
    if (aggregation.other > 0) {
      groups.push({
        key: "other",
        label: "Peminatan lain (data lama)",
        short: "Lain",
        value: aggregation.other,
        color: CHART_COLORS.violet,
        tone: "violet",
      });
    }
    return groups;
  }, [aggregation]);

  const insight = useMemo(() => {
    if (aggregation.total === 0) {
      return {
        title: "Belum ada data pemetaan",
        description:
          "Data akan tampil setelah Tendik menambahkan mahasiswa ke sistem.",
        tone: "slate" as const,
      };
    }
    if (aggregation.memilih === 0) {
      return {
        title: "Belum ada mahasiswa yang memilih",
        description:
          "Arahkan mahasiswa untuk memilih peminatan melalui halaman Profil masing-masing.",
        tone: "amber" as const,
      };
    }
    if (aggregation.unset > 0) {
      return {
        title: `${formatNumber(aggregation.unset)} mahasiswa belum memilih`,
        description: `${percent(aggregation.unset, aggregation.total)}% mahasiswa belum menentukan peminatan. Lengkapi data agar pemetaan prodi lebih akurat.`,
        tone: "amber" as const,
      };
    }
    if (aggregation.bi === aggregation.sa) {
      return {
        title: "Distribusi BI dan SA seimbang",
        description:
          "Jumlah mahasiswa pada kedua peminatan sama. Kapasitas bimbingan dapat dibagi secara merata.",
        tone: "mint" as const,
      };
    }
    const leader = aggregation.bi > aggregation.sa ? "Business Intelligence" : "Smart Agriculture";
    const leaderValue = Math.max(aggregation.bi, aggregation.sa);
    return {
      title: `${leader} mendominasi`,
      description: `${percent(leaderValue, aggregation.memilih)}% mahasiswa yang sudah memilih berada di ${leader}. Pertimbangkan pemerataan topik dan dosen pembimbing.`,
      tone: "sky" as const,
    };
  }, [aggregation]);

  const coverage = percent(aggregation.memilih, aggregation.total);
  const biShare = percent(aggregation.bi, aggregation.memilih);
  const saShare = percent(aggregation.sa, aggregation.memilih);
  const biGap = Math.abs(aggregation.bi - aggregation.sa);

  if (!user) return null;

  const exportCsv = () => {
    if (!query.data || aggregation.total === 0) {
      toast.warning("Belum ada data", "Tidak ada data pemetaan untuk diekspor.");
      return;
    }

    const rows: { peminatan: PeminatanValue; total: number }[] = query.data.data.map(
      (row) => ({ peminatan: row.peminatan, total: Number(row.totalMahasiswa) }),
    );
    const lines = [
      ["Peminatan", "Jumlah Mahasiswa", "Persentase dari total"],
      ...rows.map((row) => [
        getPeminatanMeta(row.peminatan).label,
        String(row.total),
        `${percent(row.total, aggregation.total)}%`,
      ]),
      ["TOTAL", String(aggregation.total), "100%"],
    ];

    const csv = `\uFEFF${lines
      .map((line) =>
        line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
      )
      .join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pemetaan-peminatan-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV diunduh", "Data pemetaan berhasil diekspor.");
  };

  const insightTone = {
    slate: "border-slate-200 bg-slate-50/70 text-slate-600",
    amber: "border-amber-200 bg-amber-50/70 text-amber-700",
    sky: "border-sky-200 bg-sky-50/70 text-sky-700",
    mint: "border-mint-200 bg-mint-50/70 text-mint-700",
  } as const;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analitik akademik"
        title="Pemetaan Peminatan"
        description="Pantau distribusi mahasiswa pada peminatan Business Intelligence dan Smart Agriculture sebagai dasar pengambilan keputusan Kaprodi."
        icon={<ChartPie className="size-3" />}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<RefreshCw />}
              onClick={query.refetch}
              loading={query.loading}
            >
              Muat ulang
            </Button>
            <Button
              variant="outline"
              icon={<Download />}
              onClick={exportCsv}
              disabled={!query.data || aggregation.total === 0}
            >
              Ekspor CSV
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MappingStat
          label="Total mahasiswa"
          value={aggregation.total}
          caption="Memiliki data akademik"
          icon={<Users className="size-5" />}
          tone="indigo"
          loading={query.loading}
        />
        <MappingStat
          label="Sudah memilih"
          value={aggregation.memilih}
          caption={`${coverage}% cakupan peminatan`}
          icon={<CheckCircle2 className="size-5" />}
          tone="mint"
          loading={query.loading}
        />
        <MappingStat
          label="Business Intelligence"
          value={aggregation.bi}
          caption={`${biShare}% dari yang memilih`}
          icon={<BrainCircuit className="size-5" />}
          tone="sky"
          loading={query.loading}
        />
        <MappingStat
          label="Smart Agriculture"
          value={aggregation.sa}
          caption={`${saShare}% dari yang memilih`}
          icon={<Sprout className="size-5" />}
          tone="amber"
          loading={query.loading}
        />
      </section>

      {query.error ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-coral-200 bg-coral-50/80 px-4 py-3 text-xs text-coral-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{query.error}</p>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw />}
            onClick={query.refetch}
          >
            Coba lagi
          </Button>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader
            title="Komposisi peminatan"
            description="Distribusi seluruh mahasiswa, termasuk yang belum memilih."
            icon={<ChartPie className="size-5" />}
            action={
              <Badge tone="slate" size="xs">
                {formatNumber(aggregation.total)} data
              </Badge>
            }
          />
          {query.loading ? (
            <div className="mt-6 flex flex-col items-center gap-4">
              <Skeleton className="h-[216px] w-[216px] rounded-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          ) : aggregation.total === 0 ? (
            <div className="mt-5">
              <EmptyState
                compact
                icon={<ChartPie className="size-5" />}
                title="Belum ada data pemetaan"
                description="Data mahasiswa belum tersedia. Minta Tendik melengkapi data akademik terlebih dahulu."
              />
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <PeminatanDonut data={donutData} total={aggregation.total} />
              <PeminatanLegend data={donutData} />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Sebaran per peminatan"
            description="Perbandingan jumlah mahasiswa pada masing-masing kategori."
            icon={<TrendingUp className="size-5" />}
            action={
              <Badge tone="indigo" size="xs" dot>
                {coverage}% sudah memilih
              </Badge>
            }
          />

          {query.loading ? (
            <div className="mt-5 space-y-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2.5 w-full" />
                </div>
              ))}
            </div>
          ) : aggregation.total === 0 ? (
            <div className="mt-5">
              <EmptyState
                compact
                title="Grafik belum tersedia"
                description="Sebaran peminatan akan tampil setelah data mahasiswa tersedia."
              />
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {distribution.map((group) => {
                const share = percent(group.value, aggregation.total);
                return (
                  <div key={group.key}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <p className="truncate text-xs font-bold text-ink">
                          {group.label}
                        </p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                          {group.short}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-extrabold text-ink">
                          {formatNumber(group.value)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {share}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${clampPercent(share)}%`,
                          backgroundColor: group.color,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      {group.value === 0
                        ? `Belum ada mahasiswa pada kategori ini.`
                        : `${formatNumber(group.value)} dari ${formatNumber(aggregation.total)} mahasiswa.`}
                    </p>
                  </div>
                );
              })}

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Selisih BI vs SA
                  </p>
                  <Badge
                    tone={biGap === 0 ? "mint" : "amber"}
                    size="xs"
                    dot
                  >
                    {biGap === 0
                      ? "Seimbang"
                      : `${formatNumber(biGap)} mahasiswa`}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold">
                      <span className="text-sky-600">BI</span>
                      <span className="text-slate-400">{biShare}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-sky-100">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${clampPercent(biShare)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold">
                      <span className="text-mint-600">SA</span>
                      <span className="text-slate-400">{saShare}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-mint-100">
                      <div
                        className="h-full rounded-full bg-mint-500"
                        style={{ width: `${clampPercent(saShare)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader
            title="Catatan pemetaan"
            description="Ringkasan otomatis berdasarkan data yang tersedia."
            icon={<Info className="size-5" />}
          />
          <div
            className={cn(
              "mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3.5",
              insightTone[insight.tone],
            )}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/80 shadow-sm">
              {insight.tone === "amber" ? (
                <UserRoundX className="size-4" />
              ) : insight.tone === "mint" ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <TrendingUp className="size-4" />
              )}
            </span>
            <div>
              <p className="text-xs font-bold">{insight.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed opacity-80">
                {insight.description}
              </p>
            </div>
          </div>

          {aggregation.legacy.size > 0 ? (
            <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">
                Data peminatan lama
              </p>
              <div className="mt-2 space-y-1.5">
                {Array.from(aggregation.legacy.entries()).map(([name, total]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="font-semibold text-violet-800">{name}</span>
                    <span className="font-bold text-ink">{formatNumber(total)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-violet-700/80">
                Nilai ini tidak termasuk kategori BI/SA. Perbarui melalui menu Data
                Mahasiswa agar pemetaan konsisten.
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-ink">
                Ingin melihat topik tiap peminatan?
              </p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                Telusuri judul skripsi pada repository untuk melihat tren riset.
              </p>
            </div>
            <Link to="/repository" className="shrink-0">
              <Button variant="secondary" size="sm" iconRight={<ArrowRight />}>
                Buka repository
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Kesiapan data"
            description="Indikator kelengkapan peminatan."
            icon={<CheckCircle2 className="size-5" />}
          />
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white px-4 py-5 text-center">
            <div className="relative grid size-28 place-items-center">
              <svg viewBox="0 0 120 120" className="size-28 -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(clampPercent(coverage) / 100) * 326.7} 326.7`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold tracking-tight text-ink">
                  {coverage}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  terisi
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold text-ink">
              {formatNumber(aggregation.memilih)} dari{" "}
              {formatNumber(aggregation.total)} mahasiswa
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
              {aggregation.unset > 0
                ? `${formatNumber(aggregation.unset)} mahasiswa masih perlu memilih peminatan.`
                : "Seluruh mahasiswa sudah memiliki peminatan."}
            </p>
            <div className="mt-4 w-full space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[10px] shadow-sm ring-1 ring-slate-100">
                <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                  <BrainCircuit className="size-3.5 text-sky-500" />
                  Business Intelligence
                </span>
                <span className="font-bold text-ink">{formatNumber(aggregation.bi)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[10px] shadow-sm ring-1 ring-slate-100">
                <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                  <Sprout className="size-3.5 text-mint-500" />
                  Smart Agriculture
                </span>
                <span className="font-bold text-ink">{formatNumber(aggregation.sa)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[10px] shadow-sm ring-1 ring-slate-100">
                <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                  <UserRoundX className="size-3.5 text-slate-400" />
                  Belum memilih
                </span>
                <span className="font-bold text-ink">{formatNumber(aggregation.unset)}</span>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

function MappingStat({
  label,
  value,
  caption,
  icon,
  tone,
  loading,
}: {
  label: string;
  value: number;
  caption: string;
  icon: ReactNode;
  tone: "indigo" | "mint" | "sky" | "amber";
  loading: boolean;
}) {
  const tones = {
    indigo: "bg-primary-50 text-primary-600 ring-primary-100",
    mint: "bg-mint-50 text-mint-600 ring-mint-100",
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
  } as const;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl ring-1",
            tones[tone],
          )}
        >
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
          {tone === "indigo" ? "Total" : tone === "sky" ? "BI" : tone === "mint" ? "SA" : "Stat"}
        </span>
      </div>
      <p className="mt-4 text-[11px] font-semibold text-ink-soft">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
          {formatNumber(value)}
        </p>
      )}
      <p className="mt-1 text-[10px] text-ink-faint">{caption}</p>
    </div>
  );
}
