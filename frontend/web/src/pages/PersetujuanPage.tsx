import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { formatDate, formatNumber, truncate } from "../lib/format";
import { cn } from "../lib/cn";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton, TableSkeleton } from "../components/ui/Skeleton";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
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

  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus | "">("");
  const [page, setPage] = useState(1);
  const [decisionTarget, setDecisionTarget] = useState<{
    item: Skripsi;
    action: DecisionAction;
  } | null>(null);
  const [deciding, setDeciding] = useState(false);

  const pendingQuery = useApiQuery(() => persetujuanService.list(), []);
  const allQuery = useApiQuery(() => skripsiService.list(), []);

  useEffect(() => {
    setPage(1);
  }, [tab, search, historyStatus]);

  const pending = pendingQuery.data?.data ?? [];
  const allData = allQuery.data?.data ?? [];

  const approved = useMemo(
    () => allData.filter((item) => item.status === "disetujui"),
    [allData],
  );
  const rejected = useMemo(
    () => allData.filter((item) => item.status === "ditolak"),
    [allData],
  );

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

  const historyPageCount = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const historyPage = Math.min(page, historyPageCount);
  const historyPageData = history.slice(
    (historyPage - 1) * PAGE_SIZE,
    historyPage * PAGE_SIZE,
  );

  if (!user) return null;

  const handleDecision = async () => {
    if (!decisionTarget) return;
    setDeciding(true);
    try {
      if (decisionTarget.action === "approve") {
        await persetujuanService.approve(decisionTarget.item.id);
        toast.success(
          "Skripsi disetujui",
          `“${truncate(decisionTarget.item.judul, 60)}” berhasil disetujui.`,
        );
      } else {
        await persetujuanService.reject(decisionTarget.item.id);
        toast.warning(
          "Skripsi ditolak",
          `“${truncate(decisionTarget.item.judul, 60)}” ditolak. Mahasiswa dapat memperbaikinya.`,
        );
      }
      setDecisionTarget(null);
      pendingQuery.refetch();
      allQuery.refetch();
    } catch (err) {
      toast.error("Gagal memproses", getApiErrorMessage(err));
    } finally {
      setDeciding(false);
    }
  };

  const loading = pendingQuery.loading || allQuery.loading;
  const error = pendingQuery.error ?? allQuery.error;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ruang keputusan Kaprodi"
        title="Verifikasi Skripsi"
        description="Tinjau pengajuan mahasiswa, lalu setujui atau tolak berdasarkan kelengkapan data dan berkas."
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
        <MiniStat
          label="Menunggu"
          value={pendingQuery.data?.total ?? 0}
          caption="Pengajuan baru"
          icon={<Clock3 className="size-4" />}
          className="border-amber-100 bg-gradient-to-br from-amber-50 to-white text-amber-600"
          loading={pendingQuery.loading}
        />
        <MiniStat
          label="Disetujui"
          value={approved.length}
          caption="Lolos verifikasi"
          icon={<CheckCircle2 className="size-4" />}
          className="border-mint-100 bg-gradient-to-br from-mint-50 to-white text-mint-600"
          loading={allQuery.loading}
        />
        <MiniStat
          label="Ditolak"
          value={rejected.length}
          caption="Perlu perbaikan"
          icon={<XCircle className="size-4" />}
          className="border-coral-100 bg-gradient-to-br from-coral-50 to-white text-coral-600"
          loading={allQuery.loading}
        />
        <MiniStat
          label="Total Skripsi"
          value={allData.length}
          caption="Seluruh repository"
          icon={<FileText className="size-4" />}
          className="border-primary-100 bg-gradient-to-br from-primary-50 to-white text-primary-600"
          loading={allQuery.loading}
        />
      </section>

      {error ? (
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-coral-200 bg-coral-50/80 px-4 py-3 text-xs text-coral-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
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
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
            <TabButton
              active={tab === "pending"}
              onClick={() => setTab("pending")}
              icon={<Inbox className="size-3.5" />}
              label="Menunggu"
              count={pendingQuery.data?.total ?? 0}
            />
            <TabButton
              active={tab === "history"}
              onClick={() => setTab("history")}
              icon={<BadgeCheck className="size-3.5" />}
              label="Riwayat"
              count={approved.length + rejected.length}
            />
          </div>

          {tab === "history" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Cari judul atau NIM…"
                icon={Search}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                wrapperClassName="sm:w-64"
              />
              <select
                value={historyStatus}
                onChange={(event) =>
                  setHistoryStatus(event.target.value as HistoryStatus | "")
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
              >
                <option value="">Semua keputusan</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          ) : (
            <p className="text-[11px] text-ink-soft">
              Pengajuan yang masuk akan tampil di sini secara real-time dari API.
            </p>
          )}
        </div>

        {tab === "pending" ? (
          <div className="p-4 sm:p-5">
            {pendingQuery.loading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : pendingQuery.error ? (
              <EmptyState
                icon={<RefreshCw className="size-5" />}
                title="Gagal memuat pengajuan"
                description={pendingQuery.error}
                action={
                  <Button variant="secondary" onClick={pendingQuery.refetch}>
                    Coba lagi
                  </Button>
                }
              />
            ) : pending.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="size-5" />}
                title="Tidak ada pengajuan menunggu"
                description="Semua pengajuan sudah diproses. Pengajuan baru akan tampil otomatis saat mahasiswa mengirimkannya."
              />
            ) : (
              <div className="space-y-3">
                {pending.map((item) => (
                  <PendingCard
                    key={item.id}
                    item={item}
                    onDecision={(action) => setDecisionTarget({ item, action })}
                    onView={() => navigate(`/repository/${item.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            {allQuery.loading ? (
              <TableSkeleton rows={5} />
            ) : historyPageData.length === 0 ? (
              <EmptyState
                icon={<Search className="size-5" />}
                title="Belum ada riwayat keputusan"
                description={
                  historyStatus || search
                    ? "Tidak ada data yang cocok dengan filter saat ini."
                    : "Keputusan yang sudah dibuat akan tersimpan di sini."
                }
                action={
                  historyStatus || search ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setHistoryStatus("");
                        setSearch("");
                      }}
                    >
                      Reset filter
                    </Button>
                  ) : null
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="table-head">
                        <th className="px-4 py-2.5 font-bold">Skripsi</th>
                        <th className="px-3 py-2.5 font-bold">NIM</th>
                        <th className="px-3 py-2.5 font-bold">Peminatan</th>
                        <th className="px-3 py-2.5 font-bold">Keputusan</th>
                        <th className="px-3 py-2.5 font-bold">Tanggal</th>
                        <th className="px-4 py-2.5 text-right font-bold">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyPageData.map((item) => (
                        <tr key={item.id} className="table-row">
                          <td className="px-4 py-3.5">
                            <Link
                              to={`/repository/${item.id}`}
                              className="block max-w-md text-xs font-bold leading-relaxed text-ink hover:text-primary-600"
                            >
                              {truncate(item.judul, 82)}
                            </Link>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {item.programStudi} · {item.tahun}
                            </p>
                          </td>
                          <td className="px-3 py-3.5 text-xs font-semibold text-slate-600">
                            {item.nim}
                          </td>
                          <td className="px-3 py-3.5">
                            <PeminatanBadge value={item.peminatan} size="xs" short />
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusBadge status={item.status} size="xs" />
                          </td>
                          <td className="px-3 py-3.5 text-[11px] text-slate-500">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <IconButton
                              label="Lihat detail"
                              onClick={() => navigate(`/repository/${item.id}`)}
                              icon={<Eye className="size-3.5" />}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <Pagination
                    total={history.length}
                    page={historyPage}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                    itemLabel="keputusan"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Card>

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
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700">
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

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition",
        active
          ? "bg-white text-ink shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[9px]",
          active ? "bg-primary-50 text-primary-600" : "bg-slate-200/70 text-slate-500",
        )}
      >
        {formatNumber(count)}
      </span>
    </button>
  );
}

function MiniStat({
  label,
  value,
  caption,
  icon,
  className,
  loading,
}: {
  label: string;
  value: number;
  caption: string;
  icon: ReactNode;
  className: string;
  loading: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-80">
          {label}
        </p>
        <span className="grid size-8 place-items-center rounded-xl bg-white/80 shadow-sm">
          {icon}
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-14" />
      ) : (
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
          {formatNumber(value)}
        </p>
      )}
      <p className="mt-0.5 text-[10px] text-ink-soft">{caption}</p>
    </div>
  );
}

function PendingCard({
  item,
  onDecision,
  onView,
}: {
  item: Skripsi;
  onDecision: (action: DecisionAction) => void;
  onView: () => void;
}) {
  const name = item.namaMahasiswa ?? `Mahasiswa NIM ${item.nim}`;
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300/80 hover:shadow-soft sm:p-5">
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-300 to-amber-500" />
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber" size="xs" dot>
              Menunggu verifikasi
            </Badge>
            <PeminatanBadge value={item.peminatan} size="xs" short />
            <span className="text-[10px] font-semibold text-slate-400">
              {item.tahun} · ID #{item.id}
            </span>
          </div>
          <Link
            to={`/repository/${item.id}`}
            className="mt-2.5 block text-sm font-extrabold leading-snug text-ink transition hover:text-primary-600"
          >
            {item.judul}
          </Link>
          <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-ink-soft">
            {item.abstrak || "Abstrak belum diisi oleh mahasiswa."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-2">
              <Avatar name={name} size="sm" className="size-7 rounded-lg text-[9px]" />
              <span>
                <span className="font-bold text-ink">{name}</span>
                {item.emailMahasiswa ? (
                  <span className="ml-1.5 text-slate-400">{item.emailMahasiswa}</span>
                ) : null}
              </span>
            </span>
            <span>NIM {item.nim}</span>
            <span>{item.programStudi}</span>
            <span>Diajukan {formatDate(item.createdAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 xl:flex-col xl:items-stretch">
          {item.fileUrl ? (
            <SkripsiPdfButton
              id={item.id}
              title={item.judul}
              variant="secondary"
              size="sm"
              label="Berkas PDF"
              className="w-full"
            />
          ) : (
            <Button variant="secondary" size="sm" icon={<FileText />} disabled className="w-full">
              Tanpa berkas
            </Button>
          )}
          <Button
            variant="mint"
            size="sm"
            icon={<CheckCircle2 />}
            onClick={() => onDecision("approve")}
            className="w-full"
          >
            Setujui
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<XCircle />}
            onClick={() => onDecision("reject")}
            className="w-full"
          >
            Tolak
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye />}
            onClick={onView}
            className="w-full"
          >
            Detail
          </Button>
        </div>
      </div>
    </article>
  );
}

function IconButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg border border-transparent text-slate-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
    >
      {icon}
    </button>
  );
}
