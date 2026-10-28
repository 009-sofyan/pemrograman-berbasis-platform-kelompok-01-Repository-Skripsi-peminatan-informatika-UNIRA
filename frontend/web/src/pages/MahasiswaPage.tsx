import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  GraduationCap,
  Pencil,
  RefreshCw,
  Search,
  Sprout,
  Trash2,
  UserPlus,
  Users,
  BrainCircuit,
  UserRoundX,
  Layers3,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { mahasiswaService } from "../services/mahasiswaService";
import { BI, SA } from "../constants";
import type { Mahasiswa } from "../types";
import { getApiErrorMessage } from "../lib/errors";
import { formatNumber, getAngkatan } from "../lib/format";
import { cn } from "../lib/cn";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Pagination } from "../components/ui/Pagination";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { MahasiswaFormModal } from "../components/mahasiswa/MahasiswaFormModal";

const PAGE_SIZE = 10;
const NO_PEMINATAN = "belum";

type PeminatanFilter = "" | typeof BI | typeof SA | typeof NO_PEMINATAN | "lainnya";

export default function MahasiswaPage() {
  useDocumentTitle("Data Mahasiswa");
  const { user } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [peminatanFilter, setPeminatanFilter] = useState<PeminatanFilter>("");
  const [angkatanFilter, setAngkatanFilter] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<Mahasiswa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mahasiswa | null>(null);
  const [deleting, setDeleting] = useState(false);

  const query = useApiQuery(() => mahasiswaService.list(), []);

  const mahasiswa = query.data?.data ?? [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, peminatanFilter, angkatanFilter]);

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

  const angkatanOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of mahasiswa) {
      const angkatan = getAngkatan(item.nim);
      if (angkatan !== "—") values.add(angkatan);
    }
    return Array.from(values).sort((a, b) => Number(b) - Number(a));
  }, [mahasiswa]);

  const filtered = useMemo(() => {
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
        item.peminatan === peminatanFilter;

      const matchAngkatan =
        !angkatanFilter || getAngkatan(item.nim) === angkatanFilter;

      return matchSearch && matchPeminatan && matchAngkatan;
    });
  }, [mahasiswa, debouncedSearch, peminatanFilter, angkatanFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageData = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasFilters = Boolean(
    debouncedSearch || peminatanFilter || angkatanFilter,
  );

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
    } catch (err) {
      toast.error("Gagal menghapus", getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setPeminatanFilter("");
    setAngkatanFilter("");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Manajemen akademik"
        title="Data Mahasiswa"
        description="Kelola data akademik mahasiswa Peminatan Informatika. Akun harus terdaftar lebih dulu sebelum NIM dan program studi ditambahkan."
        icon={<Users className="size-3" />}
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
            <Button icon={<UserPlus />} onClick={openCreate}>
              Tambah mahasiswa
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total mahasiswa"
          value={stats.total}
          caption="Terdaftar di sistem"
          icon={<GraduationCap className="size-5" />}
          tone="indigo"
          loading={query.loading}
        />
        <SummaryCard
          label="Business Intelligence"
          value={stats.bi}
          caption={
            stats.total > 0
              ? `${Math.round((stats.bi / stats.total) * 100)}% dari mahasiswa`
              : "Belum ada pemetaan"
          }
          icon={<BrainCircuit className="size-5" />}
          tone="sky"
          loading={query.loading}
        />
        <SummaryCard
          label="Smart Agriculture"
          value={stats.sa}
          caption={
            stats.total > 0
              ? `${Math.round((stats.sa / stats.total) * 100)}% dari mahasiswa`
              : "Belum ada pemetaan"
          }
          icon={<Sprout className="size-5" />}
          tone="mint"
          loading={query.loading}
        />
        <SummaryCard
          label="Belum memilih"
          value={stats.kosong + stats.lain}
          caption="Perlu diarahkan ke peminatan"
          icon={<UserRoundX className="size-5" />}
          tone="amber"
          loading={query.loading}
        />
      </section>

      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary-50 text-primary-600">
                <Layers3 className="size-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Direktori mahasiswa</p>
                <p className="text-[11px] text-ink-soft">
                  {formatNumber(filtered.length)} dari {formatNumber(mahasiswa.length)}{" "}
                  mahasiswa tampil
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Cari nama, NIM, atau email…"
                icon={Search}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                wrapperClassName="sm:w-64"
              />
              <select
                value={peminatanFilter}
                onChange={(event) =>
                  setPeminatanFilter(event.target.value as PeminatanFilter)
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
              >
                <option value="">Semua peminatan</option>
                <option value={BI}>Business Intelligence</option>
                <option value={SA}>Smart Agriculture</option>
                <option value={NO_PEMINATAN}>Belum memilih</option>
                <option value="lainnya">Peminatan lain</option>
              </select>
              <select
                value={angkatanFilter}
                onChange={(event) => setAngkatanFilter(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100"
              >
                <option value="">Semua angkatan</option>
                {angkatanOptions.map((angkatan) => (
                  <option key={angkatan} value={angkatan}>
                    Angkatan {angkatan}
                  </option>
                ))}
              </select>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {query.loading ? (
            <TableSkeleton rows={6} />
          ) : query.error ? (
            <EmptyState
              icon={<AlertTriangle className="size-5" />}
              title="Gagal memuat data mahasiswa"
              description={query.error}
              action={
                <Button variant="secondary" onClick={query.refetch}>
                  Coba lagi
                </Button>
              }
            />
          ) : pageData.length === 0 ? (
            <EmptyState
              icon={hasFilters ? <Search className="size-5" /> : <Users className="size-5" />}
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
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="table-head">
                      <th className="px-4 py-2.5 font-bold">Mahasiswa</th>
                      <th className="px-3 py-2.5 font-bold">NIM</th>
                      <th className="px-3 py-2.5 font-bold">Program studi</th>
                      <th className="px-3 py-2.5 font-bold">Angkatan</th>
                      <th className="px-3 py-2.5 font-bold">Peminatan</th>
                      <th className="px-4 py-2.5 text-right font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((item) => (
                      <tr key={item.id} className="table-row">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={item.nama} size="md" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-ink">
                                {item.nama}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                {item.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="font-mono text-xs font-semibold text-slate-600">
                            {item.nim}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-slate-600">
                          {item.programStudi}
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge tone="slate" size="xs">
                            <CalendarDays className="size-3" />
                            {getAngkatan(item.nim)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5">
                          <PeminatanBadge value={item.peminatan} size="xs" short />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <ActionButton
                              label="Edit data mahasiswa"
                              icon={<Pencil className="size-3.5" />}
                              onClick={() => openEdit(item)}
                            />
                            <ActionButton
                              label="Hapus data mahasiswa"
                              tone="danger"
                              icon={<Trash2 className="size-3.5" />}
                              onClick={() => setDeleteTarget(item)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                {pageData.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={item.nama} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-ink">
                          {item.nama}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {item.email}
                        </p>
                      </div>
                      <PeminatanBadge value={item.peminatan} size="xs" short />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-3 text-[11px]">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          NIM
                        </p>
                        <p className="mt-0.5 font-mono font-semibold text-slate-600">
                          {item.nim}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Angkatan
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-600">
                          {getAngkatan(item.nim)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Program studi
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-600">
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
                ))}
              </div>

              <Pagination
                total={filtered.length}
                page={currentPage}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="mahasiswa"
                className="mt-5"
              />
            </>
          )}
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3.5">
        <Download className="mt-0.5 size-4 shrink-0 text-sky-600" />
        <p className="text-[11px] leading-relaxed text-sky-800/80">
          <span className="font-bold text-sky-900">Tips:</span> pencarian memakai
          NIM, nama, email, atau program studi. Angkatan dihitung otomatis dari dua
          digit pertama NIM (contoh 24520017 → 2024).
        </p>
      </div>

      <MahasiswaFormModal
        open={formOpen}
        mode={formMode}
        target={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={query.refetch}
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
          <div className="flex items-start gap-2 rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-3 text-[11px] leading-relaxed text-coral-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Tindakan ini menghapus <strong>data akademik, akun login, dan seluruh
              skripsi</strong> mahasiswa tersebut secara permanen. Riwayat tidak dapat
              dikembalikan.
            </span>
          </div>
          <p className="text-xs leading-relaxed text-ink-soft">
            Gunakan opsi edit jika hanya ingin memperbarui NIM, program studi, atau
            peminatan.
          </p>
        </div>
      </ConfirmDialog>
    </div>
  );
}

function SummaryCard({
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
  tone: "indigo" | "sky" | "mint" | "amber";
  loading: boolean;
}) {
  const tones = {
    indigo: "bg-primary-50 text-primary-600 ring-primary-100",
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
    mint: "bg-mint-50 text-mint-600 ring-mint-100",
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
          {tone === "indigo" ? "Total" : tone === "sky" ? "BI" : tone === "mint" ? "SA" : "—"}
        </span>
      </div>
      <p className="mt-4 text-[11px] font-semibold text-ink-soft">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
          {formatNumber(value)}
        </p>
      )}
      <p className="mt-1 text-[10px] text-ink-faint">{caption}</p>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  tone = "slate",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: "slate" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "grid size-8 place-items-center rounded-lg border border-transparent transition",
        tone === "danger"
          ? "text-slate-400 hover:border-coral-200 hover:bg-coral-50 hover:text-coral-600"
          : "text-slate-500 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600",
      )}
    >
      {icon}
    </button>
  );
}
