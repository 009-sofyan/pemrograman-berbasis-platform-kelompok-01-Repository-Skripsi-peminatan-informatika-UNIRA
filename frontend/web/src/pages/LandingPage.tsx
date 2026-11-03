import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChartPie,
  ChevronRight,
  Download,
  GraduationCap,
  Layers3,
  LibraryBig,
  LogIn,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApiQuery } from "../hooks/useApiQuery";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { pemetaanService } from "../services/dashboardService";
import { skripsiService } from "../services/skripsiService";
import { BI, CURRENT_YEAR, SA } from "../constants";
import type { PemetaanAngkatan, Skripsi } from "../types";
import { formatDate, formatNumber, percent } from "../lib/format";
import { cn } from "../lib/cn";
import { Logo } from "../components/layout/Logo";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { CardSkeleton, Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { SelectMenu } from "../components/ui/SelectMenu";
import { SkripsiCard } from "../components/skripsi/SkripsiCard";
import { SkripsiCover } from "../components/skripsi/SkripsiCover";
import { SkripsiPdfButton } from "../components/skripsi/SkripsiPdfButton";

type CatalogTab = "all" | typeof BI | typeof SA;
type CatalogOrder = "newest" | "oldest" | "year";

const PAGE_SIZE = 8;
const NAV_LINKS = [
  { label: "Beranda", href: "#beranda" },
  { label: "Katalog", href: "#katalog" },
  { label: "Pemetaan", href: "#pemetaan" },
  { label: "Peminatan", href: "#peminatan" },
];

const TABS: { value: CatalogTab; label: string; short: string }[] = [
  { value: "all", label: "Semua karya", short: "Semua" },
  { value: BI, label: "Business Intelligence", short: "BI" },
  { value: SA, label: "Smart Agriculture", short: "SA" },
];

const WORKFLOW_STEPS = [
  {
    code: "01",
    title: "Sumber data",
    description: "Skripsi, peminatan, dan angkatan dari prodi.",
    meta: "Input",
    icon: BookOpen,
  },
  {
    code: "02",
    title: "Kurasi & validasi",
    description: "Diverifikasi Kaprodi sebelum dipublikasikan.",
    meta: "Verified",
    icon: ShieldCheck,
  },
  {
    code: "03",
    title: "Repository pintar",
    description: "Telusuri abstrak, peminatan, dan akses PDF.",
    meta: "Output",
    icon: Layers3,
  },
];

const PEMINATAN_CONTENT = [
  {
    value: BI as typeof BI,
    code: "01",
    label: "Business Intelligence",
    icon: BrainCircuit,
    description:
      "Mengolah data menjadi wawasan yang membantu organisasi mengambil keputusan lebih cepat, terukur, dan berbasis bukti.",
    topics: ["Data Warehouse", "Dashboard", "Prediksi & Klasifikasi", "Analisis Bisnis"],
    tone: "bi" as const,
  },
  {
    value: SA as typeof SA,
    code: "02",
    label: "Smart Agriculture",
    icon: Sprout,
    description:
      "Menghubungkan teknologi dengan sektor pertanian untuk mendukung budidaya yang lebih presisi, efisien, dan berkelanjutan.",
    topics: ["IoT & Sensor", "Smart Farming", "Pengolahan Citra", "Sistem Monitoring"],
    tone: "sa" as const,
  },
];

function sortSkripsi(data: Skripsi[], order: CatalogOrder): Skripsi[] {
  const copy = [...data];
  if (order === "year") return copy.sort((a, b) => b.tahun - a.tahun);
  if (order === "oldest") {
    return copy.sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
    );
  }
  return copy.sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );
}

export default function LandingPage() {
  useDocumentTitle("Beranda");
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 250);
  const [tab, setTab] = useState<CatalogTab>("all");
  const [tahun, setTahun] = useState("");
  const [order, setOrder] = useState<CatalogOrder>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Skripsi | null>(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [showBi, setShowBi] = useState(true);
  const [showSa, setShowSa] = useState(true);
  const catalogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const query = useApiQuery(() => skripsiService.listPublic(), []);
  const pemetaanQuery = useApiQuery(() => pemetaanService.get(), []);

  const all = useMemo(
    () => (query.data?.data ?? []).filter((item) => item.status === "disetujui"),
    [query.data],
  );

  const biCount = all.filter((item) => item.peminatan === BI).length;
  const saCount = all.filter((item) => item.peminatan === SA).length;
  const latestYear = all.length > 0 ? Math.max(...all.map((item) => item.tahun)) : null;
  const statsUnavailable = query.loading || Boolean(query.error);

  const yearOptions = useMemo(() => {
    const values = new Set<string>();
    for (let year = CURRENT_YEAR; year >= 2018; year -= 1) values.add(String(year));
    all.forEach((item) => values.add(String(item.tahun)));
    return Array.from(values)
      .sort((a, b) => Number(b) - Number(a))
      .map((value) => ({ value, label: `Tahun ${value}` }));
  }, [all]);

  const filtered = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    const result = all.filter((item) => {
      if (tab !== "all" && item.peminatan !== tab) return false;
      if (tahun && String(item.tahun) !== tahun) return false;
      if (!keyword) return true;
      return (
        item.judul.toLowerCase().includes(keyword) ||
        (item.namaMahasiswa ?? "").toLowerCase().includes(keyword) ||
        item.nim.toLowerCase().includes(keyword)
      );
    });
    return sortSkripsi(result, order);
  }, [all, tab, tahun, order, debouncedSearch]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, tab, tahun, order]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const angkatanStats = useMemo(
    () =>
      [...(pemetaanQuery.data?.byAngkatan ?? [])].sort(
        (a, b) => Number(a.angkatan) - Number(b.angkatan),
      ),
    [pemetaanQuery.data],
  );

  const selectedAngkatan = useMemo(
    () => angkatanStats.find((item) => item.angkatan === selectedYear) ?? null,
    [angkatanStats, selectedYear],
  );

  const chartData = selectedAngkatan ? [selectedAngkatan] : angkatanStats;
  const chartYearOptions = useMemo(
    () => [
      { value: "", label: "Semua tahun", hint: "Kelompokkan per angkatan" },
      ...angkatanStats
        .slice()
        .reverse()
        .map((item) => ({
          value: item.angkatan,
          label: `Angkatan ${item.angkatan}`,
          hint: `${formatNumber(item.totalMahasiswa)} mahasiswa`,
        })),
    ],
    [angkatanStats],
  );

  const chartTotal = useMemo(
    () => chartData.reduce((sum, item) => sum + item.bi + item.sa, 0),
    [chartData],
  );

  const chartSummary = useMemo(() => {
    if (chartData.length === 0) return "Belum ada data pemetaan untuk ditampilkan.";
    const row = selectedAngkatan ?? null;
    if (row) {
      const winner = row.bi >= row.sa ? "BI" : "SA";
      const value = Math.max(row.bi, row.sa);
      return `${winner} mendominasi angkatan ${row.angkatan} sebesar ${percent(
        value,
        Math.max(1, row.bi + row.sa),
      )}%.`;
    }
    const totalBi = angkatanStats.reduce((sum, item) => sum + item.bi, 0);
    const totalSa = angkatanStats.reduce((sum, item) => sum + item.sa, 0);
    if (totalBi + totalSa === 0) return "Mahasiswa belum memilih peminatan.";
    const winner = totalBi >= totalSa ? "Business Intelligence" : "Smart Agriculture";
    return `${winner} mendominasi dengan ${formatNumber(Math.max(totalBi, totalSa))} mahasiswa dari ${formatNumber(totalBi + totalSa)} yang sudah memilih.`;
  }, [angkatanStats, chartData.length, selectedAngkatan]);

  const toggleSeries = (series: "bi" | "sa") => {
    if (series === "bi") setShowBi((value) => !value);
    else setShowSa((value) => !value);
  };

  const stats = [
    {
      label: "Total Skripsi",
      value: all.length,
      display: formatNumber(all.length),
      caption: "Karya terverifikasi di repository",
      icon: LibraryBig,
      format: "number" as const,
    },
    {
      label: "Pemetaan Peminatan",
      value: biCount + saCount,
      display: `${formatNumber(biCount)} BI · ${formatNumber(saCount)} SA`,
      caption: "Mahasiswa dengan peminatan riset",
      icon: ChartPie,
      format: "text" as const,
    },
    {
      label: "Tahun Terbaru",
      value: latestYear ?? 0,
      display: latestYear ? String(latestYear) : "—",
      caption: "Publikasi terakhir masuk",
      icon: CalendarDays,
      format: "text" as const,
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas">
      <a href="#konten" className="skip-link">
        Lewati ke konten utama
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled ? "py-2" : "py-3",
        )}
      >
        <div className="mx-auto w-full max-w-[1280px] px-3 sm:px-6">
          <div
            className={cn(
              "flex h-16 items-center gap-3 rounded-panel px-3 transition-all duration-300 sm:px-4",
              scrolled
                ? "glass border shadow-card"
                : "border border-transparent bg-transparent",
            )}
          >
            <Link to="/" className="min-w-0 shrink-0" aria-label="Beranda Repository Skripsi UNIRA">
              <Logo
                tone={scrolled ? "dark" : "light"}
                compact
                imageClassName="h-8 w-8 sm:h-10 sm:w-10"
                hideTextOnMobile
              />
            </Link>

            <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Navigasi beranda">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-input px-3.5 text-xs font-bold transition",
                    scrolled
                      ? "text-ink-soft hover:bg-navy-50 hover:text-ink"
                      : "text-white/75 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2 lg:ml-2">
              {user ? (
                <Link
                  to="/dashboard"
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 text-xs font-bold transition sm:px-4",
                    scrolled
                      ? "bg-[#F3F5FF] text-[#070812] hover:bg-white"
                      : "bg-[#F3F5FF] text-[#070812] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_18px_44px_-22px_rgba(165,180,252,0.75)] hover:bg-white",
                  )}
                >
                  <Layers3 className="size-4" />
                  <span className="hidden sm:inline">Buka Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className={cn(
                      "hidden min-h-11 items-center rounded-input px-3.5 text-xs font-bold transition sm:inline-flex",
                      scrolled
                        ? "text-ink-soft hover:bg-navy-50 hover:text-ink"
                        : "text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    Daftar
                  </Link>
                  <Link
                    to="/login"
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 text-xs font-bold transition sm:px-4",
                      scrolled
                        ? "bg-[#F3F5FF] text-[#070812] hover:bg-white"
                        : "bg-[#F3F5FF] text-[#070812] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_18px_44px_-22px_rgba(165,180,252,0.75)] hover:bg-white",
                    )}
                  >
                    <LogIn className="size-4" />
                    Masuk
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className={cn(
                  "grid size-11 place-items-center rounded-full border transition lg:hidden",
                  scrolled
                    ? "border-white/10 bg-white/[0.05] text-white"
                    : "border-white/20 bg-white/10 text-white backdrop-blur",
                )}
                aria-label="Buka menu navigasi"
                aria-expanded={mobileOpen}
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-[70] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
            />
            <motion.div
              initial={reduceMotion ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={reduceMotion ? undefined : { x: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-navy-950 p-5 text-white shadow-elevated"
              role="dialog"
              aria-modal="true"
              aria-label="Menu navigasi"
            >
              <div className="flex items-center justify-between">
                <Logo tone="light" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="grid size-11 place-items-center rounded-input border border-white/15 text-white/80 hover:bg-white/10"
                  aria-label="Tutup menu"
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="mt-8 space-y-1" aria-label="Navigasi seluler">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-12 items-center justify-between rounded-input px-4 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    {link.label}
                    <ChevronRight className="size-4 text-white/40" />
                  </a>
                ))}
              </nav>
              <div className="mt-auto space-y-2 border-t border-white/10 pt-5">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F3F5FF] text-sm font-bold text-[#070812]"
                  >
                    Buka Dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F3F5FF] text-sm font-bold text-[#070812] hover:bg-white"
                    >
                      Masuk
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      to="/register"
                      className="flex min-h-12 items-center justify-center rounded-full border border-white/20 text-sm font-bold text-white/85 hover:bg-white/10"
                    >
                      Daftar akun mahasiswa
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main id="konten">
        <section
          id="beranda"
          className="relative isolate overflow-hidden bg-hero-navy pb-14 pt-28 text-white sm:pt-32 lg:pb-20 lg:pt-36"
        >
          <div className="absolute inset-0 bg-hero-glow" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-dot-grid bg-[size:26px_26px] opacity-30 [mask-image:radial-gradient(circle_at_50%_40%,black,transparent_75%)]"
            aria-hidden="true"
          />
          <div
            className="ai-blob absolute -left-40 top-8 size-[34rem] animate-drift opacity-50"
            style={{ animationDuration: "22s" }}
            aria-hidden="true"
          />
          <div
            className="ai-blob absolute -right-28 top-16 size-[32rem] animate-drift opacity-45"
            style={{ animationDuration: "26s", animationDirection: "reverse" }}
            aria-hidden="true"
          />
          <div
            className="absolute right-[34%] top-1/4 size-72 rounded-full bg-cyan-400/10 blur-[100px]"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 left-1/3 size-80 rounded-full bg-primary-500/15 blur-[110px]"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid w-full max-w-[1280px] gap-14 px-5 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10">
            <div>
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="eyebrow flex items-center gap-3"
              >
                <span className="h-px w-9 bg-gradient-to-r from-cyan-300/80 to-primary-400/0" />
                Repository Skripsi · Fakultas Teknik
              </motion.p>

              <h1 className="mt-6 max-w-3xl font-display text-[40px] font-extrabold leading-[1.04] tracking-tight sm:text-[54px] lg:text-[62px]">
                <StaggerWords
                  words={["Jejaki", "karya,", "temukan"]}
                  reduceMotion={Boolean(reduceMotion)}
                />{" "}
                <StaggerWords
                  words={["arah"]}
                  reduceMotion={Boolean(reduceMotion)}
                  offset={3}
                  wordClassName="text-gradient-ai"
                />{" "}
                <StaggerWords
                  words={["riset."]}
                  reduceMotion={Boolean(reduceMotion)}
                  offset={4}
                />
              </h1>

              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 max-w-xl text-sm leading-relaxed text-slate-300/80 sm:text-base"
              >
                Telusuri repository skripsi Informatika UNIRA, pahami sebaran
                peminatan Business Intelligence dan Smart Agriculture, lalu mulai
                langkah risetmu dengan referensi yang tepat.
              </motion.p>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <a
                  href="#katalog"
                  className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-[#F3F5FF] px-6 text-sm font-bold text-[#070812] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_22px_50px_-22px_rgba(165,180,252,0.8)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:ring-offset-navy-950"
                >
                  <LibraryBig className="size-4" />
                  Jelajahi Katalog
                  <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
                </a>
                <Link
                  to={user ? "/dashboard" : "/login"}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-bold text-white transition hover:border-white/35 hover:bg-white/[0.06] focus-visible:ring-offset-navy-950"
                >
                  <LogIn className="size-4" />
                  {user ? "Buka Dashboard" : "Masuk ke akun"}
                </Link>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-slate-400"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-gold-300" />
                  Terverifikasi Kaprodi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-cyan-300" />
                  Akses abstrak &amp; PDF
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-violet-300" />
                  Pencarian cepat
                </span>
              </motion.div>
            </div>

            <div className="relative hidden lg:block" aria-label="Alur kerja repository">
              <div
                className="absolute -inset-10 rounded-[3rem] bg-[radial-gradient(circle_at_60%_35%,rgba(124,58,237,0.22),transparent_62%)] blur-2xl"
                aria-hidden="true"
              />
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-auto max-w-[27rem]"
              >
                <div className="mb-5 flex items-center justify-between px-1">
                  <span className="eyebrow">Alur kerja</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                    <span className="size-1.5 animate-pulse-glow rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
                    Terhubung
                  </span>
                </div>

                <div className="relative pl-[4.5rem]">
                  <div
                    className="neon-connector-v absolute bottom-9 left-[1.45rem] top-8 w-px"
                    aria-hidden="true"
                  />
                  {WORKFLOW_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.code}
                        initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.55 + index * 0.12,
                          duration: 0.55,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative pb-4 last:pb-0"
                      >
                        <span className="node-badge absolute -left-[4.5rem] top-3 hidden size-12 rounded-2xl sm:grid">
                          <Icon className="size-5" />
                        </span>
                        <div className="glass rounded-card p-4 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                Langkah {step.code}
                              </p>
                              <h3 className="mt-1 font-display text-sm font-bold text-white">
                                {step.title}
                              </h3>
                            </div>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-300">
                              {step.meta}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-400">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.55 }}
                  className="mt-5 flex items-center justify-between rounded-full border border-cyan-300/20 bg-cyan-400/[0.06] px-4 py-3"
                >
                  <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-cyan-100">
                    <Sparkles className="size-3.5 text-cyan-300" />
                    Siap ditelusuri
                  </span>
                  <span className="font-display text-xs font-extrabold text-white">
                    {statsUnavailable ? "—" : `${formatNumber(all.length)} karya`}
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <section aria-label="Ringkasan repository" className="relative z-10 -mt-8 pb-2">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
            <div className="ai-card overflow-hidden">
              <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.7 + index * 0.08,
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="flex items-center gap-4 px-5 py-5 sm:px-6"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/80 via-primary-500/70 to-cyan-400/80 text-white shadow-[0_0_26px_-8px_rgba(99,102,241,0.8)]">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          {stat.label}
                        </p>
                        {statsUnavailable ? (
                          <Skeleton className="mt-2 h-6 w-24 bg-white/10" />
                        ) : stat.format === "number" ? (
                          <p className="mt-1 font-display text-xl font-extrabold text-white">
                            <LandingCountUp
                              value={Number(stat.value)}
                              reduceMotion={Boolean(reduceMotion)}
                            />
                          </p>
                        ) : (
                          <p className="mt-1 truncate font-display text-lg font-extrabold text-white">
                            {stat.display}
                          </p>
                        )}
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {stat.caption}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 flex flex-col items-center justify-between gap-3 border-b border-white/[0.06] pb-7 sm:flex-row">
              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Didukung oleh
              </span>
              <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-slate-400">
                {["Fakultas Teknik", "Prodi Informatika", "Universitas Madura", "Repository Skripsi"].map(
                  (partner) => (
                    <span
                      key={partner}
                      className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/80 transition hover:text-slate-200"
                    >
                      {partner}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="pemetaan" className="relative scroll-mt-24 py-14 sm:py-20">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                  <ChartPie className="size-3.5" />
                  Pemetaan peminatan
                </p>
                <h2 className="mt-3 font-display text-[28px] font-extrabold leading-tight tracking-tight text-ink sm:text-[40px]">
                  Lihat arah riset <span className="text-gradient-navy">tiap angkatan.</span>
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
                  Bandingkan jumlah mahasiswa Business Intelligence dan Smart
                  Agriculture. Pilih angkatan untuk melihat komposisi yang lebih
                  spesifik.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-bi-100 bg-bi-50 px-3 py-1.5 text-[11px] font-bold text-bi-700">
                    <span className="size-2 rounded-full bg-bi-500" />
                    Business Intelligence
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sa-100 bg-sa-50 px-3 py-1.5 text-[11px] font-bold text-sa-700">
                    <span className="size-2 rounded-full bg-sa-500" />
                    Smart Agriculture
                  </span>
                </div>
                <div className="mt-5 rounded-card border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    <Sparkles className="size-3.5 text-cyan-300" />
                    Ringkasan otomatis
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-200">
                    {chartSummary}
                  </p>
                </div>
              </div>

              <div className="ai-card p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">Distribusi per angkatan</h3>
                    <p className="mt-1 text-xs text-ink-soft">
                      {selectedYear ? `Angkatan ${selectedYear}` : "Seluruh angkatan"} ·{" "}
                      {formatNumber(chartTotal)} mahasiswa sudah memilih
                    </p>
                  </div>
                  <SelectMenu
                    label="Filter angkatan"
                    value={selectedYear}
                    options={chartYearOptions}
                    onChange={setSelectedYear}
                    className="sm:w-52"
                  />
                </div>

                {pemetaanQuery.loading ? (
                  <Skeleton className="mt-6 h-[300px] w-full rounded-card" />
                ) : pemetaanQuery.error ? (
                  <EmptyState
                    compact
                    className="mt-5"
                    icon={<RefreshCw className="size-5" />}
                    title="Gagal memuat pemetaan"
                    description={pemetaanQuery.error}
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<RefreshCw />}
                        onClick={pemetaanQuery.refetch}
                      >
                        Coba lagi
                      </Button>
                    }
                  />
                ) : chartData.length === 0 ? (
                  <EmptyState
                    compact
                    className="mt-5"
                    icon={<ChartPie className="size-5" />}
                    title="Belum ada data pemetaan"
                    description="Distribusi akan tampil setelah mahasiswa memilih peminatan."
                  />
                ) : (
                  <>
                    <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSeries("bi")}
                        aria-pressed={showBi}
                        className={cn(
                          "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold transition",
                          showBi
                            ? "border-bi-200 bg-bi-50 text-bi-700"
                            : "border-navy-100 bg-white text-ink-faint",
                        )}
                      >
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            showBi ? "bg-bi-500" : "bg-navy-200",
                          )}
                        />
                        Business Intelligence
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSeries("sa")}
                        aria-pressed={showSa}
                        className={cn(
                          "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold transition",
                          showSa
                            ? "border-sa-200 bg-sa-50 text-sa-700"
                            : "border-navy-100 bg-white text-ink-faint",
                        )}
                      >
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            showSa ? "bg-sa-500" : "bg-navy-200",
                          )}
                        />
                        Smart Agriculture
                      </button>
                    </div>
                    <div className="mt-3 h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 12, right: 4, left: -20, bottom: 0 }}
                          barGap={6}
                        >
                          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                          <XAxis
                            dataKey="angkatan"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10, fill: "#8B94B4", fontWeight: 600 }}
                            dy={8}
                          />
                          <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10, fill: "#646E8E" }}
                            width={42}
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(255,255,255,0.04)" }}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.14)",
                              background: "rgba(8,11,24,0.94)",
                              boxShadow: "0 22px 48px -28px rgba(0,0,0,0.9)",
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
                              fill="#8B5CF6"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={34}
                              animationDuration={600}
                              animationEasing="ease-out"
                            />
                          ) : null}
                          {showSa ? (
                            <Bar
                              dataKey="sa"
                              name="sa"
                              fill="#22D3EE"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={34}
                              animationDuration={600}
                              animationEasing="ease-out"
                            />
                          ) : null}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {chartData.map((row: PemetaanAngkatan) => (
                        <div
                          key={row.angkatan}
                          className="flex items-center justify-between rounded-input border border-navy-50 bg-canvas-soft/50 px-3 py-2 text-[10px]"
                        >
                          <span className="font-semibold text-ink-soft">Angkatan {row.angkatan}</span>
                          <span className="font-bold text-ink">
                            {formatNumber(row.totalMahasiswa)} mhs
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          id="katalog"
          ref={catalogRef}
          className="relative scroll-mt-20 border-y border-white/[0.06] bg-white/[0.015] py-14 sm:py-20"
        >
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                  <LibraryBig className="size-3.5" />
                  Katalog skripsi
                </p>
                <h2 className="mt-3 font-display text-[28px] font-extrabold leading-tight tracking-tight text-ink sm:text-[40px]">
                  Referensi yang siap <span className="text-gradient-ai">menginspirasi.</span>
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
                  Satu pencarian untuk menjangkau judul, penulis, dan peminatan.
                  Semua karya telah melewati verifikasi Kaprodi.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] font-bold text-slate-300">
                <BookOpen className="size-3.5 text-cyan-300" />
                {formatNumber(all.length)} karya terverifikasi
              </span>
            </div>

            <div className="sticky top-[80px] z-30 mt-6 rounded-panel border border-white/10 bg-[#080B18]/85 p-3 shadow-card backdrop-blur-xl sm:p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Cari judul skripsi, nama mahasiswa, atau NIM…"
                    aria-label="Cari katalog skripsi"
                    className="h-12 w-full rounded-input border border-white/10 bg-[#0B0E1D] pl-12 pr-11 text-sm text-ink shadow-sm transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:outline-none focus:ring-4 focus:ring-cyan-400/10"
                  />
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-ink-faint transition hover:bg-navy-50 hover:text-ink"
                      aria-label="Hapus pencarian"
                    >
                      <X className="size-4" />
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter peminatan">
                    {TABS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setTab(item.value)}
                        aria-pressed={tab === item.value}
                        className={cn(
                          "inline-flex min-h-10 items-center rounded-full border px-3 text-[11px] font-bold transition",
                          tab === item.value
                            ? item.value === BI
                              ? "border-violet-400/40 bg-violet-500/20 text-violet-300"
                              : item.value === SA
                                ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-200"
                                : "border-white/20 bg-[#F3F5FF] text-[#070812] shadow-[0_10px_28px_-18px_rgba(165,180,252,0.8)]"
                            : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white",
                        )}
                      >
                        {item.short}
                      </button>
                    ))}
                  </div>
                  <SelectMenu
                    label=""
                    value={tahun}
                    options={[{ value: "", label: "Semua tahun" }, ...yearOptions]}
                    onChange={setTahun}
                    className="sm:w-40"
                  />
                  <SelectMenu
                    label=""
                    value={order}
                    options={[
                      { value: "newest", label: "Terbaru" },
                      { value: "oldest", label: "Terlama" },
                      { value: "year", label: "Tahun terbaru" },
                    ]}
                    onChange={(value) => setOrder(value as CatalogOrder)}
                    className="sm:w-40"
                  />
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-ink-faint">
                <span>
                  Menampilkan{" "}
                  <span className="font-bold text-ink">{formatNumber(visibleItems.length)}</span>{" "}
                  dari <span className="font-bold text-ink">{formatNumber(filtered.length)}</span> karya
                </span>
                {(searchInput || tab !== "all" || tahun) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setTab("all");
                      setTahun("");
                    }}
                    className="font-bold text-primary-600 hover:underline"
                  >
                    Reset filter
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6">
              {query.loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <CardSkeleton key={index} />
                  ))}
                </div>
              ) : query.error ? (
                <EmptyState
                  icon={<RefreshCw className="size-5" />}
                  title="Gagal memuat katalog"
                  description={query.error}
                  action={
                    <Button variant="secondary" icon={<RefreshCw />} onClick={query.refetch}>
                      Coba lagi
                    </Button>
                  }
                />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={<Search className="size-5" />}
                  title="Tidak ada karya yang cocok"
                  description="Coba kata kunci lain atau reset filter peminatan dan tahun."
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSearchInput("");
                        setTab("all");
                        setTahun("");
                      }}
                    >
                      Reset filter
                    </Button>
                  }
                />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${tab}-${tahun}-${order}-${debouncedSearch}-${visibleCount}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  >
                    {visibleItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(index, 7) * 0.06,
                          duration: 0.5,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <SkripsiCard
                          item={item}
                          onOpen={() => setSelected(item)}
                          priority={index < 2}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {hasMore ? (
              <div className="mt-7 flex justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<ArrowDown />}
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                >
                  Muat lebih banyak ({formatNumber(filtered.length - visibleCount)} lagi)
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        <section id="peminatan" className="scroll-mt-24 py-14 sm:py-20">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                Dua jalur riset
              </p>
              <h2 className="mt-3 font-display text-[28px] font-extrabold leading-tight tracking-tight text-ink sm:text-[40px]">
                Pilih peminatan yang <span className="text-gradient-ai">selaras.</span>
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
                Business Intelligence dan Smart Agriculture membuka perspektif
                berbeda untuk menyelesaikan masalah nyata.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {PEMINATAN_CONTENT.map((item) => {
                const Icon = item.icon;
                const isBi = item.value === BI;
                return (
                  <article
                    key={item.label}
                    className="ai-card group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 sm:p-7"
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute -right-12 -top-12 size-48 rounded-full blur-3xl",
                        isBi ? "bg-violet-500/20" : "bg-cyan-400/15",
                      )}
                      aria-hidden="true"
                    />
                    <div className="relative flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "node-badge size-12 rounded-2xl",
                          isBi
                            ? "bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-600"
                            : "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600",
                        )}
                      >
                        <Icon className="size-6" />
                      </span>
                      <span className="font-display text-[28px] font-extrabold text-white/[0.08]">
                        {item.code}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-extrabold text-white">
                      {item.label}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
                      {item.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {item.topics.map((topic) => (
                        <span
                          key={topic}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                            isBi
                              ? "border-violet-400/20 bg-violet-500/10 text-violet-300/90"
                              : "border-cyan-300/20 bg-cyan-400/10 text-cyan-200/90",
                          )}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTab(item.value);
                        catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 px-4 text-xs font-bold text-white transition hover:border-white/30 hover:bg-white/[0.06]"
                    >
                      Lihat karya {isBi ? "BI" : "SA"}
                      <ArrowUpRight className="size-3.5" />
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-panel bg-navy-900 px-6 py-10 text-white shadow-elevated sm:px-10">
              <div className="absolute inset-0 bg-hero-glow opacity-80" aria-hidden="true" />
              <div className="absolute inset-0 bg-dot-grid bg-[size:24px_24px] opacity-20" aria-hidden="true" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                    <ShieldCheck className="size-3.5" />
                    Siap mulai?
                  </span>
                  <h2 className="mt-4 font-display text-[28px] font-extrabold leading-tight sm:text-[40px]">
                    Punya karya? Jadikan bagian dari <span className="text-gradient-ai">repository.</span>
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
                    Masuk untuk mengajukan skripsi, memilih peminatan, dan memantau
                    status verifikasi dalam satu ruang kerja.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Link
                    to={user ? "/pengajuan" : "/login"}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#F3F5FF] px-6 text-sm font-bold text-[#070812] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_22px_50px_-22px_rgba(165,180,252,0.8)] transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    {user ? "Ajukan Skripsi" : "Masuk ke Akun"}
                    <ArrowRight className="size-4" />
                  </Link>
                  <a
                    href="#katalog"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-bold text-white transition hover:border-white/35 hover:bg-white/[0.06]"
                  >
                    Jelajahi Katalog
                    <Download className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-navy-100/70 bg-white/70 py-10">
        <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 sm:px-6 lg:grid-cols-[1.4fr_0.6fr_0.8fr]">
          <div>
            <Logo compact imageClassName="h-8 w-8" />
            <p className="mt-4 max-w-md text-xs leading-relaxed text-ink-soft">
              Repository Skripsi dan Pemetaan Peminatan Program Studi Informatika,
              Fakultas Teknik, Universitas Madura. Dibangun untuk memudahkan
              penelusuran referensi dan pengelolaan karya akademik.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
              Navigasi
            </p>
            <ul className="mt-3 space-y-1.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-8 items-center text-xs font-semibold text-ink-soft transition hover:text-primary-600"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
              Fakultas Teknik
            </p>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Universitas Madura
              <br />
              Program Studi Informatika
              <br />
              Pamekasan, Jawa Timur
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-ink-faint">
              <GraduationCap className="size-3.5" />
              Sampul dibuat otomatis dari data skripsi
            </p>
          </div>
        </div>
        <div className="mx-auto mt-8 flex w-full max-w-[1280px] flex-col items-center justify-between gap-2 border-t border-navy-100/60 px-4 pt-5 text-[10px] text-ink-faint sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Repository Skripsi UNIRA. Hak cipta karya milik penulis.</p>
          <p className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sa-500" />
            BI &amp; SA · Fakultas Teknik
          </p>
        </div>
      </footer>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.judul}
        description={
          selected
            ? `${selected.namaMahasiswa ?? "Mahasiswa Informatika"} · NIM ${selected.nim} · ${selected.tahun}`
            : undefined
        }
        size="lg"
      >
        {selected ? (
          <div className="grid gap-5 sm:grid-cols-[0.8fr_1.2fr]">
            <SkripsiCover
              skripsi={selected}
              id={selected.id}
              judul={selected.judul}
              peminatan={selected.peminatan}
              tahun={selected.tahun}
              author={selected.namaMahasiswa}
              coverUrl={selected.coverUrl}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <PeminatanBadge value={selected.peminatan} />
                <Badge tone="sa" dot>
                  Disetujui
                </Badge>
                <Badge tone="slate">{selected.programStudi}</Badge>
              </div>
              <div className="mt-4 flex items-center gap-2.5 rounded-input border border-navy-50 bg-canvas-soft/60 p-3">
                <Avatar name={selected.namaMahasiswa ?? "Mahasiswa"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">
                    {selected.namaMahasiswa ?? "Mahasiswa Informatika"}
                  </p>
                  <p className="text-[10px] text-ink-faint">
                    NIM {selected.nim} · {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
              <h4 className="mt-4 font-display text-sm font-bold text-ink">Abstrak</h4>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {selected.abstrak || "Abstrak belum tersedia untuk karya ini."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {selected.fileUrl ? (
                  <SkripsiPdfButton
                    id={selected.id}
                    title={selected.judul}
                    mode="open"
                    label="Akses PDF"
                  />
                ) : (
                  <Badge tone="amber">PDF belum tersedia</Badge>
                )}
                {user ? (
                  <Button
                    variant="secondary"
                    icon={<ArrowUpRight />}
                    onClick={() => {
                      setSelected(null);
                      window.location.href = `/repository/${selected.id}`;
                    }}
                  >
                    Buka di dashboard
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function StaggerWords({
  words,
  reduceMotion,
  offset = 0,
  wordClassName = "",
}: {
  words: string[];
  reduceMotion: boolean;
  offset?: number;
  wordClassName?: string;
}) {
  return (
    <>
      {words.map((word, index) => (
        <motion.span
          key={word + index}
          className={`inline-block ${wordClassName}`.trim()}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: (offset + index) * 0.055,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
          {index < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </>
  );
}

function LandingCountUp({
  value,
  reduceMotion,
}: {
  value: number;
  reduceMotion: boolean;
}) {
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    let start = 0;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / 900);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);

  return <>{formatNumber(display)}</>;
}
