import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Eye,
  FilePlus2,
  Filter,
  Library,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useApiQuery } from "../hooks/useApiQuery";
import { skripsiService } from "../services/skripsiService";
import {
  BI,
  CURRENT_YEAR,
  SA,
  STATUS_META,
  STATUS_ORDER,
} from "../constants";
import type { Skripsi, SkripsiStatus } from "../types";
import { formatDate, formatNumber, truncate } from "../lib/format";
import { cn } from "../lib/cn";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { SkripsiPdfButton } from "../components/skripsi/SkripsiPdfButton";

const PAGE_SIZE = 8;

type PeminatanFilter = "" | typeof BI | typeof SA | "__none__" | "__other__";

function matchesPeminatan(item: Skripsi, filter: PeminatanFilter) {
  if (!filter) return true;
  if (filter === "__none__") return !item.peminatan;
  if (filter === "__other__") {
    return Boolean(item.peminatan) && item.peminatan !== BI && item.peminatan !== SA;
  }
  return item.peminatan === filter;
}

export default function RepositoryPage() {
  useDocumentTitle("Repository Skripsi");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const [tahun, setTahun] = useState("");
  const [peminatan, setPeminatan] = useState<PeminatanFilter>("");
  const [status, setStatus] = useState<SkripsiStatus | "">("");
  const [page, setPage] = useState(1);

  const query = useApiQuery(
    () =>
      skripsiService.list({
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(tahun ? { tahun } : {}),
        ...(peminatan === BI || peminatan === SA ? { peminatan } : {}),
      }),
    [debouncedSearch, tahun, peminatan],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tahun, peminatan, status]);

  const filteredData = useMemo(() => {
    const data = query.data?.data ?? [];
    return data.filter(
      (item) =>
        matchesPeminatan(item, peminatan) &&
        (!status || item.status === status),
    );
  }, [query.data, peminatan, status]);

  const pageCount = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (let year = CURRENT_YEAR; year >= 2018; year -= 1) years.add(year);
    query.data?.data.forEach((item) => {
      if (Number.isInteger(item.tahun)) years.add(item.tahun);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [query.data]);

  const activeFilters =
    (searchInput.trim() ? 1 : 0) +
    (tahun ? 1 : 0) +
    (peminatan ? 1 : 0) +
    (status ? 1 : 0);

  const resetFilters = () => {
    setSearchInput("");
    setTahun("");
    setPeminatan("");
    setStatus("");
  };

  const apiTotal = query.data?.total ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Eksplorasi referensi"
        title="Repository Skripsi"
        description="Telusuri karya ilmiah mahasiswa Informatika UNIRA berdasarkan judul, tahun, peminatan, dan status verifikasi."
        icon={<Library className="size-3" />}
        actions={
          user?.role === "mahasiswa" ? (
            <Button icon={<FilePlus2 />} onClick={() => navigate("/pengajuan")}>
              Ajukan Skripsi
            </Button>
          ) : (
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-ink-soft shadow-sm sm:flex">
              <SlidersHorizontal className="size-3.5 text-primary-500" />
              <span>
                <span className="font-bold text-ink">{formatNumber(apiTotal)}</span>{" "}
                skripsi tercatat
              </span>
            </div>
          )
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <Input
            label="Cari judul"
            placeholder="Cari judul skripsi…"
            icon={Search}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            wrapperClassName="flex-1"
            rightElement={
              searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Hapus pencarian"
                >
                  <X className="size-3.5" />
                </button>
              ) : null
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:w-[520px]">
            <Select
              label="Tahun"
              value={tahun}
              onChange={(event) => setTahun(event.target.value)}
            >
              <option value="">Semua tahun</option>
              {yearOptions.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </Select>
            <Select
              label="Peminatan"
              value={peminatan}
              onChange={(event) =>
                setPeminatan(event.target.value as PeminatanFilter)
              }
            >
              <option value="">Semua peminatan</option>
              <option value={BI}>Business Intelligence</option>
              <option value={SA}>Smart Agriculture</option>
              <option value="__none__">Belum memilih</option>
              <option value="__other__">Lainnya</option>
            </Select>
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as SkripsiStatus | "")}
              wrapperClassName="col-span-2 sm:col-span-1"
            >
              <option value="">Semua status</option>
              {STATUS_ORDER.map((item) => (
                <option key={item} value={item}>
                  {STATUS_META[item].label}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="secondary"
            icon={<RotateCcw />}
            onClick={resetFilters}
            disabled={activeFilters === 0}
            className="shrink-0"
          >
            Reset
          </Button>
        </div>

        {activeFilters > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <Filter className="size-3" />
              Filter aktif
            </span>
            {searchInput.trim() ? (
              <FilterChip
                label={`“${truncate(searchInput.trim(), 26)}”`}
                onRemove={() => setSearchInput("")}
              />
            ) : null}
            {tahun ? (
              <FilterChip label={`Tahun ${tahun}`} onRemove={() => setTahun("")} />
            ) : null}
            {peminatan ? (
              <FilterChip
                label={
                  peminatan === BI
                    ? "Business Intelligence"
                    : peminatan === SA
                      ? "Smart Agriculture"
                      : peminatan === "__none__"
                        ? "Belum memilih"
                        : "Lainnya"
                }
                onRemove={() => setPeminatan("")}
              />
            ) : null}
            {status ? (
              <FilterChip
                label={STATUS_META[status].label}
                onRemove={() => setStatus("")}
              />
            ) : null}
            <button
              type="button"
              onClick={resetFilters}
              className="ml-1 text-[10px] font-bold text-primary-600 hover:underline"
            >
              Bersihkan semua
            </button>
          </div>
        ) : null}
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-soft">
          Menampilkan{" "}
          <span className="font-bold text-ink">{formatNumber(filteredData.length)}</span>{" "}
          hasil
          {apiTotal !== filteredData.length ? (
            <span className="text-slate-400"> dari {formatNumber(apiTotal)} data</span>
          ) : null}
        </p>
        <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/70 sm:flex">
          <CalendarDays className="size-3 text-primary-500" />
          Diurutkan dari yang terbaru
        </span>
      </div>

      {query.error ? (
        <Card>
          <EmptyState
            icon={<RefreshCw className="size-5" />}
            title="Gagal memuat repository"
            description={query.error}
            action={
              <Button variant="secondary" icon={<RefreshCw />} onClick={query.refetch}>
                Coba lagi
              </Button>
            }
          />
        </Card>
      ) : query.loading ? (
        <Card className="p-4 sm:p-5">
          <TableSkeleton rows={6} />
        </Card>
      ) : pageData.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Library className="size-5" />}
            title={activeFilters > 0 ? "Tidak ada skripsi yang cocok" : "Repository masih kosong"}
            description={
              activeFilters > 0
                ? "Coba ubah kata kunci atau bersihkan filter untuk melihat data lain."
                : "Belum ada skripsi yang tercatat. Pengajuan mahasiswa akan tampil di sini setelah dibuat."
            }
            action={
              activeFilters > 0 ? (
                <Button variant="secondary" icon={<RotateCcw />} onClick={resetFilters}>
                  Reset filter
                </Button>
              ) : user?.role === "mahasiswa" ? (
                <Button icon={<FilePlus2 />} onClick={() => navigate("/pengajuan")}>
                  Ajukan skripsi pertama
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <>
          <div className="table-shell hidden lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="table-head">
                  <th className="px-5 py-3 font-bold">Judul Skripsi</th>
                  <th className="px-3 py-3 font-bold">Mahasiswa</th>
                  <th className="px-3 py-3 font-bold">Peminatan</th>
                  <th className="px-3 py-3 font-bold">Tahun</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Berkas</th>
                  <th className="px-5 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="px-5 py-4">
                      <Link
                        to={`/repository/${item.id}`}
                        className="block max-w-md text-[13px] font-bold leading-relaxed text-ink transition hover:text-primary-600"
                      >
                        {truncate(item.judul, 96)}
                      </Link>
                      <p className="mt-1.5 text-[10px] text-slate-400">
                        {item.programStudi} · Ditambahkan{" "}
                        {formatDate(item.createdAt)}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-xs font-semibold text-slate-600">{item.nim}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        ID Mhs. {item.mahasiswaId}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <PeminatanBadge value={item.peminatan} size="xs" short />
                    </td>
                    <td className="px-3 py-4 text-xs font-semibold text-slate-500">
                      {item.tahun}
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={item.status} size="xs" />
                    </td>
                    <td className="px-3 py-4">
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
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/repository/${item.id}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                      >
                        <Eye className="size-3.5" />
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {pageData.map((item) => (
              <Link
                key={item.id}
                to={`/repository/${item.id}`}
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={item.status} size="xs" />
                  <span className="text-[10px] font-semibold text-slate-400">
                    {item.tahun}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-[13px] font-bold leading-relaxed text-ink group-hover:text-primary-600">
                  {item.judul}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <PeminatanBadge value={item.peminatan} size="xs" short />
                    <span className="text-[10px] text-slate-400">NIM {item.nim}</span>
                  </div>
                  <Eye className="size-4 text-slate-300 group-hover:text-primary-500" />
                </div>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 pb-4 pt-4 shadow-soft">
            <Pagination
              total={filteredData.length}
              page={currentPage}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="skripsi"
              className="border-t-0 pt-0"
            />
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 py-1 pl-2.5 pr-1 text-[10px] font-bold text-primary-700 ring-1 ring-inset ring-primary-100">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "grid size-5 place-items-center rounded-full text-primary-400 transition hover:bg-primary-100 hover:text-primary-700",
        )}
        aria-label={`Hapus filter ${label}`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
