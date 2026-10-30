import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChartPie,
  CheckCircle2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  LogIn,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApiQuery } from "../hooks/useApiQuery";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { skripsiService } from "../services/skripsiService";
import { BI, SA } from "../constants";
import type { Skripsi } from "../types";
import { clampPercent, formatDate, formatNumber, percent } from "../lib/format";
import { cn } from "../lib/cn";
import { Logo } from "../components/layout/Logo";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { Skeleton } from "../components/ui/Skeleton";
import { SkripsiCard } from "../components/skripsi/SkripsiCard";
import { SkripsiCover } from "../components/skripsi/SkripsiCover";
import { SkripsiPdfButton } from "../components/skripsi/SkripsiPdfButton";

type CatalogTab = "all" | typeof BI | typeof SA;

const PAGE_SIZE = 8;

const TABS: { value: CatalogTab; label: string; short: string }[] = [
  { value: "all", label: "Semua", short: "Semua" },
  { value: BI, label: "Business Intelligence", short: "BI" },
  { value: SA, label: "Smart Agriculture", short: "SA" },
];

const PEMINATAN_CONTENT: {
  value: typeof BI | typeof SA;
  code: string;
  label: string;
  icon: LucideIcon;
  description: string;
  topics: string[];
  tone: "bi" | "sa";
}[] = [
  {
    value: BI,
    code: "01",
    label: "Business Intelligence",
    icon: BrainCircuit,
    description:
      "Mengolah data menjadi wawasan yang membantu organisasi mengambil keputusan lebih cepat, terukur, dan berbasis bukti.",
    topics: [
      "Data Warehouse",
      "Dashboard & Visualisasi",
      "Prediksi & Klasifikasi",
      "Analisis Bisnis",
    ],
    tone: "bi",
  },
  {
    value: SA,
    code: "02",
    label: "Smart Agriculture",
    icon: Sprout,
    description:
      "Menghubungkan teknologi dengan sektor pertanian untuk mendukung budidaya yang lebih presisi, efisien, dan berkelanjutan.",
    topics: [
      "IoT & Sensor",
      "Smart Farming",
      "Pengolahan Citra",
      "Sistem Monitoring",
    ],
    tone: "sa",
  },
];

const PEMINATAN_TONE = {
  bi: {
    bar: "from-sky-500 via-primary-500 to-violet-500",
    icon: "bg-sky-50 text-sky-600 ring-sky-100",
    blob: "bg-sky-200/45",
    chip: "bg-sky-50 text-sky-700 ring-sky-100",
    action:
      "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100 hover:bg-sky-100 hover:text-sky-800",
  },
  sa: {
    bar: "from-mint-500 via-emerald-500 to-teal-500",
    icon: "bg-mint-50 text-mint-600 ring-mint-100",
    blob: "bg-mint-200/45",
    chip: "bg-mint-50 text-mint-700 ring-mint-100",
    action:
      "bg-mint-50 text-mint-700 ring-1 ring-inset ring-mint-100 hover:bg-mint-100 hover:text-mint-800",
  },
};

export default function LandingPage() {
  useDocumentTitle("Beranda");
  const { user } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 250);
  const [tab, setTab] = useState<CatalogTab>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Skripsi | null>(null);
  const catalogRef = useRef<HTMLElement>(null);

  const query = useApiQuery(() => skripsiService.listPublic(), []);
  const all = useMemo(
    () =>
      (query.data?.data ?? []).filter((item) => item.status === "disetujui"),
    [query.data],
  );

  const biCount = all.filter((item) => item.peminatan === BI).length;
  const saCount = all.filter((item) => item.peminatan === SA).length;
  const statsUnavailable = query.loading || Boolean(query.error);

  const filtered = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();

    return all.filter((item) => {
      if (tab !== "all" && item.peminatan !== tab) return false;
      if (!keyword) return true;

      return (
        item.judul.toLowerCase().includes(keyword) ||
        (item.namaMahasiswa ?? "").toLowerCase().includes(keyword) ||
        item.nim.toLowerCase().includes(keyword)
      );
    });
  }, [all, tab, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tab]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const activeKeyword = searchInput.trim();

  const tabCounts: Record<CatalogTab, number> = {
    all: all.length,
    [BI]: biCount,
    [SA]: saCount,
  };

  const selectedHasFile = Boolean(selected?.fileUrl);

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const explorePeminatan = (value: typeof BI | typeof SA) => {
    setTab(value);
    setSearchInput("");
    scrollToCatalog();
  };

  const resetFilters = () => {
    setSearchInput("");
    setTab("all");
  };

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    scrollToCatalog();
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      catalogRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Beranda Repository Skripsi Informatika UNIRA"
          >
            <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 text-white shadow-glow">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.45),transparent_50%)]" />
              <GraduationCap className="relative size-5" strokeWidth={2.1} />
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-ink">
                Repository Skripsi
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold tracking-wide text-ink-soft">
                Informatika UNIRA
              </span>
            </span>
          </Link>

          <nav
            aria-label="Navigasi halaman publik"
            className="ml-7 hidden items-center gap-1 md:flex"
          >
            {[
              { label: "Beranda", href: "#beranda" },
              { label: "Katalog", href: "#katalog" },
              { label: "Peminatan", href: "#peminatan" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100/80 hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-violet-600 px-3.5 text-[11px] font-semibold text-white shadow-glow transition hover:from-primary-500 hover:to-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
            >
              {user ? (
                <LayoutDashboard className="size-3.5" />
              ) : (
                <LogIn className="size-3.5" />
              )}
              <span>{user ? "Buka Dashboard" : "Masuk ke Portal"}</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-ink md:hidden"
              aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <nav
            id="mobile-navigation"
            aria-label="Navigasi halaman publik (mobile)"
            className="border-t border-slate-100 bg-white px-4 py-3 md:hidden"
          >
            <div className="mx-auto grid max-w-7xl gap-1">
              {[
                { label: "Beranda", href: "#beranda" },
                { label: "Katalog Skripsi", href: "#katalog" },
                { label: "Peminatan Riset", href: "#peminatan" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-ink"
                >
                  {item.label}
                  <ArrowRight className="size-3.5 text-slate-300" />
                </a>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <main>
        <section
          id="beranda"
          className="relative isolate scroll-mt-24 overflow-hidden border-b border-slate-200/60"
        >
          <div className="pointer-events-none absolute inset-0 bg-grid-slate bg-[size:48px_48px] opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="pointer-events-none absolute -left-40 -top-32 size-[520px] rounded-full bg-primary-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-8 size-[460px] rounded-full bg-violet-300/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 size-[380px] rounded-full bg-mint-200/30 blur-3xl" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:px-8 lg:pb-24 lg:pt-20">
            <div className="animate-slide-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-white/80 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.17em] text-primary-700 shadow-sm backdrop-blur">
                <Sparkles className="size-3.5" />
                Fakultas Teknik · Informatika UNIRA
              </span>

              <h1 className="mt-6 max-w-2xl text-[38px] font-extrabold leading-[1.06] tracking-tight text-ink sm:text-5xl xl:text-[58px]">
                Eksplorasi{" "}
                <span className="text-gradient">Riset &amp; Skripsi</span>{" "}
                Informatika UNIRA
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-ink-soft sm:text-[15px]">
                Telusuri referensi skripsi terverifikasi dan temukan inspirasi
                riset dari dua fokus unggulan Program Studi Informatika,
                Universitas Madura.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={scrollToCatalog}
                  iconRight={<ArrowDown />}
                >
                  Eksplorasi Katalog
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="size-3.5 text-mint-500" />
                  Hanya skripsi disetujui
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary-500" />
                  Akses publik tanpa login
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LibraryBig className="size-3.5 text-violet-500" />
                  2 peminatan riset
                </span>
              </div>
            </div>

            <HeroStatsVisual
              biCount={biCount}
              saCount={saCount}
              total={all.length}
              loading={statsUnavailable}
              onExplore={explorePeminatan}
            />
          </div>
        </section>

        <section id="peminatan" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500 shadow-sm">
                  <Target className="size-3.5 text-primary-500" />
                  Fokus riset Informatika
                </span>
                <h2 className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  Dua peminatan, dua arah kontribusi.
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-ink-soft lg:justify-self-end">
                Setiap mahasiswa memilih satu jalur riset yang membentuk topik
                skripsi, mata kuliah pendukung, dan proyek akhirnya. Kenali
                karakter masing-masing peminatan sebelum menentukan arah.
              </p>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-2">
              {PEMINATAN_CONTENT.map((item) => (
                <PeminatanCard
                  key={item.value}
                  value={item.value}
                  code={item.code}
                  label={item.label}
                  description={item.description}
                  topics={item.topics}
                  icon={item.icon}
                  tone={item.tone}
                  count={item.value === BI ? biCount : saCount}
                  loading={statsUnavailable}
                  onExplore={explorePeminatan}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          id="katalog"
          ref={catalogRef}
          className="scroll-mt-24 border-y border-slate-200/70 bg-slate-50/75 py-16 sm:py-20"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500 shadow-sm">
                  <LibraryBig className="size-3.5 text-primary-500" />
                  Katalog skripsi publik
                </span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  Telusuri karya mahasiswa Informatika.
                </h2>
                <p className="mt-3 text-sm leading-7 text-ink-soft">
                  Gunakan kolom pencarian atau filter peminatan di bawah untuk
                  menemukan referensi yang relevan. Semua karya telah melalui
                  verifikasi Kaprodi.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-soft">
                <span className="grid size-9 place-items-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                  <BadgeCheck className="size-4" />
                </span>
                <div>
                  <p className="text-lg font-extrabold leading-none tracking-tight text-ink">
                    {statsUnavailable ? "—" : formatNumber(all.length)}
                  </p>
                  <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    karya terverifikasi
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <form
                onSubmit={onSearchSubmit}
                className="flex w-full items-center gap-2 xl:max-w-md"
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <label htmlFor="catalog-search" className="sr-only">
                    Cari judul skripsi atau nama penulis
                  </label>
                  <input
                    id="catalog-search"
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Cari judul skripsi atau nama penulis…"
                    autoComplete="off"
                    enterKeyHint="search"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-ink shadow-sm placeholder:text-slate-400 transition focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100/70"
                  />
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Hapus kata kunci pencarian"
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <Button
                  type="submit"
                  size="md"
                  className="h-11 shrink-0 rounded-xl px-3.5 sm:px-4"
                  icon={<Search />}
                  aria-label="Cari skripsi"
                >
                  <span className="hidden sm:inline">Cari</span>
                </Button>
              </form>

              <div
                role="tablist"
                aria-label="Filter peminatan skripsi"
                className="inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft"
              >
                {TABS.map((item) => {
                  const active = tab === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(item.value)}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[10px] font-extrabold transition sm:gap-2 sm:px-4 sm:text-[11px]",
                        active
                          ? "bg-gradient-to-r from-primary-600 to-violet-600 text-white shadow-glow"
                          : "text-slate-500 hover:bg-slate-50 hover:text-ink",
                      )}
                    >
                      <span className="sm:hidden">{item.short}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-extrabold",
                          active
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {formatNumber(tabCounts[item.value])}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-slate-500">
                Menampilkan{" "}
                <span className="font-extrabold text-ink">
                  {formatNumber(rangeStart)}–{formatNumber(rangeEnd)}
                </span>{" "}
                dari{" "}
                <span className="font-extrabold text-ink">
                  {formatNumber(filtered.length)}
                </span>{" "}
                skripsi
              </p>

              {activeKeyword ? (
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary-100 bg-primary-50/80 py-1 pl-3 pr-1 text-[10px] font-semibold text-primary-700">
                  <Search className="size-3 shrink-0" />
                  <span className="truncate">Hasil untuk “{activeKeyword}”</span>
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="grid size-6 shrink-0 place-items-center rounded-full text-primary-500 transition hover:bg-primary-100 hover:text-primary-700"
                    aria-label="Hapus pencarian"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : null}
            </div>

            {query.error ? (
              <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-soft sm:p-6">
                <EmptyState
                  icon={<RefreshCw className="size-5" />}
                  title="Katalog belum dapat dimuat"
                  description={query.error}
                  action={
                    <Button
                      variant="secondary"
                      icon={<RefreshCw />}
                      onClick={query.refetch}
                    >
                      Coba lagi
                    </Button>
                  }
                />
              </div>
            ) : query.loading ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <CatalogCardSkeleton key={index} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-soft sm:p-6">
                <EmptyState
                  icon={<LibraryBig className="size-5" />}
                  title={
                    all.length === 0
                      ? "Belum ada skripsi yang disetujui"
                      : "Tidak ada skripsi yang cocok"
                  }
                  description={
                    all.length === 0
                      ? "Katalog publik akan terisi otomatis setelah Kaprodi menyetujui pengajuan mahasiswa."
                      : "Coba kata kunci lain di kolom pencarian, atau bersihkan filter untuk melihat seluruh katalog."
                  }
                  action={
                    all.length > 0 ? (
                      <Button
                        variant="secondary"
                        icon={<RefreshCw />}
                        onClick={resetFilters}
                      >
                        Reset pencarian &amp; filter
                      </Button>
                    ) : null
                  }
                />
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleItems.map((item) => (
                    <SkripsiCard
                      key={item.id}
                      item={item}
                      onOpen={() => setSelected(item)}
                    />
                  ))}
                </div>

                <Pagination
                  total={filtered.length}
                  page={currentPage}
                  pageSize={PAGE_SIZE}
                  onPageChange={handlePageChange}
                  itemLabel="skripsi"
                  className="mt-10 border-slate-200/80"
                />
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 bg-white/75">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="max-w-sm">
              <Logo />
              <p className="mt-4 text-xs leading-6 text-slate-500">
                Repository skripsi dan pemetaan peminatan Program Studi
                Informatika, Fakultas Teknik, Universitas Madura.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="sky" size="xs">
                  <BrainCircuit className="size-2.5" />
                  Business Intelligence
                </Badge>
                <Badge tone="mint" size="xs">
                  <Sprout className="size-2.5" />
                  Smart Agriculture
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Jelajahi
              </p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href="#beranda"
                    className="text-xs font-semibold text-slate-600 transition hover:text-primary-600"
                  >
                    Beranda
                  </a>
                </li>
                <li>
                  <a
                    href="#katalog"
                    className="text-xs font-semibold text-slate-600 transition hover:text-primary-600"
                  >
                    Katalog skripsi
                  </a>
                </li>
                <li>
                  <a
                    href="#peminatan"
                    className="text-xs font-semibold text-slate-600 transition hover:text-primary-600"
                  >
                    Peminatan riset
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Institusi
              </p>
              <ul className="mt-4 space-y-2.5">
                <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <GraduationCap className="size-3.5 text-primary-500" />
                  Universitas Madura
                </li>
                <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <LibraryBig className="size-3.5 text-primary-500" />
                  Fakultas Teknik
                </li>
                <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <BadgeCheck className="size-3.5 text-primary-500" />
                  Program Studi Informatika
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200/70 pt-6 text-[10px] text-slate-400 sm:flex-row">
            <p>
              © {new Date().getFullYear()} Repository Skripsi · Fakultas Teknik
              UNIRA
            </p>
            <p className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-mint-500" />
              Hanya skripsi disetujui yang dipublikasikan
            </p>
          </div>
        </div>
      </footer>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Detail Skripsi"
        description="Ringkasan publik karya ilmiah mahasiswa Informatika UNIRA."
        icon={<BookOpen className="size-5" />}
        size="xl"
        footer={
          selected ? (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Tutup
              </Button>
              {selected.fileUrl ? (
                user ? (
                  <SkripsiPdfButton
                    id={selected.id}
                    title={selected.judul}
                  />
                ) : (
                  <Link to="/login">
                    <Button icon={<LogIn />}>Masuk untuk mengunduh</Button>
                  </Link>
                )
              ) : (
                <Button variant="secondary" icon={<FileText />} disabled>
                  PDF belum tersedia
                </Button>
              )}
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="grid gap-5 sm:grid-cols-[170px_minmax(0,1fr)]">
            <div className="hidden sm:block">
              <SkripsiCover
                judul={selected.judul}
                peminatan={selected.peminatan}
                tahun={selected.tahun}
                coverUrl={selected.coverUrl}
                fileUrl={selected.fileUrl}
                className="rounded-2xl shadow-card"
                priority
              />
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="mint" size="sm" dot>
                    <BadgeCheck className="size-3" />
                    Disetujui Kaprodi
                  </Badge>
                  <PeminatanBadge value={selected.peminatan} size="sm" />
                  <Badge tone="slate" size="sm">
                    <CalendarDays className="size-3" />
                    {selected.tahun}
                  </Badge>
                </div>
                <h3 className="mt-3 text-lg font-extrabold leading-snug tracking-tight text-ink sm:text-xl">
                  {selected.judul}
                </h3>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
                <Avatar
                  name={selected.namaMahasiswa ?? selected.nim}
                  size="lg"
                  className="rounded-2xl"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-ink">
                    {selected.namaMahasiswa ?? "Mahasiswa Informatika"}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    NIM {selected.nim} · {selected.programStudi}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Diunggah {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <ModalInfo label="Tahun" value={String(selected.tahun)} />
                <ModalInfo
                  label="Peminatan"
                  value={<PeminatanBadge value={selected.peminatan} size="xs" />}
                />
                <ModalInfo label="Program studi" value={selected.programStudi} />
                <ModalInfo label="NIM" value={selected.nim} />
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  <BookOpen className="size-3.5 text-primary-500" />
                  Abstrak
                </h4>
                {selected.abstrak?.trim() ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {selected.abstrak}
                  </p>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-7 text-center">
                    <FileText className="mx-auto size-5 text-slate-300" />
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Abstrak belum dilampirkan oleh penulis.
                    </p>
                  </div>
                )}
              </div>

              {!selectedHasFile ? (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">
                  <FileText className="size-4 shrink-0" />
                  Berkas PDF belum tersedia untuk skripsi ini.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function HeroStatsVisual({
  biCount,
  saCount,
  total,
  loading,
  onExplore,
}: {
  biCount: number;
  saCount: number;
  total: number;
  loading: boolean;
  onExplore: (value: typeof BI | typeof SA) => void;
}) {
  const [active, setActive] = useState<"bi" | "sa" | null>(null);

  const compared = biCount + saCount;
  const biPercent = percent(biCount, compared);
  const saPercent = compared > 0 ? 100 - biPercent : 0;
  const biShare = compared > 0 ? biCount / compared : 0;
  const saShare = compared > 0 ? saCount / compared : 0;

  const chartSize = 188;
  const strokeWidth = 16;
  const radius = (chartSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = biCount > 0 && saCount > 0 ? 3 : 0;
  const biArc =
    biCount > 0 ? Math.max(biShare * circumference - gap, 2) : 0;
  const saArc =
    saCount > 0 ? Math.max(saShare * circumference - gap, 2) : 0;
  const saOffset = -(biShare * circumference);

  const focus =
    active === "bi"
      ? {
          label: "Peminatan BI",
          count: biCount,
          percent: biPercent,
          text: "text-primary-600",
        }
      : active === "sa"
        ? {
            label: "Peminatan SA",
            count: saCount,
            percent: saPercent,
            text: "text-mint-600",
          }
        : null;

  return (
    <div className="relative mx-auto w-full max-w-[540px] animate-slide-up [animation-delay:120ms] motion-reduce:animate-none lg:max-w-none">
      <div className="pointer-events-none absolute -right-10 top-4 size-64 rounded-full bg-primary-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 size-60 rounded-full bg-mint-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-5 -top-5 size-44 rounded-full border border-primary-200/50" />
      <div className="pointer-events-none absolute -right-14 top-4 size-56 rounded-full border border-mint-200/40" />
      <div className="pointer-events-none absolute -left-6 bottom-16 size-32 rounded-full border border-primary-100/60" />

      <div className="relative z-10 rounded-[2rem] border border-white/70 bg-white/55 p-2 shadow-[0_36px_90px_-38px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-white/70 bg-gradient-to-br from-white/90 via-white/70 to-white/55 p-4 sm:p-5">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-primary-200/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-48 rounded-full bg-mint-200/30 blur-2xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 text-white shadow-glow">
                  <ChartPie className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                    Statistik peminatan
                  </p>
                  <p className="truncate text-sm font-extrabold tracking-tight text-ink">
                    Perbandingan BI vs SA
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-mint-100/90 bg-mint-50/80 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-mint-700">
                <span className="size-1.5 animate-pulse rounded-full bg-mint-500" />
                Data publik
              </span>
            </div>

            <div className="mt-5 grid items-center gap-5 sm:grid-cols-[188px_minmax(0,1fr)]">
              <div className="relative mx-auto grid size-[188px] place-items-center">
                <svg
                  viewBox={`0 0 ${chartSize} ${chartSize}`}
                  className="size-full -rotate-90"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="hero-bi-arc"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="55%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                    <linearGradient
                      id="hero-sa-arc"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="55%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx={chartSize / 2}
                    cy={chartSize / 2}
                    r={radius}
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth={strokeWidth}
                  />
                  {biArc > 0 ? (
                    <circle
                      cx={chartSize / 2}
                      cy={chartSize / 2}
                      r={radius}
                      fill="none"
                      stroke="url(#hero-bi-arc)"
                      strokeWidth={
                        active === "bi" ? strokeWidth + 4 : strokeWidth
                      }
                      strokeDasharray={`${biArc} ${circumference - biArc}`}
                      onMouseEnter={() => setActive("bi")}
                      onMouseLeave={() => setActive(null)}
                      onClick={() => onExplore(BI)}
                      className={cn(
                        "cursor-pointer transition-all duration-500",
                        active === "sa" ? "opacity-30" : "opacity-100",
                      )}
                    />
                  ) : null}
                  {saArc > 0 ? (
                    <circle
                      cx={chartSize / 2}
                      cy={chartSize / 2}
                      r={radius}
                      fill="none"
                      stroke="url(#hero-sa-arc)"
                      strokeWidth={
                        active === "sa" ? strokeWidth + 4 : strokeWidth
                      }
                      strokeDasharray={`${saArc} ${circumference - saArc}`}
                      strokeDashoffset={saOffset}
                      onMouseEnter={() => setActive("sa")}
                      onMouseLeave={() => setActive(null)}
                      onClick={() => onExplore(SA)}
                      className={cn(
                        "cursor-pointer transition-all duration-500",
                        active === "bi" ? "opacity-30" : "opacity-100",
                      )}
                    />
                  ) : null}
                </svg>

                <div className="pointer-events-none absolute inset-0 grid place-items-center px-7 text-center">
                  <div>
                    <p className="text-[8px] font-extrabold uppercase leading-tight tracking-[0.14em] text-slate-400">
                      {focus ? focus.label : "Total skripsi publik"}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[30px] font-extrabold leading-none tracking-tight",
                        focus ? focus.text : "text-ink",
                      )}
                    >
                      {loading ? "—" : formatNumber(focus ? focus.count : total)}
                    </p>
                    <p className="mt-1 text-[9px] font-semibold leading-tight text-slate-500">
                      {focus
                        ? `${focus.percent}% dari perbandingan`
                        : "karya terverifikasi"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5">
                <HeroPeminatanRow
                  tone="bi"
                  label="Business Intelligence"
                  short="BI"
                  count={biCount}
                  percent={biPercent}
                  loading={loading}
                  active={active === "bi"}
                  onActivate={() => setActive("bi")}
                  onDeactivate={() => setActive(null)}
                  onExplore={() => onExplore(BI)}
                />
                <HeroPeminatanRow
                  tone="sa"
                  label="Smart Agriculture"
                  short="SA"
                  count={saCount}
                  percent={saPercent}
                  loading={loading}
                  active={active === "sa"}
                  onActivate={() => setActive("sa")}
                  onDeactivate={() => setActive(null)}
                  onExplore={() => onExplore(SA)}
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/80 bg-white/55 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  Rasio peminatan
                </p>
                <p className="text-[9px] font-bold text-slate-500">
                  BI {loading ? "—" : `${biPercent}%`} · SA{" "}
                  {loading ? "—" : `${saPercent}%`}
                </p>
              </div>
              <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-primary-500 to-violet-500 transition-all duration-700"
                  style={{
                    width: loading ? "0%" : `${clampPercent(biPercent)}%`,
                  }}
                />
                <div
                  className="h-full bg-gradient-to-r from-mint-400 to-mint-600 transition-all duration-700"
                  style={{
                    width: loading ? "0%" : `${clampPercent(saPercent)}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[8.5px] font-semibold text-slate-400">
                <span>
                  Berdasarkan {loading ? "—" : formatNumber(total)} skripsi
                  disetujui
                </span>
                <span className="inline-flex items-center gap-1 text-mint-600">
                  <BadgeCheck className="size-3" />
                  Terverifikasi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroPeminatanRow({
  tone,
  label,
  short,
  count,
  percent,
  loading,
  active,
  onActivate,
  onDeactivate,
  onExplore,
}: {
  tone: "bi" | "sa";
  label: string;
  short: string;
  count: number;
  percent: number;
  loading: boolean;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onExplore: () => void;
}) {
  const styles =
    tone === "bi"
      ? {
          dot: "bg-gradient-to-br from-sky-400 to-primary-500",
          badge: "bg-sky-50 text-sky-700 ring-sky-100",
          bar: "from-sky-400 via-primary-500 to-violet-500",
          focus: "focus-visible:ring-primary-400",
        }
      : {
          dot: "bg-gradient-to-br from-mint-400 to-mint-600",
          badge: "bg-mint-50 text-mint-700 ring-mint-100",
          bar: "from-mint-400 via-mint-500 to-emerald-500",
          focus: "focus-visible:ring-mint-400",
        };

  return (
    <button
      type="button"
      onClick={onExplore}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      className={cn(
        "group w-full rounded-2xl border p-3 text-left transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        active
          ? "border-white bg-white/95 shadow-soft"
          : "border-white/70 bg-white/50 hover:border-white hover:bg-white/85",
        styles.focus,
      )}
      aria-label={`Jelajahi ${label}: ${
        loading
          ? "sedang memuat data"
          : `${formatNumber(count)} skripsi (${percent}%)`
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={cn("size-2 shrink-0 rounded-full", styles.dot)} />
        <span className="min-w-0 flex-1 truncate text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-extrabold ring-1 ring-inset",
            styles.badge,
          )}
        >
          {loading ? "—" : `${percent}%`}
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-xl font-extrabold leading-none tracking-tight text-ink">
          {loading ? "—" : formatNumber(count)}
        </span>
        <span className="inline-flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-[0.08em] text-slate-400 transition group-hover:text-slate-600">
          {short} · skripsi
          <ArrowUpRight className="size-3 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700",
            styles.bar,
          )}
          style={{ width: loading ? "0%" : `${clampPercent(percent)}%` }}
        />
      </div>
    </button>
  );
}

function PeminatanCard({
  value,
  code,
  label,
  description,
  topics,
  icon: Icon,
  tone,
  count,
  loading,
  onExplore,
}: {
  value: typeof BI | typeof SA;
  code: string;
  label: string;
  description: string;
  topics: string[];
  icon: LucideIcon;
  tone: "bi" | "sa";
  count: number;
  loading: boolean;
  onExplore: (value: typeof BI | typeof SA) => void;
}) {
  const styles = PEMINATAN_TONE[tone];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card sm:p-7">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          styles.bar,
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 size-44 rounded-full blur-2xl",
          styles.blob,
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <span
          className={cn(
            "grid size-12 place-items-center rounded-2xl ring-1",
            styles.icon,
          )}
        >
          <Icon className="size-5.5" />
        </span>
        <span className="text-4xl font-extrabold tracking-tight text-slate-100">
          {code}
        </span>
      </div>

      <p className="relative mt-5 text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
        Peminatan riset {code}
      </p>
      <h3 className="relative mt-1 text-xl font-extrabold tracking-tight text-ink sm:text-[22px]">
        {label}
      </h3>
      <p className="relative mt-2.5 text-xs leading-6 text-ink-soft">
        {description}
      </p>

      <div className="relative mt-4 flex flex-wrap gap-1.5">
        {topics.map((topic) => (
          <span
            key={topic}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-bold ring-1 ring-inset",
              styles.chip,
            )}
          >
            <CheckCircle2 className="size-2.5" />
            {topic}
          </span>
        ))}
      </div>

      <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <div>
          <p className="text-lg font-extrabold tracking-tight text-ink">
            {loading ? "—" : formatNumber(count)}
          </p>
          <p className="text-[9.5px] font-semibold text-slate-400">
            skripsi terverifikasi
          </p>
        </div>
        <button
          type="button"
          onClick={() => onExplore(value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[10.5px] font-extrabold transition",
            styles.action,
          )}
        >
          Jelajahi
          <ArrowUpRight className="size-3.5" />
        </button>
      </div>
    </article>
  );
}

function CatalogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-soft">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="p-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="ml-auto h-3 w-10" />
        </div>
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ModalInfo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>
      <div className="mt-1.5 text-xs font-bold text-ink">{value}</div>
    </div>
  );
}
