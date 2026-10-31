import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Layers3,
  Library,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  Trash2,
  UserPlus,
  UserRoundX,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { mahasiswaService } from "../services/mahasiswaService";
import { skripsiService } from "../services/skripsiService";
import { BI, SA } from "../constants";
import type { Mahasiswa, Skripsi, SkripsiStatus } from "../types";
import { getApiErrorMessage } from "../lib/errors";
import { formatDate, formatNumber, getAngkatan } from "../lib/format";
import { cn } from "../lib/cn";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { StatCard } from "../components/ui/StatCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { SelectMenu } from "../components/ui/SelectMenu";
import { DataTable, type DataColumn } from "../components/ui/DataTable";
import { SkripsiPdfButton } from "../components/skripsi/SkripsiPdfButton";
import { MahasiswaFormModal } from "../components/mahasiswa/MahasiswaFormModal";

const PAGE_SIZE = 10;
const NO_PEMINATAN = "belum";

type Tab = "students" | "documents";
type PeminatanFilter = "" | "bi" | "sa" | typeof NO_PEMINATAN | "lainnya";
type DocumentStatusFilter = "" | SkripsiStatus;

export default function MahasiswaPage() {
  useDocumentTitle("Data Mahasiswa");
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [tab, setTab] = useState<Tab>("students");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [peminatanFilter, setPeminatanFilter] = useState<PeminatanFilter>("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatusFilter>("");
  const [angkatanFilter, setAngkatanFilter] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<Mahasiswa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mahasiswa | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<Skripsi | null>(null);

  const query = useApiQuery(() => mahasiswaService.list(), []);
  const documentsQuery = useApiQuery(() => skripsiService.list(), []);

  const mahasiswa = useMemo(() => query.data?.data ?? [], [query.data]);
  const documents = useMemo(() => documentsQuery.data?.data ?? [], [documentsQuery.data]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, peminatanFilter, statusFilter, angkatanFilter]);

  const stats = useMemo(() => {
    let bi = 0;
    let sa = 0;
    let kosong = 0;
    let lain = 0;
    for (const item of mahasiswa) {
      if (item.peminatan === BI) bi += 1;
      else if (item.peminatan === SA) sa += 1;
      else if (!item.peminatan) kosong += 1;
      else lain += 1;
    }
    return { total: mahasiswa.length, bi, sa, kosong, lain };
  }, [mahasiswa]);

  const documentCounts = useMemo(() => {
    const counts: Record<SkripsiStatus, number> = {
      draft: 0,
      diajukan: 0,
      disetujui: 0,
      ditolak: 0,
    };
    for (const item of documents) counts[item.status] += 1;
    return counts;
  }, [documents]);

  const angkatanOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of mahasiswa) {
      const angkatan = getAngkatan(item.nim);
      if (angkatan !== "—") values.add(angkatan);
    }
    for (const item of documents) {
      const angkatan = getAngkatan(item.nim);
      if (angkatan !== "—") values.add(angkatan);
    }
    return Array.from(values).sort((a, b) => Number(b) - Number(a));
  }, [mahasiswa, documents]);

  const filteredStudents = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    return mahasiswa.filter((item) => {
      const matchSearch =
        !keyword ||
        item.nama.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.nim.toLowerCase().includes(keyword) ||
        item.programStudi.toLowerCase().includes(keyword);

      const matchPeminatan =
        !peminatanFilter ||
        (peminatanFilter === NO_PEMINATAN && !item.peminatan) ||
        (peminatanFilter === "lainnya" &&
          Boolean(item.peminatan) &&
          item.peminatan !== BI &&
          item.peminatan !== SA) ||
        (peminatanFilter === "bi" && item.peminatan === BI) ||
        (peminatanFilter === "sa" && item.peminatan === SA);

      const matchAngkatan =
        !angkatanFilter || getAngkatan(item.nim) === angkatanFilter;

      return matchSearch && matchPeminatan && matchAngkatan;
    });
  }, [mahasiswa, debouncedSearch, peminatanFilter, angkatanFilter]);

  const filteredDocuments = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    return documents.filter((item) => {
      const matchSearch =
        !keyword ||
        item.judul.toLowerCase().includes(keyword) ||
        item.nim.toLowerCase().includes(keyword) ||
        (item.namaMahasiswa ?? "").toLowerCase().includes(keyword);
      const matchStatus = !statusFilter || item.status === statusFilter;
      const matchAngkatan =
        !angkatanFilter || getAngkatan(item.nim) === angkatanFilter;
      return matchSearch && matchStatus && matchAngkatan;
    });
  }, [documents, debouncedSearch, statusFilter, angkatanFilter]);

  const activeTotal =
    tab === "students" ? filteredStudents.length : filteredDocuments.length;
  const pageCount = Math.max(1, Math.ceil(activeTotal / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const pageStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const pageDocuments = filteredDocuments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasFilters =
    tab === "students"
      ? Boolean(debouncedSearch || peminatanFilter || angkatanFilter)
      : Boolean(debouncedSearch || statusFilter || angkatanFilter);

  if (!user) return null;

  const openCreate = () => {
    setFormMode("create");
    setEditTarget(null);
    setFormOpen(true);
  };

  const openEdit = (item: Mahasiswa) => {
    setFormMode("edit");
    setEditTarget(item);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mahasiswaService.remove(deleteTarget.id);
      toast.success(
        "Data mahasiswa dihapus",
        "Akun, data akademik, dan seluruh skripsi terkait telah dihapus.",
      );
      setDeleteTarget(null);
      query.refetch();
      documentsQuery.refetch();
    } catch (err) {
      toast.error("Gagal menghapus", getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setPeminatanFilter("");
    setStatusFilter("");
    setAngkatanFilter("");
  };

  const studentChips: { value: PeminatanFilter; label: string; count: number }[] = [
    { value: "", label: "Semua", count: stats.total },
    { value: "bi", label: "BI", count: stats.bi },
    { value: "sa", label: "SA", count: stats.sa },
    { value: NO_PEMINATAN, label: "Belum memilih", count: stats.kosong },
  ];

  const documentChips: { value: DocumentStatusFilter; label: string; count: number }[] = [
    { value: "", label: "Semua status", count: documents.length },
    { value: "diajukan", label: "Menunggu", count: documentCounts.diajukan },
    { value: "disetujui", label: "Disetujui", count: documentCounts.disetujui },
    { value: "ditolak", label: "Ditolak", count: documentCounts.ditolak },
  ];

  const chips = tab === "students" ? studentChips : documentChips;
  const activeChip = tab === "students" ? peminatanFilter : statusFilter;
  const setActiveChip = (value: string) => {
    if (tab === "students") setPeminatanFilter(value as PeminatanFilter);
    else setStatusFilter(value as DocumentStatusFilter);
  };

  const studentColumns: DataColumn<Mahasiswa>[] = [
    {
      key: "mahasiswa",
      header: "Mahasiswa",
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.nama} size="md" />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-ink">{item.nama}</p>
            <p className="mt-0.5 truncate text-[10px] text-ink-faint">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "nim",
      header: "NIM",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-ink-soft">
          {item.nim}
        </span>
      ),
    },
    {
      key: "prodi",
      header: "Program studi",
      render: (item) => (
        <span className="text-xs text-ink-soft">{item.programStudi}</span>
      ),
    },
    {
      key: "angkatan",
      header: "Angkatan",
      render: (item) => (
        <Badge tone="navy" size="xs">
          <CalendarDays className="size-3" />
          {getAngkatan(item.nim)}
        </Badge>
      ),
    },
    {
      key: "peminatan",
      header: "Peminatan",
      render: (item) => <PeminatanBadge value={item.peminatan} size="xs" short />,
    },
    {
      key: "aksi",
      header: <span className="sr-only">Aksi</span>,
      className: "text-right",
      headerClassName: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconAction
            label={`Edit data ${item.nama}`}
            icon={<Pencil className="size-4" />}
            onClick={() => openEdit(item)}
          />
          <IconAction
            label={`Hapus data ${item.nama}`}
            tone="danger"
            icon={<Trash2 className="size-4" />}
            onClick={() => setDeleteTarget(item)}
          />
        </div>
      ),
    },
  ];

  const documentColumns: DataColumn<Skripsi>[] = [
    {
      key: "dokumen",
      header: "Dokumen Skripsi",
      className: "max-w-[340px]",
      render: (item) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(`/repository/${item.id}`)}
            title={item.judul}
            className="line-clamp-2 text-left text-xs font-bold leading-relaxed text-ink transition hover:text-bi-600"
          >
            {item.judul}
          </button>
          <p className="mt-1 truncate text-[10px] text-ink-faint">
            {item.namaMahasiswa ?? `NIM ${item.nim}`} · {item.nim} · {item.tahun}
          </p>
        </div>
      ),
    },
    {
      key: "peminatan",
      header: "Peminatan",
      render: (item) => <PeminatanBadge value={item.peminatan} size="xs" short />,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} size="xs" />,
    },
    {
      key: "tanggal",
      header: "Tanggal",
      render: (item) => (
        <span className="whitespace-nowrap text-[11px] text-ink-soft">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      key: "aksi",
      header: <span className="sr-only">Aksi</span>,
      className: "text-right",
      headerClassName: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconAction
            label={`Periksa dokumen ${item.judul}`}
            icon={<ShieldCheck className="size-4" />}
            tone="mint"
            onClick={() => setVerifyTarget(item)}
          />
          <IconAction
            label={`Buka detail ${item.judul}`}
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
              className="h-11 px-2 text-[10px] font-bold text-bi-600 hover:bg-bi-50 hover:text-bi-700"
            />
          ) : (
            <span className="px-2 text-[10px] text-ink-faint">Tanpa PDF</span>
          )}
        </div>
      ),
    },
  ];

  const filterKey = `${tab}-${debouncedSearch}-${peminatanFilter}-${statusFilter}-${angkatanFilter}-${currentPage}`;
  const content = (
    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {tab === "students" ? (
        query.error ? (
          <EmptyState
            icon={<AlertTriangle className="size-5" />}
            title="Gagal memuat data mahasiswa"
            description={query.error}
            action={
              <Button variant="secondary" icon={<RefreshCw />} onClick={query.refetch}>
                Coba lagi
              </Button>
            }
          />
        ) : (
          <>
            <DataTable
              rows={pageStudents}
              columns={studentColumns}
              loading={query.loading}
              stickyHeader
              caption="Direktori mahasiswa Informatika"
              empty={
                <EmptyState
                  icon={
                    hasFilters ? (
                      <Search className="size-5" />
                    ) : (
                      <Users className="size-5" />
                    )
                  }
                  title={
                    hasFilters
                      ? "Tidak ada mahasiswa yang cocok"
                      : "Belum ada data mahasiswa"
                  }
                  description={
                    hasFilters
                      ? "Coba ubah kata kunci atau filter peminatan dan angkatan."
                      : "Tambahkan data akademik setelah mahasiswa selesai membuat akun melalui halaman registrasi."
                  }
                  action={
                    hasFilters ? (
                      <Button variant="secondary" onClick={resetFilters}>
                        Reset filter
                      </Button>
                    ) : (
                      <Button icon={<UserPlus />} onClick={openCreate}>
                        Tambah mahasiswa
                      </Button>
                    )
                  }
                />
              }
              renderMobile={(item) => (
                <article className="rounded-card border border-navy-100/70 bg-white p-4 shadow-soft">
                  <div className="flex items-start gap-3">
                    <Avatar name={item.nama} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-ink">{item.nama}</p>
                      <p className="mt-0.5 truncate text-[10px] text-ink-faint">
                        {item.email}
                      </p>
                    </div>
                    <PeminatanBadge value={item.peminatan} size="xs" short />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-input bg-canvas/70 p-3 text-[11px]">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                        NIM
                      </p>
                      <p className="mt-0.5 font-mono font-semibold text-ink-soft">
                        {item.nim}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                        Angkatan
                      </p>
                      <p className="mt-0.5 font-semibold text-ink-soft">
                        {getAngkatan(item.nim)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                        Program studi
                      </p>
                      <p className="mt-0.5 font-semibold text-ink-soft">
                        {item.programStudi}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Pencil />}
                      onClick={() => openEdit(item)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Trash2 />}
                      onClick={() => setDeleteTarget(item)}
                      className="flex-1 text-coral-600"
                    >
                      Hapus
                    </Button>
                  </div>
                </article>
              )}
            />
            {!query.loading && pageStudents.length > 0 ? (
              <Pagination
                total={filteredStudents.length}
                page={currentPage}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="mahasiswa"
                className="mt-5"
              />
            ) : null}
          </>
        )
      ) : documentsQuery.error ? (
        <EmptyState
          icon={<AlertTriangle className="size-5" />}
          title="Gagal memuat dokumen repository"
          description={documentsQuery.error}
          action={
            <Button
              variant="secondary"
              icon={<RefreshCw />}
              onClick={documentsQuery.refetch}
            >
              Coba lagi
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            rows={pageDocuments}
            columns={documentColumns}
            loading={documentsQuery.loading}
            stickyHeader
            caption="Dokumen skripsi di repository"
            empty={
              <EmptyState
                icon={
                  hasFilters ? (
                    <Search className="size-5" />
                  ) : (
                    <Library className="size-5" />
                  )
                }
                title={
                  hasFilters
                    ? "Tidak ada dokumen yang cocok"
                    : "Belum ada dokumen skripsi"
                }
                description={
                  hasFilters
                    ? "Coba ubah kata kunci, status, atau angkatan."
                    : "Dokumen akan tampil setelah mahasiswa mengajukan skripsi."
                }
                action={
                  hasFilters ? (
                    <Button variant="secondary" onClick={resetFilters}>
                      Reset filter
                    </Button>
                  ) : undefined
                }
              />
            }
            renderMobile={(item) => (
              <article className="rounded-card border border-navy-100/70 bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge status={item.status} size="xs" />
                  <span className="text-[10px] text-ink-faint">{item.tahun}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/repository/${item.id}`)}
                  className="mt-2 line-clamp-3 text-left text-xs font-bold leading-relaxed text-ink"
                >
                  {item.judul}
                </button>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <PeminatanBadge value={item.peminatan} size="xs" short />
                  <span className="text-[10px] text-ink-faint">
                    {item.namaMahasiswa ?? `NIM ${item.nim}`}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-navy-50 pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ShieldCheck />}
                    onClick={() => setVerifyTarget(item)}
                  >
                    Periksa
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Eye />}
                    onClick={() => navigate(`/repository/${item.id}`)}
                  >
                    Detail
                  </Button>
                  {item.fileUrl ? (
                    <SkripsiPdfButton
                      id={item.id}
                      title={item.judul}
                      variant="secondary"
                      size="sm"
                      label="Unduh"
                    />
                  ) : null}
                </div>
              </article>
            )}
          />
          {!documentsQuery.loading && pageDocuments.length > 0 ? (
            <Pagination
              total={filteredDocuments.length}
              page={currentPage}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="dokumen"
              className="mt-5"
            />
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Manajemen akademik"
        title="Data Mahasiswa"
        description="Kelola data akademik mahasiswa dan pantau dokumen skripsi yang masuk ke repository Informatika."
        icon={<Users className="size-3" />}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<RefreshCw />}
              onClick={() => {
                query.refetch();
                documentsQuery.refetch();
              }}
              loading={query.loading || documentsQuery.loading}
            >
              Muat ulang
            </Button>
            <Button icon={<UserPlus />} onClick={openCreate}>
              Tambah mahasiswa
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total mahasiswa"
          value={stats.total}
          caption="Terdaftar di sistem"
          icon={<GraduationCap className="size-5" />}
          tone="bi"
          badge="Data akademik"
          loading={query.loading}
        />
        <StatCard
          label="Business Intelligence"
          value={stats.bi}
          caption={
            stats.total > 0
              ? `${Math.round((stats.bi / stats.total) * 100)}% dari mahasiswa`
              : "Belum ada pemetaan"
          }
          icon={<BrainCircuit className="size-5" />}
          tone="bi"
          badge={`${formatNumber(stats.bi)} mahasiswa`}
          loading={query.loading}
        />
        <StatCard
          label="Smart Agriculture"
          value={stats.sa}
          caption={
            stats.total > 0
              ? `${Math.round((stats.sa / stats.total) * 100)}% dari mahasiswa`
              : "Belum ada pemetaan"
          }
          icon={<Sprout className="size-5" />}
          tone="sa"
          badge={`${formatNumber(stats.sa)} mahasiswa`}
          loading={query.loading}
        />
        <StatCard
          label="Belum memilih"
          value={stats.kosong + stats.lain}
          caption="Perlu diarahkan ke peminatan"
          icon={<UserRoundX className="size-5" />}
          tone="amber"
          badge={`${formatNumber(stats.lain)} peminatan lain`}
          loading={query.loading}
        />
      </section>

      <Card padded={false}>
        <div className="border-b border-navy-50 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                <Layers3 className="size-3.5 text-bi-500" />
                Filter cepat
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">
                {formatNumber(activeTotal)} dari{" "}
                {formatNumber(tab === "students" ? mahasiswa.length : documents.length)}{" "}
                {tab === "students" ? "mahasiswa" : "dokumen"} tampil
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder={
                  tab === "students"
                    ? "Cari nama, NIM, atau email…"
                    : "Cari judul, nama, atau NIM…"
                }
                icon={Search}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                wrapperClassName="sm:w-64"
                aria-label="Cari data"
              />
              <SelectMenu
                label=""
                value={angkatanFilter}
                onChange={setAngkatanFilter}
                options={[
                  { value: "", label: "Semua angkatan", hint: "Seluruh tahun masuk" },
                  ...angkatanOptions.map((angkatan) => ({
                    value: angkatan,
                    label: `Angkatan ${angkatan}`,
                  })),
                ]}
                className="sm:w-44"
              />
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              ) : null}
            </div>
          </div>

          <div
            className="mt-4 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={tab === "students" ? "Filter peminatan" : "Filter status dokumen"}
          >
            {chips.map((chip) => {
              const active = activeChip === chip.value;
              return (
                <button
                  key={`${tab}-${chip.value}`}
                  type="button"
                  onClick={() => setActiveChip(chip.value)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex h-11 items-center gap-1.5 rounded-full border px-3.5 text-[11px] font-bold transition duration-150",
                    active
                      ? "border-navy-800 bg-navy-800 text-white shadow-soft"
                      : "border-navy-100 bg-white text-ink-soft hover:border-navy-200 hover:bg-navy-50/60",
                  )}
                >
                  {chip.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-extrabold",
                      active ? "bg-white/15 text-white" : "bg-navy-50 text-ink-faint",
                    )}
                  >
                    {formatNumber(chip.count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-b border-navy-50 px-4 sm:px-5">
          <div
            className="flex w-fit max-w-full gap-1 overflow-x-auto py-2"
            role="tablist"
            aria-label="Bagian pengelolaan data"
          >
            <TabButton
              active={tab === "students"}
              onClick={() => setTab("students")}
              icon={<Users className="size-4" />}
              label="Data Mahasiswa"
              count={mahasiswa.length}
              panelId="panel-students"
              id="tab-students"
              reduceMotion={Boolean(reduceMotion)}
            />
            <TabButton
              active={tab === "documents"}
              onClick={() => setTab("documents")}
              icon={<Library className="size-4" />}
              label="Dokumen Repository"
              count={documents.length}
              panelId="panel-documents"
              id="tab-documents"
              reduceMotion={Boolean(reduceMotion)}
            />
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {reduceMotion ? (
            <div key={filterKey}>{content}</div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={filterKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {content}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-card border border-bi-100 bg-bi-50/60 px-4 py-3.5">
        <Download className="mt-0.5 size-4 shrink-0 text-bi-600" />
        <p className="text-[11px] leading-relaxed text-bi-800/80">
          <span className="font-bold text-bi-900">Tips:</span> pencarian memakai
          NIM, nama, email, atau program studi. Angkatan dihitung otomatis dari dua
          digit pertama NIM (contoh 24520017 → 2024). Pada tab dokumen, tombol
          <span className="font-semibold"> Periksa </span>
          membuka ringkasan kelengkapan berkas; keputusan verifikasi tetap menjadi
          kewenangan Kaprodi.
        </p>
      </div>

      <MahasiswaFormModal
        open={formOpen}
        mode={formMode}
        target={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          query.refetch();
          setPage(1);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Hapus data mahasiswa?"
        description={
          deleteTarget
            ? `${deleteTarget.nama} · NIM ${deleteTarget.nim}`
            : undefined
        }
        confirmLabel="Hapus permanen"
        tone="danger"
        loading={deleting}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-input border border-coral-200 bg-coral-50 px-3.5 py-3 text-[11px] leading-relaxed text-coral-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Tindakan ini menghapus{" "}
              <strong>data akademik, akun login, dan seluruh skripsi</strong>{" "}
              mahasiswa tersebut secara permanen. Riwayat tidak dapat dikembalikan.
            </span>
          </div>
          <p className="text-xs leading-relaxed text-ink-soft">
            Gunakan opsi edit jika hanya ingin memperbarui NIM, program studi, atau
            peminatan.
          </p>
        </div>
      </ConfirmDialog>

      <VerifyDocumentDialog
        target={verifyTarget}
        onClose={() => setVerifyTarget(null)}
        onOpenDetail={(item) => {
          setVerifyTarget(null);
          navigate(`/repository/${item.id}`);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Local components                                                           */
/* -------------------------------------------------------------------------- */

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
        active ? "text-white" : "text-ink-soft hover:bg-navy-50/70 hover:text-ink",
      )}
    >
      {active ? (
        reduceMotion ? (
          <span className="absolute inset-0 rounded-input bg-navy-800 shadow-soft" />
        ) : (
          <motion.span
            layoutId="tendik-tab-pill"
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
            active ? "bg-white/15 text-white" : "bg-navy-50 text-ink-faint",
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

function VerifyDocumentDialog({
  target,
  onClose,
  onOpenDetail,
}: {
  target: Skripsi | null;
  onClose: () => void;
  onOpenDetail: (item: Skripsi) => void;
}) {
  const name = target?.namaMahasiswa ?? (target ? `NIM ${target.nim}` : "—");

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title="Periksa Dokumen Skripsi"
      description="Ringkasan kelengkapan dokumen sebelum diteruskan ke Kaprodi."
      icon={<ShieldCheck className="size-5" />}
      size="md"
      footer={
        <>
          {target?.fileUrl ? (
            <SkripsiPdfButton
              id={target.id}
              title={target.judul}
              mode="open"
              variant="secondary"
              size="sm"
              label="Buka PDF"
            />
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          {target ? (
            <Button icon={<Eye />} onClick={() => onOpenDetail(target)}>
              Lihat detail
            </Button>
          ) : null}
        </>
      }
    >
      {target ? (
        <div className="space-y-4">
          <div className="rounded-card border border-navy-100 bg-canvas/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={target.status} size="xs" />
              <PeminatanBadge value={target.peminatan} size="xs" short />
              <span className="text-[10px] text-ink-faint">
                ID #{target.id} · {target.tahun}
              </span>
            </div>
            <p className="mt-2.5 text-sm font-bold leading-relaxed text-ink">
              {target.judul}
            </p>
            <p className="mt-1 text-[11px] text-ink-soft">
              {name} · NIM {target.nim} · {target.programStudi}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="rounded-input border border-navy-50 bg-white p-3">
              <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                Diajukan
              </dt>
              <dd className="mt-1 font-semibold text-ink-soft">
                {formatDate(target.createdAt)}
              </dd>
            </div>
            <div className="rounded-input border border-navy-50 bg-white p-3">
              <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                Berkas PDF
              </dt>
              <dd
                className={cn(
                  "mt-1 font-semibold",
                  target.fileUrl ? "text-sa-700" : "text-amber-700",
                )}
              >
                {target.fileUrl ? "Tersedia" : "Belum diunggah"}
              </dd>
            </div>
            <div className="col-span-2 rounded-input border border-navy-50 bg-white p-3">
              <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                Abstrak
              </dt>
              <dd className="mt-1 line-clamp-4 leading-relaxed text-ink-soft">
                {target.abstrak || "Abstrak belum diisi oleh mahasiswa."}
              </dd>
            </div>
          </dl>

          {target.fileUrl ? (
            <div className="flex items-start gap-2 rounded-input border border-sa-200 bg-sa-50/70 px-3 py-2.5 text-[11px] text-sa-800">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
              Dokumen PDF tersedia dan dapat diperiksa sebelum diteruskan ke Kaprodi.
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-input border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-[11px] text-amber-800">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              Pengajuan belum memiliki berkas PDF. Ingatkan mahasiswa untuk
              melengkapinya sebelum diverifikasi.
            </div>
          )}

          <p className="flex items-start gap-2 text-[10px] leading-relaxed text-ink-faint">
            <FileText className="mt-0.5 size-3.5 shrink-0" />
            Tendik dapat memeriksa kelengkapan dokumen. Keputusan setujui atau tolak
            tetap dilakukan oleh Kaprodi melalui halaman Verifikasi Skripsi.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
