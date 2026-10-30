import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BrainCircuit,
  ChartPie,
  Clock3,
  FilePlus2,
  GraduationCap,
  Library,
  RefreshCw,
  Search,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApiQuery } from "../hooks/useApiQuery";
import { dashboardService } from "../services/dashboardService";
import { skripsiService } from "../services/skripsiService";
import {
  BI,
  CHART_COLORS,
  ROLE_META,
  SA,
  STATUS_META,
  STATUS_ORDER,
} from "../constants";
import type { Role, SkripsiStatus } from "../types";
import {
  formatDate,
  formatNumber,
  greeting,
  percent,
  todayLabel,
  truncate,
} from "../lib/format";
import { cn } from "../lib/cn";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Button } from "../components/ui/Button";
import { Skeleton, TableSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { SkripsiPdfButton } from "../components/skripsi/SkripsiPdfButton";
import {
  PeminatanDonut,
  PeminatanLegend,
  type DonutDatum,
} from "../components/charts/PeminatanDonut";
import { StatusBarChart } from "../components/charts/StatusBarChart";

interface QuickAction {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
  tone: "indigo" | "sky" | "mint" | "amber";
}

const QUICK_ACTIONS: Record<Role, QuickAction[]> = {
  mahasiswa: [
    {
      title: "Ajukan Skripsi",
      description: "Buat pengajuan baru dan unggah PDF.",
      to: "/pengajuan",
      icon: FilePlus2,
      tone: "indigo",
    },
    {
      title: "Cari Referensi",
      description: "Telusuri repository berdasarkan peminatan.",
      to: "/repository",
      icon: Search,
      tone: "sky",
    },
    {
      title: "Peminatan Riset",
      description: "Pilih atau lihat peminatan BI & SA.",
      to: "/peminatan",
      icon: Target,
      tone: "mint",
    },
  ],
  kaprodi: [
    {
      title: "Verifikasi Skripsi",
      description: "Tinjau pengajuan yang menunggu.",
      to: "/persetujuan",
      icon: BadgeCheck,
      tone: "indigo",
    },
    {
      title: "Pemetaan Peminatan",
      description: "Lihat distribusi BI dan SA.",
      to: "/pemetaan",
      icon: ChartPie,
      tone: "sky",
    },
    {
      title: "Repository",
      description: "Telusuri seluruh data skripsi.",
      to: "/repository",
      icon: Library,
      tone: "mint",
    },
  ],
  tendik: [
    {
      title: "Data Mahasiswa",
      description: "Tambah, ubah, dan kelola data akademik.",
      to: "/mahasiswa",
      icon: Users,
      tone: "indigo",
    },
    {
      title: "Repository",
      description: "Pantau seluruh skripsi di sistem.",
      to: "/repository",
      icon: Library,
      tone: "sky",
    },
    {
      title: "Profil Saya",
      description: "Informasi akun dan hak akses.",
      to: "/profil",
      icon: UserRound,
      tone: "mint",
    },
  ],
};

const ACTION_TONES = {
  indigo: "bg-primary-50 text-primary-600 ring-primary-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  mint: "bg-mint-50 text-mint-600 ring-mint-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
};

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboard = useApiQuery(() => dashboardService.get(), []);
  const recent = useApiQuery(() => skripsiService.list(), []);

  const statusCounts = useMemo(() => {
    const counts: Record<SkripsiStatus, number> = {
      draft: 0,
      diajukan: 0,
      disetujui: 0,
      ditolak: 0,
    };
    dashboard.data?.statusskripsi.forEach((item) => {
      counts[item.status] = Number(item.total);
    });
    return counts;
  }, [dashboard.data]);

  const peminatanCounts = useMemo(() => {
    let bi = 0;
    let sa = 0;
    let unset = 0;
    let other = 0;
    dashboard.data?.peminatanMahasiswa.forEach((item) => {
      const total = Number(item.total);
      if (item.peminatan === BI) bi += total;
      else if (item.peminatan === SA) sa += total;
      else if (!item.peminatan) unset += total;
      else other += total;
    });
    return { bi, sa, unset, other };
  }, [dashboard.data]);

  const totalMahasiswa = dashboard.data?.totalMahasiswa ?? 0;
  const totalSkripsi = dashboard.data?.totalSkripsi ?? 0;
  const totalMemilih =
    peminatanCounts.bi + peminatanCounts.sa + peminatanCounts.other;
  const pending = statusCounts.diajukan;
  const approved = statusCounts.disetujui;
  const rejected = statusCounts.ditolak;
  const draft = statusCounts.draft;

  const donutData = useMemo<DonutDatum[]>(() => {
    const data: DonutDatum[] = [
      { name: "Business Intelligence", short: "BI", value: peminatanCounts.bi, color: CHART_COLORS.sky },
      { name: "Smart Agriculture", short: "SA", value: peminatanCounts.sa, color: CHART_COLORS.mint },
    ];
    if (peminatanCounts.unset > 0) {
      data.push({
        name: "Belum memilih",
        short: "—",
        value: peminatanCounts.unset,
        color: CHART_COLORS.slate,
      });
    }
    if (peminatanCounts.other > 0) {
      data.push({
        name: "Peminatan lainnya",
        short: "Lain",
        value: peminatanCounts.other,
        color: CHART_COLORS.violet,
      });
    }
    return data;
  }, [peminatanCounts]);

  const statusData = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        name: STATUS_META[status].label,
        value: statusCounts[status],
        color: STATUS_META[status].color,
      })),
    [statusCounts],
  );

  const topPeminatan = useMemo(() => {
    if (peminatanCounts.bi === 0 && peminatanCounts.sa === 0) return null;
    if (peminatanCounts.bi === peminatanCounts.sa) {
      return { label: "BI & SA seimbang", value: peminatanCounts.bi, short: "BI · SA" };
    }
    if (peminatanCounts.bi > peminatanCounts.sa) {
      return {
        label: "Business Intelligence",
        value: peminatanCounts.bi,
        short: "BI",
      };
    }
    return { label: "Smart Agriculture", value: peminatanCounts.sa, short: "SA" };
  }, [peminatanCounts]);

  if (!user) return null;

  const roleMeta = ROLE_META[user.role];
  const firstName = user.nama.split(" ")[0] ?? user.nama;
  const recentData = recent.data?.data.slice(0, 5) ?? [];
  const quickActions = QUICK_ACTIONS[user.role];

  const heroAction =
    user.role === "mahasiswa"
      ? { label: "Ajukan skripsi", to: "/pengajuan", icon: FilePlus2 }
      : user.role === "kaprodi"
        ? { label: "Tinjau pengajuan", to: "/persetujuan", icon: BadgeCheck }
        : { label: "Kelola mahasiswa", to: "/mahasiswa", icon: Users };

  const secondaryAction =
    user.role === "kaprodi"
      ? { label: "Lihat pemetaan", to: "/pemetaan", icon: ChartPie }
      : { label: "Telusuri repository", to: "/repository", icon: Library };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-55" />
        <div className="pointer-events-none absolute inset-0 bg-grid-slate bg-[size:30px_30px] opacity-25" />
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-primary-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-mint-500/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-200 backdrop-blur">
                <Sparkles className="size-3.5" />
                {roleMeta.label} workspace
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {todayLabel()}
              </span>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-[38px] sm:leading-[1.1]">
              {greeting()}, {firstName}{" "}
              <span className="inline-block animate-float">👋</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              {roleMeta.description} Pantau ringkasan repository dan pemetaan
              peminatan Informatika UNIRA dalam satu tampilan.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button
                variant="primary"
                size="md"
                icon={<heroAction.icon />}
                onClick={() => navigate(heroAction.to)}
                className="border border-white/10"
              >
                {heroAction.label}
              </Button>
              <Button
                variant="ghost"
                size="md"
                icon={<secondaryAction.icon />}
                onClick={() => navigate(secondaryAction.to)}
                className="border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:text-white"
              >
                {secondaryAction.label}
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Ringkasan cepat
                </p>
                <span className="flex items-center gap-1 text-[10px] text-mint-300">
                  <span className="size-1.5 animate-pulse rounded-full bg-mint-400" />
                  Live data
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                  <p className="text-[10px] text-slate-400">Menunggu</p>
                  {dashboard.loading ? (
                    <Skeleton className="mt-2 h-7 w-12 bg-white/10" />
                  ) : (
                    <p className="mt-1 text-2xl font-extrabold text-amber-300">
                      {formatNumber(pending)}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                  <p className="text-[10px] text-slate-400">Disetujui</p>
                  {dashboard.loading ? (
                    <Skeleton className="mt-2 h-7 w-12 bg-white/10" />
                  ) : (
                    <p className="mt-1 text-2xl font-extrabold text-mint-300">
                      {formatNumber(approved)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400">Peminatan teratas</p>
                    <p className="mt-1 truncate text-xs font-bold text-white">
                      {topPeminatan?.label ?? "Belum ada data"}
                    </p>
                  </div>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-400/15 text-primary-200">
                    {topPeminatan?.short === "SA" ? (
                      <Sprout className="size-4" />
                    ) : (
                      <BrainCircuit className="size-4" />
                    )}
                  </span>
                </div>
                {topPeminatan ? (
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-400 to-mint-400"
                        style={{
                          width: `${percent(topPeminatan.value, totalMahasiswa)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">
                      {formatNumber(topPeminatan.value)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {dashboard.error ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-coral-200 bg-coral-50/80 px-4 py-3 text-sm text-coral-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{dashboard.error}</p>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw />}
            onClick={dashboard.refetch}
          >
            Coba lagi
          </Button>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Skripsi"
          value={formatNumber(totalSkripsi)}
          icon={<Library className="size-5" />}
          tone="indigo"
          badge={`${formatNumber(approved)} disetujui`}
          caption="Seluruh data repository"
          to="/repository"
          loading={dashboard.loading}
        />
        <StatCard
          label="Total Mahasiswa"
          value={formatNumber(totalMahasiswa)}
          icon={<Users className="size-5" />}
          tone="mint"
          badge={`${percent(totalMemilih, totalMahasiswa)}% memilih`}
          caption={`${formatNumber(totalMemilih)} sudah punya peminatan`}
          loading={dashboard.loading}
        />
        <StatCard
          label="Menunggu Verifikasi"
          value={formatNumber(pending)}
          icon={<Clock3 className="size-5" />}
          tone="amber"
          badge={`${percent(pending, totalSkripsi)}% dari skripsi`}
          caption="Perlu ditinjau Kaprodi"
          to={user.role === "kaprodi" ? "/persetujuan" : undefined}
          loading={dashboard.loading}
        />
        <StatCard
          label="Skripsi Disetujui"
          value={formatNumber(approved)}
          icon={<BadgeCheck className="size-5" />}
          tone="sky"
          badge={`${percent(approved, totalSkripsi)}% dari skripsi`}
          caption={`${formatNumber(rejected)} ditolak · ${formatNumber(draft)} draft`}
          loading={dashboard.loading}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader
            title="Pemetaan Peminatan Mahasiswa"
            description="Distribusi mahasiswa pada kategori Business Intelligence dan Smart Agriculture."
            icon={<ChartPie className="size-5" />}
            action={
              user.role === "kaprodi" ? (
                <Link
                  to="/pemetaan"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700"
                >
                  Detail
                  <ArrowUpRight className="size-3.5" />
                </Link>
              ) : user.role === "mahasiswa" ? (
                <Link
                  to="/peminatan"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700"
                >
                  Pilih peminatan
                  <ArrowUpRight className="size-3.5" />
                </Link>
              ) : null
            }
          />
          {dashboard.loading ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-[0.9fr_1.1fr]">
              <Skeleton className="mx-auto h-[216px] w-full max-w-[260px] rounded-full" />
              <div className="space-y-3 pt-6">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
              <div>
                <PeminatanDonut data={donutData} total={totalMahasiswa} />
              </div>
              <div>
                <PeminatanLegend data={donutData} />
                <div className="mt-4 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                      <BrainCircuit className="size-3.5 text-sky-500" />
                      Business Intelligence
                    </span>
                    <span className="font-bold text-ink">
                      {percent(peminatanCounts.bi, totalMahasiswa)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${percent(peminatanCounts.bi, totalMahasiswa)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                      <Sprout className="size-3.5 text-mint-500" />
                      Smart Agriculture
                    </span>
                    <span className="font-bold text-ink">
                      {percent(peminatanCounts.sa, totalMahasiswa)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-mint-500 to-emerald-400"
                      style={{ width: `${percent(peminatanCounts.sa, totalMahasiswa)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Status Skripsi"
            description="Komposisi status seluruh pengajuan di repository."
            icon={<TrendingUp className="size-5" />}
            action={
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                {formatNumber(totalSkripsi)} total
              </span>
            }
          />
          <div className="mt-4">
            {dashboard.loading ? (
              <Skeleton className="h-[216px] w-full" />
            ) : (
              <StatusBarChart data={statusData} />
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {STATUS_ORDER.map((status) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
              >
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: STATUS_META[status].color }}
                  />
                  {STATUS_META[status].label}
                </span>
                <span className="text-[11px] font-bold text-ink">
                  {formatNumber(statusCounts[status])}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_0.45fr]">
        <Card padded={false}>
          <div className="p-5 pb-3 sm:p-6 sm:pb-3">
            <CardHeader
              title="Skripsi Terbaru"
              description="Lima data terakhir yang masuk ke repository."
              icon={<GraduationCap className="size-5" />}
              action={
                <Link
                  to="/repository"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700"
                >
                  Lihat semua
                  <ArrowRight className="size-3.5" />
                </Link>
              }
            />
          </div>

          {recent.loading ? (
            <div className="px-5 pb-5 sm:px-6">
              <TableSkeleton rows={4} />
            </div>
          ) : recent.error ? (
            <div className="px-5 pb-5 sm:px-6">
              <EmptyState
                compact
                title="Gagal memuat skripsi"
                description={recent.error}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw />}
                    onClick={recent.refetch}
                  >
                    Coba lagi
                  </Button>
                }
              />
            </div>
          ) : recentData.length === 0 ? (
            <div className="px-5 pb-5 sm:px-6">
              <EmptyState
                compact
                icon={<Library className="size-5" />}
                title="Repository masih kosong"
                description="Belum ada skripsi yang tercatat di sistem."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="table-head">
                    <th className="px-6 py-2.5 font-bold">Judul &amp; Mahasiswa</th>
                    <th className="px-3 py-2.5 font-bold">Peminatan</th>
                    <th className="px-3 py-2.5 font-bold">Status</th>
                    <th className="px-3 py-2.5 font-bold">Tahun</th>
                    <th className="px-3 py-2.5 font-bold">Berkas</th>
                  </tr>
                </thead>
                <tbody>
                  {recentData.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="px-6 py-3">
                        <Link
                          to={`/repository/${item.id}`}
                          className="block max-w-md text-xs font-bold leading-relaxed text-ink transition hover:text-primary-600"
                        >
                          {truncate(item.judul, 85)}
                        </Link>
                        <p className="mt-1 text-[10px] text-slate-400">
                          NIM {item.nim} · {item.programStudi}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <PeminatanBadge value={item.peminatan} size="xs" short />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={item.status} size="xs" />
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-slate-500">
                        {item.tahun}
                      </td>
                      <td className="px-3 py-3">
                        {item.fileUrl ? (
                          <SkripsiPdfButton
                            id={item.id}
                            title={item.judul}
                            variant="ghost"
                            size="sm"
                            label="PDF"
                            className="h-auto px-0 text-[11px] font-bold text-primary-600 hover:bg-transparent hover:text-primary-700"
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400">Belum ada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Akses Cepat"
            description="Pintasan sesuai peranmu."
            icon={<Sparkles className="size-5" />}
          />
          <div className="mt-4 space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50/70 hover:shadow-sm"
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl ring-1",
                    ACTION_TONES[action.tone],
                  )}
                >
                  <action.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-ink">{action.title}</span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-soft">
                    {action.description}
                  </span>
                </span>
                <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-slate-300 transition group-hover:text-primary-500" />
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-600">
              Tips
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              {user.role === "mahasiswa"
                ? "Tentukan peminatan risetmu lewat menu Peminatan Riset agar data pemetaan prodi makin akurat."
                : user.role === "kaprodi"
                  ? "Gunakan filter peminatan di repository untuk melihat sebaran topik riset."
                  : "Tambahkan data akademik mahasiswa setelah akun mereka terdaftar."}
            </p>
          </div>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-sky-100 text-sky-600">
            <BrainCircuit className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-600">
              Business Intelligence
            </p>
            <p className="text-sm font-extrabold text-ink">
              {formatNumber(peminatanCounts.bi)}{" "}
              <span className="text-[10px] font-medium text-ink-soft">mahasiswa</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-mint-100 bg-gradient-to-br from-mint-50 to-white p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-mint-100 text-mint-600">
            <Sprout className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-mint-600">
              Smart Agriculture
            </p>
            <p className="text-sm font-extrabold text-ink">
              {formatNumber(peminatanCounts.sa)}{" "}
              <span className="text-[10px] font-medium text-ink-soft">mahasiswa</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <Clock3 className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Belum memilih
            </p>
            <p className="text-sm font-extrabold text-ink">
              {formatNumber(peminatanCounts.unset)}{" "}
              <span className="text-[10px] font-medium text-ink-soft">mahasiswa</span>
            </p>
          </div>
        </div>
      </section>

      <p className="text-center text-[10px] text-slate-400">
        Data diperbarui otomatis setiap halaman dimuat ·{" "}
        {formatDate(new Date().toISOString(), {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
