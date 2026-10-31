import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BrainCircuit,
  CalendarDays,
  ChartPie,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  FileText,
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
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApiQuery } from "../hooks/useApiQuery";
import { dashboardService, pemetaanService } from "../services/dashboardService";
import { persetujuanService } from "../services/persetujuanService";
import { skripsiService } from "../services/skripsiService";
import {
  BI,
  ROLE_META,
  SA,
  STATUS_META,
  STATUS_ORDER,
  type Tone,
} from "../constants";
import type { Role, Skripsi, SkripsiStatus, User } from "../types";
import { getApiErrorMessage } from "../lib/errors";
import {
  formatDate,
  formatNumber,
  greeting,
  percent,
  truncate,
} from "../lib/format";
import { getTrackedSkripsiIds } from "../lib/storage";
import { cn } from "../lib/cn";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Input } from "../components/ui/Input";
import { Skeleton, TableSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { Pagination } from "../components/ui/Pagination";
import { SelectMenu } from "../components/ui/SelectMenu";
import { DataTable, type DataColumn } from "../components/ui/DataTable";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PeminatanChart } from "../components/dashboard/PeminatanChart";
import { SkripsiPdfButton } from "../components/skripsi/SkripsiPdfButton";

const VERIFICATION_PAGE_SIZE = 6;

interface QuickAction {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
  tone: Tone;
}

const QUICK_ACTIONS: Record<Role, QuickAction[]> = {
  mahasiswa: [
    {
      title: "Ajukan Skripsi",
      description: "Buat pengajuan baru dan unggah PDF.",
      to: "/pengajuan",
      icon: FilePlus2,
      tone: "bi",
    },
    {
      title: "Cari Referensi",
      description: "Telusuri repository berdasarkan peminatan.",
      to: "/repository",
      icon: Search,
      tone: "navy",
    },
    {
      title: "Peminatan Riset",
      description: "Lihat atau perbarui peminatan BI & SA.",
      to: "/peminatan",
      icon: Target,
      tone: "sa",
    },
  ],
  kaprodi: [
    {
      title: "Verifikasi Skripsi",
      description: "Tinjau pengajuan yang menunggu.",
      to: "/persetujuan",
      icon: BadgeCheck,
      tone: "bi",
    },
    {
      title: "Pemetaan Peminatan",
      description: "Lihat distribusi BI dan SA per angkatan.",
      to: "/pemetaan",
      icon: ChartPie,
      tone: "sa",
    },
    {
      title: "Repository",
      description: "Telusuri seluruh data skripsi.",
      to: "/repository",
      icon: Library,
      tone: "navy",
    },
  ],
  tendik: [
    {
      title: "Data Mahasiswa",
      description: "Tambah, ubah, dan kelola data akademik.",
      to: "/mahasiswa",
      icon: Users,
      tone: "bi",
    },
    {
      title: "Repository",
      description: "Pantau seluruh skripsi di sistem.",
      to: "/repository",
      icon: Library,
      tone: "navy",
    },
    {
      title: "Profil Saya",
      description: "Informasi akun dan hak akses.",
      to: "/profil",
      icon: UserRound,
      tone: "sa",
    },
  ],
};

const QUICK_TONES: Record<Tone, string> = {
  indigo: "bg-primary-50 text-primary-600 ring-primary-100",
  bi: "bg-bi-50 text-bi-600 ring-bi-100",
  sa: "bg-sa-50 text-sa-600 ring-sa-100",
  mint: "bg-sa-50 text-sa-600 ring-sa-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  coral: "bg-coral-50 text-coral-600 ring-coral-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  navy: "bg-navy-50 text-navy-700 ring-navy-100",
  gold: "bg-gold-50 text-gold-700 ring-gold-200",
  slate: "bg-slate-100 text-slate-500 ring-slate-200",
};

/**
 * Jam yang diperbarui tepat setiap pergantian menit. Satu timer saja agar
 * dashboard tidak melakukan render berlebihan.
 */
function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));

    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return now;
}

function timeLabel(now: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

function longDateLabel(now: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const now = useMinuteClock();
  const isKaprodi = user?.role === "kaprodi";

  const dashboard = useApiQuery(() => dashboardService.get(), []);
  const recent = useApiQuery(() => skripsiService.list(), []);
  const pendingQuery = useApiQuery(() => persetujuanService.list(), [], {
    enabled: isKaprodi,
  });
  const pemetaanQuery = useApiQuery(() => pemetaanService.get(), [], {
    enabled: isKaprodi,
  });

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
  const unset = peminatanCounts.unset;

  const allItems = useMemo(() => recent.data?.data ?? [], [recent.data]);
  const pendingItems = pendingQuery.data?.data ?? [];

  const trackedIds = useMemo(
    () => (user ? getTrackedSkripsiIds(user.id) : []),
    [user, recent.data],
  );

  const ownItems = useMemo(
    () =>
      allItems
        .filter((item) => trackedIds.includes(item.id))
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }),
    [allItems, trackedIds],
  );

  if (!user) return null;

  const firstName = user.nama.split(" ")[0] ?? user.nama;

  return (
    <div className="space-y-5">
      {user.role === "mahasiswa" ? (
        <StudentHero
          user={user}
          now={now}
          latest={ownItems[0] ?? null}
          loading={recent.loading}
          firstName={firstName}
        />
      ) : (
        <StaffHero
          user={user}
          now={now}
          firstName={firstName}
          description={
            user.role === "kaprodi"
              ? "Tinjau pengajuan, pantau distribusi peminatan, dan jaga kualitas repository skripsi Informatika."
              : "Pastikan data akademik dan dokumentasi skripsi mahasiswa selalu lengkap dan mutakhir."
          }
        />
      )}

      {dashboard.error ? (
        <ErrorBanner message={dashboard.error} onRetry={dashboard.refetch} />
      ) : null}

      {user.role === "mahasiswa" ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Skripsi"
              value={totalSkripsi}
              icon={<Library className="size-5" />}
              tone="bi"
              badge={`${formatNumber(approved)} disetujui`}
              caption="Seluruh repository"
              to="/repository"
              loading={dashboard.loading}
            />
            <StatCard
              label="Pengajuan Saya"
              value={ownItems.length}
              icon={<FileText className="size-5" />}
              tone="navy"
              badge={ownItems.length > 0 ? "Terlacak" : "Belum ada"}
              caption="Tersimpan di perangkat ini"
              to="/pengajuan"
              loading={recent.loading}
            />
            <StatCard
              label="Menunggu Verifikasi"
              value={pending}
              icon={<Clock3 className="size-5" />}
              tone="amber"
              badge={`${percent(pending, totalSkripsi)}% dari skripsi`}
              caption="Sedang ditinjau Kaprodi"
              loading={dashboard.loading}
            />
            <StatCard
              label="Skripsi Disetujui"
              value={approved}
              icon={<BadgeCheck className="size-5" />}
              tone="sa"
              badge={`${percent(approved, totalSkripsi)}% dari skripsi`}
              caption={`${formatNumber(rejected)} ditolak · ${formatNumber(statusCounts.draft)} draft`}
              loading={dashboard.loading}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <OwnSubmissions
              items={ownItems}
              loading={recent.loading}
              error={recent.error}
              onRetry={recent.refetch}
            />
            <ActivityTimeline
              items={ownItems.length > 0 ? ownItems : allItems}
              personal={ownItems.length > 0}
              loading={recent.loading}
              error={recent.error}
              onRetry={recent.refetch}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <QuickActions role="mahasiswa" />
            <Card>
              <CardHeader
                title="Cakupan Peminatan"
                description="Distribusi mahasiswa Informatika pada dua peminatan riset."
                icon={<ChartPie className="size-5" />}
                action={
                  <Link
                    to="/peminatan"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-bi-600 hover:text-bi-700"
                  >
                    Pilih peminatan
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                }
              />
              {dashboard.loading ? (
                <div className="mt-5 space-y-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-2.5 w-full" />
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <ShareBar
                    label="Business Intelligence"
                    value={peminatanCounts.bi}
                    total={Math.max(1, totalMahasiswa)}
                    tone="bi"
                    icon={<BrainCircuit className="size-3.5" />}
                  />
                  <ShareBar
                    label="Smart Agriculture"
                    value={peminatanCounts.sa}
                    total={Math.max(1, totalMahasiswa)}
                    tone="sa"
                    icon={<Sprout className="size-3.5" />}
                  />
                  <div className="flex items-center justify-between rounded-input border border-navy-100 bg-navy-50/60 px-3 py-2.5 text-[11px]">
                    <span className="flex items-center gap-1.5 font-semibold text-ink-soft">
                      <Clock3 className="size-3.5 text-ink-faint" />
                      Belum memilih
                    </span>
                    <span className="font-bold text-ink">
                      {formatNumber(unset)}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </section>
        </>
      ) : null}

      {user.role === "kaprodi" ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Menunggu Verifikasi"
              value={pending}
              icon={<Clock3 className="size-5" />}
              tone="amber"
              badge={pending > 0 ? "Perlu ditinjau" : "Bersih"}
              caption="Pengajuan masuk antrean"
              loading={dashboard.loading}
            />
            <StatCard
              label="Disetujui"
              value={approved}
              icon={<CheckCircle2 className="size-5" />}
              tone="sa"
              badge={`${percent(approved, totalSkripsi)}% dari skripsi`}
              caption="Lolos verifikasi"
              loading={dashboard.loading}
            />
            <StatCard
              label="Ditolak"
              value={rejected}
              icon={<XCircle className="size-5" />}
              tone="rose"
              badge={`${percent(rejected, totalSkripsi)}% dari skripsi`}
              caption="Perlu perbaikan mahasiswa"
              loading={dashboard.loading}
            />
            <StatCard
              label="Total Mahasiswa"
              value={totalMahasiswa}
              icon={<Users className="size-5" />}
              tone="bi"
              badge={`${percent(totalMemilih, totalMahasiswa)}% memilih`}
              caption={`${formatNumber(totalMemilih)} sudah punya peminatan`}
              loading={dashboard.loading}
            />
          </section>

          <KaprodiVerification
            pending={pendingItems}
            all={allItems}
            loading={pendingQuery.loading || recent.loading}
            error={pendingQuery.error ?? recent.error}
            onRefresh={() => {
              pendingQuery.refetch();
              recent.refetch();
            }}
          />

          <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <Card>
              <CardHeader
                title="Pemetaan Peminatan per Angkatan"
                description="Perbandingan Business Intelligence dan Smart Agriculture pada tiap angkatan."
                icon={<ChartPie className="size-5" />}
                action={
                  <Link
                    to="/pemetaan"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-bi-600 hover:text-bi-700"
                  >
                    Detail pemetaan
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                }
              />
              <div className="mt-5">
                <PeminatanChart
                  data={pemetaanQuery.data?.byAngkatan ?? []}
                  loading={pemetaanQuery.loading}
                  error={pemetaanQuery.error}
                  onRetry={pemetaanQuery.refetch}
                  height={280}
                />
              </div>
            </Card>

            <div className="space-y-4">
              <QuickActions role="kaprodi" />
              <Card>
                <CardHeader
                  title="Status Repository"
                  description="Komposisi seluruh pengajuan."
                  icon={<TrendingUp className="size-5" />}
                />
                {dashboard.loading ? (
                  <div className="mt-4 space-y-3">
                    {STATUS_ORDER.map((status) => (
                      <Skeleton key={status} className="h-9 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    {STATUS_ORDER.map((status) => {
                      const value = statusCounts[status];
                      return (
                        <div
                          key={status}
                          className="flex items-center justify-between gap-3 rounded-input border border-navy-50 bg-canvas/60 px-3 py-2"
                        >
                          <span className="flex items-center gap-2 text-[11px] font-semibold text-ink-soft">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: STATUS_META[status].color }}
                            />
                            {STATUS_META[status].label}
                          </span>
                          <span className="text-[11px] font-bold text-ink">
                            {formatNumber(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </section>
        </>
      ) : null}

      {user.role === "tendik" ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Mahasiswa"
              value={totalMahasiswa}
              icon={<GraduationCap className="size-5" />}
              tone="bi"
              badge={`${percent(totalMemilih, totalMahasiswa)}% memilih`}
              caption="Terdaftar di sistem"
              to="/mahasiswa"
              loading={dashboard.loading}
            />
            <StatCard
              label="Total Skripsi"
              value={totalSkripsi}
              icon={<Library className="size-5" />}
              tone="navy"
              badge={`${formatNumber(approved)} disetujui`}
              caption="Seluruh repository"
              to="/repository"
              loading={dashboard.loading}
            />
            <StatCard
              label="Menunggu Verifikasi"
              value={pending}
              icon={<Clock3 className="size-5" />}
              tone="amber"
              badge={`${percent(pending, totalSkripsi)}% dari skripsi`}
              caption="Antrean Kaprodi"
              loading={dashboard.loading}
            />
            <StatCard
              label="Belum Memilih"
              value={unset}
              icon={<UserRound className="size-5" />}
              tone="sa"
              badge={`${percent(unset, totalMahasiswa)}% mahasiswa`}
              caption="Perlu diarahkan ke peminatan"
              loading={dashboard.loading}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
            <TendikRepositoryTable
              items={allItems.slice(0, 6)}
              loading={recent.loading}
              error={recent.error}
              onRetry={recent.refetch}
            />
            <div className="space-y-4">
              <QuickActions role="tendik" />
              <Card>
                <CardHeader
                  title="Kesiapan Data"
                  description="Kelengkapan peminatan mahasiswa."
                  icon={<Target className="size-5" />}
                  action={
                    <Badge tone="bi" size="xs" dot>
                      {percent(totalMemilih, totalMahasiswa)}%
                    </Badge>
                  }
                />
                {dashboard.loading ? (
                  <div className="mt-4 space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-2.5 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-2.5 w-full" />
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <ShareBar
                      label="Business Intelligence"
                      value={peminatanCounts.bi}
                      total={Math.max(1, totalMahasiswa)}
                      tone="bi"
                      icon={<BrainCircuit className="size-3.5" />}
                    />
                    <ShareBar
                      label="Smart Agriculture"
                      value={peminatanCounts.sa}
                      total={Math.max(1, totalMahasiswa)}
                      tone="sa"
                      icon={<Sprout className="size-3.5" />}
                    />
                    <div className="flex items-start gap-2 rounded-input border border-amber-200/70 bg-amber-50/70 px-3 py-2.5">
                      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                      <p className="text-[11px] leading-relaxed text-amber-800/90">
                        {unset > 0
                          ? `${formatNumber(unset)} mahasiswa belum memilih peminatan. Lengkapi melalui menu Data Mahasiswa.`
                          : "Seluruh mahasiswa sudah memiliki peminatan. Data siap dipakai untuk pemetaan prodi."}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </section>
        </>
      ) : null}

      <p className="pb-1 text-center text-[10px] text-ink-faint">
        Data dimuat otomatis setiap halaman dibuka ·{" "}
        {longDateLabel(now)}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function StudentHero({
  user,
  now,
  latest,
  loading,
  firstName,
}: {
  user: User;
  now: Date;
  latest: Skripsi | null;
  loading: boolean;
  firstName: string;
}) {
  const roleMeta = ROLE_META[user.role];
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden rounded-panel bg-hero-navy p-5 text-white shadow-elevated sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-80" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-dot-grid bg-[size:22px_22px] opacity-25"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-gold-400/15 blur-3xl animate-drift"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-28 left-1/4 size-72 rounded-full bg-sa-400/10 blur-3xl animate-drift [animation-delay:-8s]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-10 top-10 hidden size-56 rounded-full border border-white/10 lg:block"
        aria-hidden="true"
      >
        <span className="absolute inset-4 rounded-full border border-dashed border-white/10" />
        <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-gold-300 shadow-[0_0_18px_rgba(245,197,24,0.8)]" />
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={roleMeta.tone} size="sm" className="ring-0">
              <Sparkles className="size-3" />
              {roleMeta.label}
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/60">
              <CalendarDays className="size-3.5" />
              {longDateLabel(now)}
            </span>
          </div>

          <h1 className="mt-5 font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-[38px]">
            {greeting()}, {firstName}
            <span className="ml-1 inline-block animate-float">👋</span>
          </h1>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/65">
            Pantau perjalanan skripsimu, temukan referensi, dan pastikan data
            akademik tetap lengkap dalam satu tempat.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Button
              variant="gold"
              size="md"
              icon={<FilePlus2 />}
              onClick={() => navigate("/pengajuan")}
            >
              Ajukan skripsi
            </Button>
            <Link
              to="/repository"
              className="inline-flex h-11 items-center gap-2 rounded-input border border-white/15 bg-white/[0.07] px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/[0.13] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <Library className="size-4" />
              Jelajahi repository
            </Link>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-row items-center gap-3 rounded-card border border-white/10 bg-white/[0.07] p-3 backdrop-blur-md sm:max-w-[320px] sm:p-4 lg:flex-col lg:items-stretch">
          <div className="flex items-center gap-3">
            <Avatar
              name={user.nama}
              src={user.avatarUrl}
              size="lg"
              className="ring-white/20"
            />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                Waktu Indonesia Barat
              </p>
              <p className="mt-0.5 font-display text-[28px] font-extrabold leading-none tabular-nums">
                {timeLabel(now)}
              </p>
              <p className="mt-1 truncate text-[10px] text-white/50">
                {user.email}
              </p>
            </div>
          </div>
          <div className="hidden h-px w-full bg-white/10 sm:block" />
          <div className="hidden items-center justify-between gap-2 text-[10px] text-white/55 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sa-400" />
              Sesi aktif
            </span>
            <span>Fakultas Teknik UNIRA</span>
          </div>
        </div>
      </div>

      <div className="relative mt-6 rounded-card border border-white/10 bg-navy-950/25 p-4 backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-input bg-white/[0.08] text-gold-300 ring-1 ring-white/10">
              <GraduationCap className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Status pengajuan terakhir
              </p>
              <p className="mt-0.5 truncate text-sm font-bold">
                {loading
                  ? "Memuat status…"
                  : latest
                    ? truncate(latest.judul, 70)
                    : "Belum ada pengajuan skripsi"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {latest ? (
              <StatusBadge status={latest.status} size="sm" />
            ) : (
              <Badge tone="slate" size="sm" className="ring-0">
                Mulai dari sini
              </Badge>
            )}
            {latest ? (
              <Link
                to={`/repository/${latest.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3 text-[10px] font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Lihat detail
                <ArrowUpRight className="size-3" />
              </Link>
            ) : (
              <Link
                to="/pengajuan"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3 text-[10px] font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Buat pengajuan
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>

        <StatusStepper item={latest} loading={loading} />
      </div>
    </section>
  );
}

function StatusStepper({
  item,
  loading,
}: {
  item: Skripsi | null;
  loading: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const steps = ["Diajukan", "Diverifikasi", "Disetujui"];

  const completed = !item
    ? 0
    : item.status === "draft"
      ? 0
      : item.status === "diajukan"
        ? 1
        : item.status === "ditolak"
          ? 2
          : 3;
  const progress = Math.min(100, (completed / 3) * 100);

  return (
    <div className="mt-4">
      <div className="relative">
        <div className="absolute left-4 right-4 top-4 h-px bg-white/15 sm:left-5 sm:right-5" aria-hidden="true" />
        <div className="absolute left-4 right-4 top-4 h-px overflow-hidden sm:left-5 sm:right-5" aria-hidden="true">
          {reduceMotion ? (
            <div
              className="h-full origin-left bg-gradient-to-r from-gold-300 via-gold-400 to-sa-400"
              style={{ width: `${progress}%` }}
            />
          ) : (
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-gold-300 via-gold-400 to-sa-400"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </div>

        <ol className="relative grid grid-cols-3 gap-2">
          {steps.map((label, index) => {
            const done = completed > index;
            const isRejected = item?.status === "ditolak" && index === 2;
            const isCurrent =
              Boolean(item) &&
              completed <= index &&
              !(item?.status === "disetujui") &&
              !(item?.status === "ditolak" && index > 2);
            return (
              <li key={label} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "relative z-10 grid size-8 place-items-center rounded-full border text-[11px] font-extrabold transition-colors sm:size-9",
                    isRejected
                      ? "border-coral-400 bg-coral-500 text-white"
                      : done
                        ? "border-sa-400 bg-sa-400 text-navy-900"
                        : isCurrent
                          ? "border-gold-300 bg-navy-900 text-gold-300"
                          : "border-white/20 bg-navy-900/80 text-white/35",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isRejected ? (
                    <XCircle className="size-4" />
                  ) : done ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.1em]",
                    isRejected
                      ? "text-coral-300"
                      : done || isCurrent
                        ? "text-white/80"
                        : "text-white/35",
                  )}
                >
                  {isRejected ? "Ditolak" : label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-white/45 sm:text-left">
        {loading
          ? "Memuat status pengajuan…"
          : item?.status === "disetujui"
            ? "Selamat! Skripsi kamu sudah lolos verifikasi dan tampil di repository."
            : item?.status === "ditolak"
              ? "Pengajuan ditolak. Perbaiki data atau berkas, lalu ajukan kembali."
              : item?.status === "diajukan"
                ? "Pengajuan sedang menunggu keputusan Kaprodi. Kamu akan melihat perubahan status di sini."
                : item?.status === "draft"
                  ? "Draft tersimpan. Lengkapi berkas PDF lalu ajukan untuk diverifikasi."
                  : "Belum ada pengajuan. Mulai dengan membuat judul dan mengunggah PDF."}
      </p>
    </div>
  );
}

function StaffHero({
  user,
  now,
  firstName,
  description,
}: {
  user: User;
  now: Date;
  firstName: string;
  description: string;
}) {
  const roleMeta = ROLE_META[user.role];
  const navigate = useNavigate();
  const action =
    user.role === "kaprodi"
      ? { label: "Tinjau pengajuan", to: "/persetujuan", icon: BadgeCheck }
      : { label: "Kelola mahasiswa", to: "/mahasiswa", icon: Users };

  return (
    <section className="relative overflow-hidden rounded-panel border border-white/80 bg-gradient-to-br from-white via-canvas to-navy-50/70 p-5 shadow-soft sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-bi-200/30 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-sa-200/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-40" aria-hidden="true" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={roleMeta.tone} size="sm" dot>
              {roleMeta.label}
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-faint">
              <CalendarDays className="size-3.5" />
              {longDateLabel(now)}
            </span>
          </div>
          <h1 className="mt-4 font-display text-[26px] font-extrabold leading-tight tracking-tight text-ink sm:text-[34px]">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-card border border-white/80 bg-white/70 px-3 py-2 shadow-soft backdrop-blur">
            <Avatar name={user.nama} src={user.avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                Waktu server lokal
              </p>
              <p className="font-display text-sm font-extrabold tabular-nums text-ink">
                {timeLabel(now)}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={<action.icon />}
            onClick={() => navigate(action.to)}
          >
            {action.label}
          </Button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Student sections                                                           */
/* -------------------------------------------------------------------------- */

function OwnSubmissions({
  items,
  loading,
  error,
  onRetry,
}: {
  items: Skripsi[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <Card padded={false}>
      <div className="p-5 pb-3 sm:p-6 sm:pb-3">
        <CardHeader
          title="Pengajuan Saya"
          description="Skripsi yang dibuat atau dilacak dari perangkat ini."
          icon={<FileText className="size-5" />}
          action={
            <Link
              to="/pengajuan"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-bi-600 hover:text-bi-700"
            >
              Kelola
              <ArrowUpRight className="size-3.5" />
            </Link>
          }
        />
      </div>

      {loading ? (
        <div className="px-5 pb-5 sm:px-6">
          <TableSkeleton rows={3} />
        </div>
      ) : error ? (
        <div className="px-5 pb-5 sm:px-6">
          <EmptyState
            compact
            title="Gagal memuat pengajuan"
            description={error}
            action={
              <Button variant="secondary" size="sm" icon={<RefreshCw />} onClick={onRetry}>
                Coba lagi
              </Button>
            }
          />
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 pb-5 sm:px-6">
          <EmptyState
            compact
            icon={<FilePlus2 className="size-5" />}
            title="Belum ada pengajuan"
            description="Ajukan skripsi pertamamu, lalu pantau status verifikasinya langsung dari dashboard."
            action={
              <Link to="/pengajuan">
                <Button size="sm" icon={<FilePlus2 />}>
                  Buat pengajuan
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-navy-50">
          {items.slice(0, 4).map((item) => (
            <li key={item.id} className="group px-5 py-4 transition hover:bg-navy-50/30 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-input bg-bi-50 text-bi-600 ring-1 ring-bi-100">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={item.status} size="xs" />
                    <PeminatanBadge value={item.peminatan} size="xs" short />
                    <span className="text-[10px] text-ink-faint">#{item.id}</span>
                  </div>
                  <Link
                    to={`/repository/${item.id}`}
                    className="mt-1.5 block line-clamp-2 text-xs font-bold leading-relaxed text-ink transition hover:text-bi-600"
                  >
                    {item.judul}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-faint">
                    <span>{item.tahun}</span>
                    <span>Diajukan {formatDate(item.createdAt)}</span>
                    {item.fileUrl ? (
                      <SkripsiPdfButton
                        id={item.id}
                        title={item.judul}
                        variant="ghost"
                        size="sm"
                        label="PDF"
                        className="h-auto px-0 text-[10px] font-bold text-bi-600 hover:bg-transparent hover:text-bi-700"
                      />
                    ) : (
                      <span className="text-amber-600">Berkas belum ada</span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/repository/${item.id}`}
                  className="mt-1 grid size-9 shrink-0 place-items-center rounded-input text-ink-faint transition hover:bg-white hover:text-bi-600"
                  aria-label={`Lihat detail ${item.judul}`}
                >
                  <Eye className="size-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ActivityTimeline({
  items,
  personal,
  loading,
  error,
  onRetry,
}: {
  items: Skripsi[];
  personal: boolean;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const visible = items.slice(0, 4);

  return (
    <Card>
      <CardHeader
        title={personal ? "Linimasa Skripsi Saya" : "Aktivitas Repository"}
        description={
          personal
            ? "Perjalanan pengajuan dan keputusan terbaru."
            : "Karya terbaru yang masuk ke repository."
        }
        icon={<TrendingUp className="size-5" />}
        action={
          <Link
            to="/repository"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-bi-600 hover:text-bi-700"
          >
            Semua
            <ArrowRight className="size-3.5" />
          </Link>
        }
      />

      {loading ? (
        <div className="mt-5 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-4">
          <EmptyState
            compact
            title="Gagal memuat aktivitas"
            description={error}
            action={
              <Button variant="secondary" size="sm" icon={<RefreshCw />} onClick={onRetry}>
                Coba lagi
              </Button>
            }
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            compact
            icon={<Sparkles className="size-5" />}
            title="Belum ada aktivitas"
            description="Aktivitas pengajuan dan publikasi skripsi akan tampil di sini."
          />
        </div>
      ) : (
        <ol className="mt-5">
          {visible.map((item, index) => (
            <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
              {index < visible.length - 1 ? (
                <span
                  className="absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-px bg-navy-100"
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 border-white shadow-soft ring-1",
                  item.status === "disetujui"
                    ? "bg-sa-50 text-sa-600 ring-sa-100"
                    : item.status === "ditolak"
                      ? "bg-rose-50 text-rose-600 ring-rose-100"
                      : item.status === "diajukan"
                        ? "bg-amber-50 text-amber-600 ring-amber-100"
                        : "bg-navy-50 text-navy-600 ring-navy-100",
                )}
              >
                {item.status === "disetujui" ? (
                  <CheckCircle2 className="size-3.5" />
                ) : item.status === "ditolak" ? (
                  <XCircle className="size-3.5" />
                ) : item.status === "diajukan" ? (
                  <Clock3 className="size-3.5" />
                ) : (
                  <FileText className="size-3.5" />
                )}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <Link
                  to={`/repository/${item.id}`}
                  className="line-clamp-2 text-[11px] font-bold leading-relaxed text-ink transition hover:text-bi-600"
                >
                  {item.judul}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StatusBadge status={item.status} size="xs" />
                  <span className="text-[10px] text-ink-faint">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Kaprodi verification                                                       */
/* -------------------------------------------------------------------------- */

type VerificationRow = {
  id: number;
  item: Skripsi;
};

type DecisionTarget = {
  item: Skripsi;
  action: "approve" | "reject";
};

function KaprodiVerification({
  pending,
  all,
  loading,
  error,
  onRefresh,
}: {
  pending: Skripsi[];
  all: Skripsi[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<DecisionTarget | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const highlightTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const rows = useMemo(() => {
    const map = new Map<number, VerificationRow>();
    for (const item of pending) {
      map.set(item.id, { id: item.id, item });
    }
    for (const item of all) {
      if (map.has(item.id)) continue;
      if (item.status === "disetujui" || item.status === "ditolak") {
        map.set(item.id, { id: item.id, item });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const pendingA = a.item.status === "diajukan" ? 1 : 0;
      const pendingB = b.item.status === "diajukan" ? 1 : 0;
      if (pendingA !== pendingB) return pendingB - pendingA;
      const dateA = a.item.createdAt ? new Date(a.item.createdAt).getTime() : 0;
      const dateB = b.item.createdAt ? new Date(b.item.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [pending, all]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter(({ item }) => {
      const matchStatus = !statusFilter || item.status === statusFilter;
      const matchSearch =
        !keyword ||
        item.judul.toLowerCase().includes(keyword) ||
        item.nim.toLowerCase().includes(keyword) ||
        (item.namaMahasiswa ?? "").toLowerCase().includes(keyword);
      return matchStatus && matchSearch;
    });
  }, [rows, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / VERIFICATION_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (currentPage - 1) * VERIFICATION_PAGE_SIZE,
    currentPage * VERIFICATION_PAGE_SIZE,
  );

  const pendingCount = rows.filter((row) => row.item.status === "diajukan").length;
  const hasFilters = Boolean(search || statusFilter);

  const handleDecision = async () => {
    if (!target) return;
    setDeciding(true);
    try {
      if (target.action === "approve") {
        await persetujuanService.approve(target.item.id);
        toast.success(
          "Skripsi disetujui",
          `“${truncate(target.item.judul, 64)}” berhasil disetujui.`,
        );
      } else {
        await persetujuanService.reject(target.item.id);
        toast.warning(
          "Skripsi ditolak",
          `“${truncate(target.item.judul, 64)}” ditolak. Mahasiswa dapat memperbaikinya.`,
        );
      }
      setHighlightId(target.item.id);
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(() => setHighlightId(null), 2200);
      setTarget(null);
      setPage(1);
      onRefresh();
    } catch (err) {
      toast.error("Gagal memproses", getApiErrorMessage(err));
    } finally {
      setDeciding(false);
    }
  };

  const columns: DataColumn<VerificationRow>[] = [
    {
      key: "mahasiswa",
      header: "Mahasiswa",
      render: ({ item }) => {
        const name = item.namaMahasiswa ?? `Mahasiswa NIM ${item.nim}`;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink">{name}</p>
              <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                {item.nim}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "judul",
      header: "Judul Skripsi",
      className: "max-w-[320px]",
      render: ({ item }) => (
        <Link
          to={`/repository/${item.id}`}
          title={item.judul}
          className="line-clamp-2 text-xs font-semibold leading-relaxed text-ink transition hover:text-bi-600"
        >
          {item.judul}
        </Link>
      ),
    },
    {
      key: "peminatan",
      header: "Peminatan",
      render: ({ item }) => <PeminatanBadge value={item.peminatan} size="xs" short />,
    },
    {
      key: "tanggal",
      header: "Tanggal",
      render: ({ item }) => (
        <span className="whitespace-nowrap text-[11px] text-ink-soft">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: ({ item }) => <StatusBadge status={item.status} size="xs" />,
    },
    {
      key: "aksi",
      header: <span className="sr-only">Aksi</span>,
      className: "text-right",
      headerClassName: "text-right",
      render: ({ item }) => (
        <div className="flex items-center justify-end gap-1">
          <IconAction
            label={`Review ${item.judul}`}
            icon={<Eye className="size-4" />}
            onClick={() => navigate(`/repository/${item.id}`)}
          />
          {item.status === "diajukan" ? (
            <>
              <IconAction
                label={`Setujui ${item.judul}`}
                icon={<CheckCircle2 className="size-4" />}
                tone="mint"
                onClick={() => setTarget({ item, action: "approve" })}
              />
              <IconAction
                label={`Tolak ${item.judul}`}
                icon={<XCircle className="size-4" />}
                tone="danger"
                onClick={() => setTarget({ item, action: "reject" })}
              />
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <Card padded={false}>
      <div className="border-b border-navy-50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-input bg-bi-50 text-bi-600 ring-1 ring-bi-100">
              <BadgeCheck className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-ink">Verifikasi Skripsi</h2>
                {pendingCount > 0 ? (
                  <Badge tone="amber" size="xs" dot>
                    {formatNumber(pendingCount)} menunggu
                  </Badge>
                ) : (
                  <Badge tone="sa" size="xs" dot>
                    Semua diproses
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                {formatNumber(filtered.length)} pengajuan tampil · klik judul untuk
                membuka detail
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Cari judul, nama, atau NIM…"
              icon={Search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              wrapperClassName="sm:w-60"
              aria-label="Cari pengajuan skripsi"
            />
            <SelectMenu
              label=""
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "", label: "Semua status", hint: "Semua keputusan" },
                { value: "diajukan", label: "Menunggu", hint: "Perlu ditinjau" },
                { value: "disetujui", label: "Disetujui", hint: "Lolos verifikasi" },
                { value: "ditolak", label: "Ditolak", hint: "Perlu perbaikan" },
              ]}
              className="sm:w-44"
            />
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                }}
              >
                Reset
              </Button>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw />}
              onClick={onRefresh}
              loading={loading}
              className="shrink-0"
            >
              Muat ulang
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-3 flex flex-col items-start gap-2 rounded-input border border-coral-200 bg-coral-50/80 px-3 py-2 text-[11px] text-coral-700 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <Button variant="secondary" size="sm" icon={<RefreshCw />} onClick={onRefresh}>
              Coba lagi
            </Button>
          </div>
        ) : null}
      </div>

      <div className="p-4 sm:p-5">
        <DataTable
          rows={pageRows}
          columns={columns}
          loading={loading}
          stickyHeader
          caption="Daftar pengajuan skripsi untuk diverifikasi"
          rowClassName={(row) =>
            cn(
              highlightId === row.id && "bg-sa-50/70",
              row.item.status === "diajukan" && "bg-amber-50/20",
            )
          }
          empty={
            <EmptyState
              icon={hasFilters ? <Search className="size-5" /> : <CheckCircle2 className="size-5" />}
              title={
                hasFilters
                  ? "Tidak ada pengajuan yang cocok"
                  : "Tidak ada pengajuan menunggu"
              }
              description={
                hasFilters
                  ? "Coba ubah kata kunci atau filter status."
                  : "Semua pengajuan sudah diproses. Pengajuan baru akan muncul otomatis saat mahasiswa mengirimkannya."
              }
              action={
                hasFilters ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("");
                    }}
                  >
                    Reset filter
                  </Button>
                ) : undefined
              }
            />
          }
          renderMobile={(row) => {
            const item = row.item;
            const name = item.namaMahasiswa ?? `Mahasiswa NIM ${item.nim}`;
            return (
              <article className="rounded-card border border-navy-100/70 bg-white p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <Avatar name={name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink">{name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                      {item.nim}
                    </p>
                  </div>
                  <StatusBadge status={item.status} size="xs" />
                </div>
                <Link
                  to={`/repository/${item.id}`}
                  className="mt-3 line-clamp-3 text-xs font-semibold leading-relaxed text-ink"
                >
                  {item.judul}
                </Link>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <PeminatanBadge value={item.peminatan} size="xs" short />
                  <span className="text-[10px] text-ink-faint">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-navy-50 pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Eye />}
                    onClick={() => navigate(`/repository/${item.id}`)}
                  >
                    Review
                  </Button>
                  {item.status === "diajukan" ? (
                    <>
                      <Button
                        variant="mint"
                        size="sm"
                        icon={<CheckCircle2 />}
                        onClick={() => setTarget({ item, action: "approve" })}
                      >
                        Setujui
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<XCircle />}
                        onClick={() => setTarget({ item, action: "reject" })}
                      >
                        Tolak
                      </Button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          }}
        />

        {filtered.length > 0 ? (
          <Pagination
            total={filtered.length}
            page={currentPage}
            pageSize={VERIFICATION_PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="pengajuan"
            className="mt-4"
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={() => void handleDecision()}
        title={target?.action === "approve" ? "Setujui skripsi ini?" : "Tolak skripsi ini?"}
        description={
          target
            ? `${target.item.namaMahasiswa ?? `NIM ${target.item.nim}`} — “${truncate(target.item.judul, 86)}”`
            : ""
        }
        confirmLabel={target?.action === "approve" ? "Ya, setujui" : "Ya, tolak"}
        tone={target?.action === "approve" ? "mint" : "danger"}
        loading={deciding}
      >
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ink-soft">
            {target?.action === "approve"
              ? "Skripsi akan berstatus disetujui dan tampil sebagai karya yang lolos verifikasi di repository."
              : "Skripsi akan berstatus ditolak. Mahasiswa masih dapat memperbaiki data dan mengajukannya kembali."}
          </p>
          {target?.item.fileUrl ? (
            <SkripsiPdfButton
              id={target.item.id}
              title={target.item.judul}
              mode="open"
              variant="secondary"
              size="sm"
              label="Periksa berkas PDF"
              className="w-fit"
            />
          ) : (
            <div className="flex items-start gap-2 rounded-input border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700">
              <FileText className="mt-0.5 size-3.5 shrink-0" />
              Pengajuan ini belum memiliki berkas PDF. Pertimbangkan kondisi tersebut
              sebelum memberi keputusan.
            </div>
          )}
        </div>
      </ConfirmDialog>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Tendik sections                                                            */
/* -------------------------------------------------------------------------- */

function TendikRepositoryTable({
  items,
  loading,
  error,
  onRetry,
}: {
  items: Skripsi[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Card padded={false}>
      <div className="p-5 pb-3 sm:p-6 sm:pb-3">
        <CardHeader
          title="Skripsi Terbaru"
          description="Enam data terakhir yang masuk ke repository."
          icon={<Library className="size-5" />}
          action={
            <Link
              to="/repository"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-bi-600 hover:text-bi-700"
            >
              Lihat semua
              <ArrowRight className="size-3.5" />
            </Link>
          }
        />
      </div>

      {error ? (
        <div className="px-5 pb-5 sm:px-6">
          <EmptyState
            compact
            title="Gagal memuat skripsi"
            description={error}
            action={
              <Button variant="secondary" size="sm" icon={<RefreshCw />} onClick={onRetry}>
                Coba lagi
              </Button>
            }
          />
        </div>
      ) : (
        <div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="table-head">
                <th className="px-6 py-2.5 font-bold">Judul &amp; Mahasiswa</th>
                <th className="px-3 py-2.5 font-bold">Peminatan</th>
                <th className="px-3 py-2.5 font-bold">Status</th>
                <th className="px-3 py-2.5 font-bold">Tahun</th>
                <th className="px-3 py-2.5 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="table-row">
                      <td colSpan={5} className="px-6 py-3">
                        <Skeleton className="h-9 w-full" />
                      </td>
                    </tr>
                  ))
                : items.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="px-6 py-3">
                        <Link
                          to={`/repository/${item.id}`}
                          title={item.judul}
                          className="block max-w-md truncate text-xs font-bold text-ink transition hover:text-bi-600"
                        >
                          {item.judul}
                        </Link>
                        <p className="mt-1 text-[10px] text-ink-faint">
                          NIM {item.nim} · {item.programStudi}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <PeminatanBadge value={item.peminatan} size="xs" short />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={item.status} size="xs" />
                      </td>
                      <td className="px-3 py-3 text-[11px] font-semibold text-ink-soft">
                        {item.tahun}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IconAction
                            label={`Lihat detail ${item.judul}`}
                            icon={<Eye className="size-4" />}
                            onClick={() => navigate(`/repository/${item.id}`)}
                          />
                          {item.fileUrl ? (
                            <SkripsiPdfButton
                              id={item.id}
                              title={item.judul}
                              variant="ghost"
                              size="sm"
                              label="PDF"
                              className="h-auto px-0 text-[11px] font-bold text-bi-600 hover:bg-transparent hover:text-bi-700"
                            />
                          ) : (
                            <span className="pr-2 text-[10px] text-ink-faint">
                              Tanpa berkas
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!loading && items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                compact
                icon={<Library className="size-5" />}
                title="Repository masih kosong"
                description="Belum ada skripsi yang tercatat di sistem."
              />
            </div>
          ) : null}
          </div>

          {loading ? (
            <div className="p-5 lg:hidden">
              <TableSkeleton rows={3} />
            </div>
          ) : null}

          {!loading && items.length === 0 ? (
            <div className="p-4 lg:hidden">
              <EmptyState
                compact
                icon={<Library className="size-5" />}
                title="Repository masih kosong"
                description="Belum ada skripsi yang tercatat di sistem."
              />
            </div>
          ) : null}

          <div className="grid gap-3 p-4 lg:hidden">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-card border border-navy-100/70 bg-white p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge status={item.status} size="xs" />
                  <span className="text-[10px] text-ink-faint">{item.tahun}</span>
                </div>
                <Link
                  to={`/repository/${item.id}`}
                  className="mt-2 line-clamp-3 text-xs font-bold leading-relaxed text-ink"
                >
                  {item.judul}
                </Link>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <PeminatanBadge value={item.peminatan} size="xs" short />
                  <span className="text-[10px] text-ink-faint">NIM {item.nim}</span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-navy-50 pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Eye />}
                    onClick={() => navigate(`/repository/${item.id}`)}
                    className="flex-1"
                  >
                    Detail
                  </Button>
                  {item.fileUrl ? (
                    <SkripsiPdfButton
                      id={item.id}
                      title={item.judul}
                      variant="secondary"
                      size="sm"
                      label="PDF"
                      className="flex-1"
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

function QuickActions({ role }: { role: Role }) {
  return (
    <Card>
      <CardHeader
        title="Akses Cepat"
        description="Pintasan sesuai peranmu."
        icon={<Sparkles className="size-5" />}
      />
      <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
        {QUICK_ACTIONS[role].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group flex min-h-14 items-center gap-3 rounded-input border border-navy-50 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-navy-100 hover:bg-navy-50/40 hover:shadow-soft"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-input ring-1",
                QUICK_TONES[action.tone],
              )}
            >
              <action.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-ink">{action.title}</span>
              <span className="mt-0.5 block truncate text-[10px] text-ink-soft">
                {action.description}
              </span>
            </span>
            <ArrowUpRight className="size-3.5 shrink-0 text-ink-faint transition group-hover:text-bi-500" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

function ShareBar({
  label,
  value,
  total,
  tone,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  tone: "bi" | "sa";
  icon: ReactNode;
}) {
  const share = percent(value, total);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="flex items-center gap-1.5 font-semibold text-ink-soft">
          <span className={tone === "bi" ? "text-bi-500" : "text-sa-500"}>{icon}</span>
          {label}
        </span>
        <span className="font-bold text-ink">{share}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy-50">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700",
            tone === "bi"
              ? "bg-gradient-to-r from-bi-500 to-violet-400"
              : "bg-gradient-to-r from-sa-500 to-teal-300",
          )}
          style={{ width: `${Math.min(100, share)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-ink-faint">
        {formatNumber(value)} mahasiswa
      </p>
    </div>
  );
}

function IconAction({
  label,
  icon,
  onClick,
  tone = "slate",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: "slate" | "mint" | "danger";
}) {
  const toneClass = {
    slate:
      "text-ink-faint hover:border-bi-200 hover:bg-bi-50 hover:text-bi-600",
    mint: "text-sa-600 hover:border-sa-200 hover:bg-sa-50",
    danger: "text-coral-500 hover:border-coral-200 hover:bg-coral-50",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "grid size-11 place-items-center rounded-input border border-transparent transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400",
        toneClass,
      )}
    >
      {icon}
    </button>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-coral-200 bg-coral-50/80 px-4 py-3 text-xs text-coral-700 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-medium">{message}</p>
      <Button variant="secondary" size="sm" icon={<RefreshCw />} onClick={onRetry}>
        Coba lagi
      </Button>
    </div>
  );
}
