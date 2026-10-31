import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Inbox,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApiQuery } from "../hooks/useApiQuery";
import { persetujuanService } from "../services/persetujuanService";
import { skripsiService } from "../services/skripsiService";
import type { Skripsi, SkripsiStatus } from "../types";
import { getApiErrorMessage } from "../lib/errors";
import { formatDate, formatNumber, percent, truncate } from "../lib/format";
import { cn } from "../lib/cn";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Avatar } from "../components/ui/Avatar";
import { StatCard } from "../components/ui/StatCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { SelectMenu } from "../components/ui/SelectMenu";
import { DataTable, type DataColumn } from "../components/ui/DataTable";
import { SkripsiPdfButton } from "../components/skripsi/SkripsiPdfButton";

type Tab = "pending" | "history";
type DecisionAction = "approve" | "reject";
type HistoryStatus = Extract<SkripsiStatus, "disetujui" | "ditolak">;

const PAGE_SIZE = 8;

export default function PersetujuanPage() {
  useDocumentTitle("Verifikasi Skripsi");
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus | "">("");
  const [page, setPage] = useState(1);
  const [decisionTarget, setDecisionTarget] = useState<{
    item: Skripsi;
    action: DecisionAction;
  } | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const highlightTimer = useRef<number | undefined>(undefined);
  const refreshTimer = useRef<number | undefined>(undefined);

  const pendingQuery = useApiQuery(() => persetujuanService.list(), []);
  const allQuery = useApiQuery(() => skripsiService.list(), []);

  useEffect(() => {
    setPage(1);
  }, [tab, search, historyStatus]);

  useEffect(() => {
    return () => {
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    };
  }, []);

  const pending = useMemo(
    () => pendingQuery.data?.data ?? [],
    [pendingQuery.data],
  );
  const allData = useMemo(() => allQuery.data?.data ?? [], [allQuery.data]);

  const approved = useMemo(
    () => allData.filter((item) => item.status === "disetujui"),
    [allData],
  );
  const rejected = useMemo(
    () => allData.filter((item) => item.status === "ditolak"),
    [allData],
  );

  const filteredPending = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pending;
    return pending.filter(
      (item) =>
        item.judul.toLowerCase().includes(query) ||
        item.nim.toLowerCase().includes(query) ||
        (item.namaMahasiswa ?? "").toLowerCase().includes(query),
    );
  }, [pending, search]);

  const history = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allData
      .filter((item) => item.status === "disetujui" || item.status === "ditolak")
      .filter((item) => !historyStatus || item.status === historyStatus)
      .filter(
        (item) =>
          !query ||
          item.judul.toLowerCase().includes(query) ||
          item.nim.toLowerCase().includes(query) ||
          (item.namaMahasiswa ?? "").toLowerCase().includes(query),
      );
  }, [allData, historyStatus, search]);

  const activeTotal = tab === "pending" ? filteredPending.length : history.length;
  const pageCount = Math.max(1, Math.ceil(activeTotal / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const pendingPageData = filteredPending.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const historyPageData = history.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (!user) return null;

  const handleDecision = async () => {
    if (!decisionTarget) return;
    setDeciding(true);
    const targetId = decisionTarget.item.id;
    try {
      if (decisionTarget.action === "approve") {
        await persetujuanService.approve(targetId);
        toast.success(
          "Skripsi disetujui",
          `“${truncate(decisionTarget.item.judul, 60)}” berhasil disetujui.`,
        );
      } else {
        await persetujuanService.reject(targetId);
        toast.warning(
          "Skripsi ditolak",
          `“${truncate(decisionTarget.item.judul, 60)}” ditolak. Mahasiswa dapat memperbaikinya.`,
        );
      }
      setDecisionTarget(null);
      setHighlightId(targetId);
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(() => setHighlightId(null), 2200);
      // Beri jeda singkat agar baris sempat menyala sebelum keluar dari daftar.
      refreshTimer.current = window.setTimeout(() => {
        pendingQuery.refetch();
        allQuery.refetch();
      }, 480);
    } catch (err) {
      toast.error("Gagal memproses", getApiErrorMessage(err));
    } finally {
      setDeciding(false);
    }
  };

  const loading = pendingQuery.loading || allQuery.loading;
  const error = pendingQuery.error ?? allQuery.error;
  const hasFilters = Boolean(search || (tab === "history" && historyStatus));
  const filterKey = `${tab}-${search}-${historyStatus}-${currentPage}`;

  const resetFilters = () => {
    setSearch("");
    setHistoryStatus("");
  };

  const buildColumns = (withActions: boolean): DataColumn<Skripsi>[] => [
    {
      key: "mahasiswa",
      header: "Mahasiswa",
      render: (item) => {
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
      className: "max-w-[330px]",
      render: (item) => (
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
      render: (item) => <PeminatanBadge value={item.peminatan} size="xs" short />,
    },
    {
      key: "tanggal",
      header: "Diajukan",
      render: (item) => (
        <span className="whitespace-nowrap text-[11px] text-ink-soft">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} size="xs" />,
    },
    {
      key: "aksi",
      header: <span className="sr-only">Aksi</span>,
      className: "text-right",
      headerClassName: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconAction
            label={`Review ${item.judul}`}
            icon={<Eye className="size-4" />}
            onClick={() => navigate(`/repository/${item.id}`)}
          />
          {withActions ? (
            <>
              <IconAction
                label={`Setujui ${item.judul}`}
                icon={<CheckCircle2 className="size-4" />}
                tone="mint"
                onClick={() =>
                  setDecisionTarget({ item, action: "approve" })
                }
              />
              <IconAction
                label={`Tolak ${item.judul}`}
                icon={<XCircle className="size-4" />}
                tone="danger"
                onClick={() =>
                  setDecisionTarget({ item, action: "reject" })
                }
              />
            </>
          ) : null}
        </div>
      ),
    },
  ];

  const renderMobile = (item: Skripsi, withActions: boolean) => {
    const name = item.namaMahasiswa ?? `Mahasiswa NIM ${item.nim}`;
    return (
      <article
        className={cn(
          "rounded-card border bg-white p-4 shadow-soft transition-colors",
          highlightId === item.id
            ? "border-sa-300 bg-sa-50/60"
            : "border-navy-100/70",
        )}
      >
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
          title={item.judul}
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
          {withActions ? (
            <>
              <Button
                variant="mint"
                size="sm"
                icon={<CheckCircle2 />}
                onClick={() =>
                  setDecisionTarget({ item, action: "approve" })
                }
              >
                Setujui
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle />}
                onClick={() =>
                  setDecisionTarget({ item, action: "reject" })
                }
              >
                Tolak
              </Button>
            </>
          ) : null}
        </div>
      </article>
    );
  };

  const emptyState = (
    <EmptyState
      icon={
        hasFilters ? (
          <Search className="size-5" />
        ) : tab === "pending" ? (
          <CheckCircle2 className="size-5" />
        ) : (
          <BadgeCheck className="size-5" />
        )
      }
      title={
        hasFilters
          ? "Tidak ada data yang cocok"
          : tab === "pending"
            ? "Tidak ada pengajuan menunggu"
            : "Belum ada riwayat keputusan"
      }
      description={
        hasFilters
          ? "Coba ubah kata kunci atau filter status."
          : tab === "pending"
            ? "Semua pengajuan sudah diproses. Pengajuan baru akan tampil otomatis saat mahasiswa mengirimkannya."
            : "Keputusan yang sudah dibuat akan tersimpan di sini."
      }
      action={
        hasFilters ? (
          <Button variant="secondary" onClick={resetFilters}>
            Reset filter
          </Button>
        ) : undefined
      }
    />
  );

  const currentRows =
    tab === "pending" ? pendingPageData : historyPageData;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang keputusan Kaprodi"
        title="Verifikasi Skripsi"
        description="Tinjau pengajuan mahasiswa, periksa kelengkapan berkas, lalu setujui atau tolak dengan keputusan yang tercatat."
        icon={<ShieldCheck className="size-3" />}
        actions={
          <Button
            variant="secondary"
            icon={<RefreshCw />}
            onClick={() => {
              pendingQuery.refetch();
              allQuery.refetch();
            }}
            loading={loading}
          >
            Muat ulang
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Menunggu"
          value={pendingQuery.data?.total ?? pending.length}
          caption="Pengajuan baru masuk"
          icon={<Clock3 className="size-5" />}
          tone="amber"
          badge={`${formatNumber(filteredPending.length)} tampil`}
          loading={pendingQuery.loading}
        />
        <StatCard
          label="Disetujui"
          value={approved.length}
          caption="Lolos verifikasi"
          icon={<CheckCircle2 className="size-5" />}
          tone="sa"
          badge={`${percent(approved.length, allData.length)}% dari skripsi`}
          loading={allQuery.loading}
        />
        <StatCard
          label="Ditolak"
          value={rejected.length}
          caption="Perlu perbaikan"
          icon={<XCircle className="size-5" />}
          tone="rose"
          badge={`${percent(rejected.length, allData.length)}% dari skripsi`}
          loading={allQuery.loading}
        />
        <StatCard
          label="Total Skripsi"
          value={allData.length}
          caption="Seluruh repository"
          icon={<FileText className="size-5" />}
          tone="bi"
          badge={`${formatNumber(pending.length)} dalam antrean`}
          loading={allQuery.loading}
        />
      </section>

      {error ? (
        <div className="flex flex-col items-start gap-2 rounded-card border border-coral-200 bg-coral-50/80 px-4 py-3 text-xs text-coral-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium">{error}</p>
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw />}
            onClick={() => {
              pendingQuery.refetch();
              allQuery.refetch();
            }}
          >
            Coba lagi
          </Button>
        </div>
      ) : null}

      <Card padded={false}>
        <div className="border-b border-navy-50 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div
              className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-input bg-navy-50/70 p-1"
              role="tablist"
              aria-label="Status pengajuan"
            >
              <TabButton
                active={tab === "pending"}
                onClick={() => setTab("pending")}
                icon={<Inbox className="size-4" />}
                label="Menunggu"
                count={pendingQuery.data?.total ?? pending.length}
                panelId="panel-pending"
                id="tab-pending"
                reduceMotion={Boolean(reduceMotion)}
              />
              <TabButton
                active={tab === "history"}
                onClick={() => setTab("history")}
                icon={<BadgeCheck className="size-4" />}
                label="Riwayat"
                count={approved.length + rejected.length}
                panelId="panel-history"
                id="tab-history"
                reduceMotion={Boolean(reduceMotion)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Cari judul, nama, atau NIM…"
                icon={Search}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                wrapperClassName="sm:w-60"
                aria-label="Cari pengajuan"
              />
              {tab === "history" ? (
                <SelectMenu
                  label=""
                  value={historyStatus}
                  onChange={(value) =>
                    setHistoryStatus(value as HistoryStatus | "")
                  }
                  options={[
                    { value: "", label: "Semua keputusan" },
                    { value: "disetujui", label: "Disetujui" },
                    { value: "ditolak", label: "Ditolak" },
                  ]}
                  className="sm:w-44"
                />
              ) : null}
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-soft">
            <span>
              {formatNumber(activeTotal)}{" "}
              {tab === "pending" ? "pengajuan menunggu" : "keputusan tersimpan"}
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Menunggu
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-sa-500" />
              Disetujui
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-coral-500" />
              Ditolak
            </span>
          </div>
        </div>

        <div
          className="p-4 sm:p-5"
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          {reduceMotion ? (
            <div key={filterKey}>
              <VerificationTable
                rows={currentRows}
                loading={loading}
                tab={tab}
                columns={buildColumns(tab === "pending")}
                empty={emptyState}
                renderMobile={(item) => renderMobile(item, tab === "pending")}
                highlightId={highlightId}
              />
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={filterKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <VerificationTable
                  rows={currentRows}
                  loading={loading}
                  tab={tab}
                  columns={buildColumns(tab === "pending")}
                  empty={emptyState}
                  renderMobile={(item) => renderMobile(item, tab === "pending")}
                  highlightId={highlightId}
                />
              </motion.div>
            </AnimatePresence>
          )}

          {!loading && currentRows.length > 0 ? (
            <Pagination
              total={activeTotal}
              page={currentPage}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel={tab === "pending" ? "pengajuan" : "keputusan"}
              className="mt-5"
            />
          ) : null}
        </div>
      </Card>

      <div className="flex flex-col items-start justify-between gap-3 rounded-card border border-bi-100 bg-gradient-to-r from-bi-50/80 via-white to-sa-50/60 px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-input bg-white text-bi-600 shadow-soft ring-1 ring-bi-100">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold text-ink">
              Keputusan tersimpan otomatis
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
              Setiap persetujuan atau penolakan langsung tercatat dan mengubah
              status skripsi di repository. Mahasiswa dapat melihat hasilnya dari
              dashboard mereka.
            </p>
          </div>
        </div>
        <Link to="/pemetaan">
          <Button variant="outline" size="sm" icon={<BadgeCheck />}>
            Lihat pemetaan
          </Button>
        </Link>
      </div>

      <ConfirmDialog
        open={Boolean(decisionTarget)}
        onClose={() => setDecisionTarget(null)}
        onConfirm={() => void handleDecision()}
        title={
          decisionTarget?.action === "approve"
            ? "Setujui skripsi ini?"
            : "Tolak skripsi ini?"
        }
        description={
          decisionTarget
            ? `${decisionTarget.item.namaMahasiswa ?? `NIM ${decisionTarget.item.nim}`} — “${truncate(decisionTarget.item.judul, 80)}”`
            : ""
        }
        confirmLabel={
          decisionTarget?.action === "approve" ? "Ya, setujui" : "Ya, tolak"
        }
        tone={decisionTarget?.action === "approve" ? "mint" : "danger"}
        loading={deciding}
      >
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ink-soft">
            {decisionTarget?.action === "approve"
              ? "Skripsi akan berstatus disetujui dan tampil sebagai karya yang lolos verifikasi di repository."
              : "Skripsi akan berstatus ditolak. Mahasiswa masih dapat memperbaiki data dan mengajukannya kembali."}
          </p>
          {decisionTarget?.item.fileUrl ? (
            <SkripsiPdfButton
              id={decisionTarget.item.id}
              title={decisionTarget.item.judul}
              mode="open"
              variant="secondary"
              size="sm"
              label="Periksa berkas PDF"
              className="w-fit"
            />
          ) : (
            <div className="flex items-start gap-2 rounded-input border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700">
              <FileText className="mt-0.5 size-3.5 shrink-0" />
              Pengajuan ini belum memiliki berkas PDF. Pastikan keputusan sudah
              mempertimbangkan kondisi tersebut.
            </div>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}

function VerificationTable({
  rows,
  loading,
  tab,
  columns,
  empty,
  renderMobile,
  highlightId,
}: {
  rows: Skripsi[];
  loading: boolean;
  tab: Tab;
  columns: DataColumn<Skripsi>[];
  empty: ReactNode;
  renderMobile: (item: Skripsi) => ReactNode;
  highlightId: number | null;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-input" />
        ))}
      </div>
    );
  }

  return (
    <DataTable
      rows={rows}
      columns={columns}
      empty={empty}
      stickyHeader
      caption={
        tab === "pending"
          ? "Daftar pengajuan menunggu verifikasi"
          : "Riwayat keputusan skripsi"
      }
      rowClassName={(row) =>
        cn(
          highlightId === row.id && "bg-sa-50/70",
          tab === "pending" && "bg-amber-50/15",
        )
      }
      renderMobile={renderMobile}
    />
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  id,
  panelId,
  reduceMotion,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
  id: string;
  panelId: string;
  reduceMotion: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={panelId}
      onClick={onClick}
      className={cn(
        "relative flex h-11 shrink-0 items-center gap-2 rounded-input px-3.5 text-xs font-bold transition-colors",
        active ? "text-white" : "text-ink-soft hover:text-ink",
      )}
    >
      {active ? (
        reduceMotion ? (
          <span className="absolute inset-0 rounded-input bg-navy-800 shadow-soft" />
        ) : (
          <motion.span
            layoutId="kaprodi-tab-pill"
            className="absolute inset-0 rounded-input bg-navy-800 shadow-soft"
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          />
        )
      ) : null}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {label}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-extrabold",
            active ? "bg-white/15 text-white" : "bg-white text-ink-faint",
          )}
        >
          {formatNumber(count)}
        </span>
      </span>
    </button>
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
