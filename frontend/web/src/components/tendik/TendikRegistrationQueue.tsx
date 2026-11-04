import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import type { AccountStatus, RegistrationItem } from "../../types";
import type { Tone } from "../../constants";
import { PROGRAM_STUDI_DEFAULT } from "../../constants";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useToast } from "../../contexts/ToastContext";
import { getApiErrorMessage } from "../../lib/errors";
import { formatDate } from "../../lib/format";
import { cn } from "../../lib/cn";
import { tendikService } from "../../services/tendikService";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Input, Textarea } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Pagination } from "../ui/Pagination";
import { SelectMenu } from "../ui/SelectMenu";
import { TableSkeleton } from "../ui/Skeleton";

const PAGE_SIZE = 8;

const STATUS_META: Record<
  AccountStatus,
  { label: string; tone: Tone; description: string }
> = {
  ACTIVE: {
    label: "Aktif",
    tone: "sa",
    description: "Sudah diverifikasi dan dapat masuk",
  },
  PENDING_VERIFICATION: {
    label: "Menunggu",
    tone: "amber",
    description: "Menunggu verifikasi Tendik",
  },
  REJECTED: {
    label: "Ditolak",
    tone: "rose",
    description: "Pendaftaran tidak disetujui",
  },
};

const STATUS_OPTIONS = [
  { value: "PENDING_VERIFICATION", label: "Menunggu verifikasi" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "", label: "Semua status" },
];

const BASE_PRODI = [
  "Informatika",
  "Teknik Informatika",
  "Sistem Informasi",
  "Teknik Komputer",
  "Teknik Industri",
  "Teknik Sipil",
];

function prodiOptions(claim: string | null) {
  const values = claim && !BASE_PRODI.includes(claim)
    ? [claim, ...BASE_PRODI]
    : BASE_PRODI;

  return values.map((value) => ({ value, label: value }));
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} size="xs" dot title={meta.description}>
      {meta.label}
    </Badge>
  );
}

export function TendikRegistrationQueue() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<AccountStatus | "">(
    "PENDING_VERIFICATION",
  );
  const [page, setPage] = useState(1);
  const [approveTarget, setApproveTarget] = useState<RegistrationItem | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<RegistrationItem | null>(
    null,
  );
  const [removingId, setRemovingId] = useState<number | null>(null);

  const query = useApiQuery(
    () =>
      tendikService.listRegistrations({
        status: status || undefined,
        q: debouncedSearch.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    [status, debouncedSearch, page],
  );

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  const items = query.data?.data ?? [];
  const counts = query.data?.counts ?? {
    ACTIVE: 0,
    PENDING_VERIFICATION: 0,
    REJECTED: 0,
  };
  const total = query.data?.total ?? 0;
  const pendingCount = counts.PENDING_VERIFICATION;

  const resetFilters = () => {
    setSearch("");
    setStatus("PENDING_VERIFICATION");
  };

  const hasFilters =
    search.trim().length > 0 || status !== "PENDING_VERIFICATION";

  const removeRow = (id: number) => {
    setRemovingId(id);
    window.setTimeout(() => {
      setRemovingId(null);
      setPage((current) => {
        if (items.length === 1 && current > 1) return current - 1;
        return current;
      });
      query.refetch();
    }, 280);
  };

  const handleApproved = (item: RegistrationItem) => {
    toast.success(
      "Pendaftaran disetujui",
      `${item.nama} sekarang dapat masuk dan mengajukan skripsi.`,
    );
    setApproveTarget(null);
    removeRow(item.id);
  };

  const handleRejected = (item: RegistrationItem) => {
    toast.success(
      "Pendaftaran ditolak",
      `Akun ${item.email} tidak diaktifkan. Alasan penolakan tersimpan.`,
    );
    setRejectTarget(null);
    removeRow(item.id);
  };

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="relative overflow-hidden rounded-t-panel bg-navy-950 px-4 py-6 text-white sm:px-6 md:px-8 md:py-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.16),transparent_38%),radial-gradient(circle_at_88%_100%,rgba(139,92,246,0.2),transparent_42%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 surface-grid opacity-[0.07]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300">
              <span className="size-1.5 rounded-full bg-gold-400" />
              Verifikasi akun
            </p>
            <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              Antrean Registrasi Mahasiswa
            </h2>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60 sm:text-sm">
              Periksa akun baru, lalu setujui dengan NIM dan program studi yang
              benar atau tolak dengan alasan yang jelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber" size="sm" dot>
              {pendingCount} menunggu
            </Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold text-white/60">
              <ClipboardCheck className="size-3.5" aria-hidden="true" />
              Total {items.length === 0 && total === 0 ? "0" : total} pada filter
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-white/[0.02] px-4 pt-5 sm:px-6 md:px-8 md:pt-6">
        <div className="flex flex-col gap-2.5 pb-4 sm:flex-row sm:items-end">
          <Input
            label="Cari pendaftar"
            placeholder="Nama, email, atau NIM"
            icon={Search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            wrapperClassName="min-w-0 flex-1"
            className="text-[13px] sm:text-sm"
            rightElement={
              search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="grid size-8 place-items-center rounded-lg text-ink-faint transition hover:bg-white/[0.08] hover:text-ink"
                  aria-label="Hapus pencarian"
                >
                  <X className="size-3.5" />
                </button>
              ) : null
            }
          />
          <div className="flex items-end gap-2">
            <SelectMenu
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(value) => setStatus(value as AccountStatus | "")}
              className="min-w-[170px]"
              align="right"
            />
            <Button
              variant="secondary"
              icon={<RotateCcw />}
              onClick={resetFilters}
              disabled={!hasFilters && page === 1}
              className="shrink-0"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {query.error ? (
        <div className="p-6 md:p-8">
          <EmptyState
            compact
            icon={<UserRound className="size-5" />}
            title="Gagal memuat pendaftaran"
            description={query.error}
            action={
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw />}
                onClick={query.refetch}
              >
                Coba lagi
              </Button>
            }
          />
        </div>
      ) : query.loading ? (
        <div className="p-6 md:p-8">
          <TableSkeleton rows={4} />
        </div>
      ) : items.length === 0 ? (
        <div className="p-6 md:p-8">
          <EmptyState
            compact
            icon={<Inbox className="size-5" />}
            title={
              hasFilters
                ? "Tidak ada pendaftaran yang cocok"
                : "Antrean registrasi kosong"
            }
            description={
              hasFilters
                ? "Coba ubah kata kunci atau status untuk melihat pendaftaran lain."
                : "Semua pendaftaran mahasiswa sudah diproses. Antrean baru akan muncul di sini."
            }
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw />}
                  onClick={resetFilters}
                >
                  Reset filter
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="table-head">
                  <th className="px-6 py-2.5 font-bold">Nama</th>
                  <th className="px-3 py-2.5 font-bold">Email</th>
                  <th className="px-3 py-2.5 font-bold">NIM / Prodi Klaim</th>
                  <th className="px-3 py-2.5 font-bold">Tanggal Daftar</th>
                  <th className="px-3 py-2.5 font-bold">Status</th>
                  <th className="px-3 py-2.5 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "table-row",
                      removingId === item.id &&
                        "translate-y-1 opacity-0 transition-all duration-300",
                    )}
                  >
                    <td className="px-6 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={item.nama} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-ink">
                            {item.nama}
                          </p>
                          <p className="mt-0.5 text-[10px] text-ink-faint">
                            Akun #{item.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-[210px] truncate text-[11px] font-semibold text-ink-soft">
                        {item.email}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[11px] font-bold text-ink">
                        {item.nimClaim ?? "—"}
                      </p>
                      <p className="mt-0.5 max-w-[160px] truncate text-[10px] text-ink-faint">
                        {item.programStudiClaim ?? "Belum diisi"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[11px] font-semibold text-ink-soft">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={item.status} />
                      {item.status === "REJECTED" && item.rejectReason ? (
                        <p
                          className="mt-1 max-w-[150px] truncate text-[9px] text-rose-300/80"
                          title={item.rejectReason}
                        >
                          {item.rejectReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {item.status === "PENDING_VERIFICATION" ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="mint"
                            size="sm"
                            icon={<CheckCircle2 />}
                            onClick={() => setApproveTarget(item)}
                            aria-label={`Setujui pendaftaran ${item.nama}`}
                          >
                            Setujui
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<XCircle />}
                            onClick={() => setRejectTarget(item)}
                            className="text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
                            aria-label={`Tolak pendaftaran ${item.nama}`}
                          >
                            Tolak
                          </Button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 pr-2 text-[10px] font-semibold text-ink-faint">
                          <ShieldCheck className="size-3.5" aria-hidden="true" />
                          Sudah diproses
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-6 md:p-8 lg:hidden">
            {items.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "rounded-card border border-white/10 bg-white/[0.03] p-5 transition-all duration-300",
                  removingId === item.id &&
                    "translate-y-1 opacity-0",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={item.nama} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink">{item.nama}</p>
                      <p className="mt-0.5 truncate text-[10px] text-ink-faint">
                        {item.email}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 rounded-input border border-white/10 bg-white/[0.03] p-2.5 text-[10px]">
                  <div>
                    <dt className="font-bold uppercase tracking-[0.12em] text-ink-faint">
                      NIM Klaim
                    </dt>
                    <dd className="mt-0.5 font-semibold text-ink">
                      {item.nimClaim ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-[0.12em] text-ink-faint">
                      Prodi Klaim
                    </dt>
                    <dd className="mt-0.5 truncate font-semibold text-ink">
                      {item.programStudiClaim ?? "Belum diisi"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-[0.12em] text-ink-faint">
                      Tanggal Daftar
                    </dt>
                    <dd className="mt-0.5 font-semibold text-ink">
                      {formatDate(item.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase tracking-[0.12em] text-ink-faint">
                      Akun
                    </dt>
                    <dd className="mt-0.5 font-semibold text-ink">#{item.id}</dd>
                  </div>
                </dl>

                {item.status === "REJECTED" && item.rejectReason ? (
                  <p className="mt-2 rounded-input border border-rose-400/20 bg-rose-400/[0.06] px-2.5 py-2 text-[10px] leading-relaxed text-rose-200">
                    Alasan: {item.rejectReason}
                  </p>
                ) : null}

                {item.status === "PENDING_VERIFICATION" ? (
                  <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
                    <Button
                      variant="mint"
                      size="sm"
                      icon={<CheckCircle2 />}
                      onClick={() => setApproveTarget(item)}
                      className="flex-1"
                    >
                      Setujui
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<XCircle />}
                      onClick={() => setRejectTarget(item)}
                      className="flex-1 text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
                    >
                      Tolak
                    </Button>
                  </div>
                ) : (
                  <p className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3 text-[10px] font-semibold text-ink-faint">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    Pendaftaran sudah diproses
                  </p>
                )}
              </article>
            ))}
          </div>

          <div className="px-4 pb-4 sm:px-5">
            <Pagination
              total={total}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="pendaftar"
            />
          </div>
        </>
      )}

      <ApproveRegistrationModal
        target={approveTarget}
        onClose={() => setApproveTarget(null)}
        onApproved={handleApproved}
      />
      <RejectRegistrationModal
        target={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onRejected={handleRejected}
      />
    </Card>
  );
}

function ApproveRegistrationModal({
  target,
  onClose,
  onApproved,
}: {
  target: RegistrationItem | null;
  onClose: () => void;
  onApproved: (item: RegistrationItem) => void;
}) {
  const toast = useToast();
  const [nim, setNim] = useState("");
  const [programStudi, setProgramStudi] = useState(PROGRAM_STUDI_DEFAULT);
  const [errors, setErrors] = useState<{ nim?: string; programStudi?: string }>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setNim(target.nimClaim ?? "");
    setProgramStudi(target.programStudiClaim || PROGRAM_STUDI_DEFAULT);
    setErrors({});
    setError(null);
  }, [target]);

  const submit = async () => {
    if (!target || saving) return;

    const nextErrors: { nim?: string; programStudi?: string } = {};
    if (!nim.trim()) {
      nextErrors.nim = "NIM wajib diisi.";
    } else if (!/^\d{5,20}$/.test(nim.trim())) {
      nextErrors.nim = "NIM harus terdiri dari 5–20 digit angka.";
    }
    if (!programStudi.trim()) {
      nextErrors.programStudi = "Program studi wajib dipilih.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError(null);
    try {
      await tendikService.approveRegistration(target.id, {
        nim: nim.trim(),
        programStudi: programStudi.trim(),
      });
      onApproved(target);
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Pendaftaran gagal disetujui. Silakan coba lagi.",
      );
      setError(message);
      toast.error("Gagal menyetujui", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={saving ? () => undefined : onClose}
      title="Setujui pendaftaran mahasiswa"
      description="Lengkapi data akademik sebelum akun diaktifkan."
      icon={<CheckCircle2 className="size-5" />}
      size="md"
      closeOnBackdrop={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            variant="mint"
            onClick={() => void submit()}
            loading={saving}
            icon={<CheckCircle2 />}
          >
            Setujui pendaftaran
          </Button>
        </>
      }
    >
      {target ? (
        <div className="space-y-4">
          {error ? (
            <div className="rounded-input border border-rose-400/25 bg-rose-400/[0.08] px-3.5 py-2.5 text-xs text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex items-center gap-3 rounded-input border border-white/10 bg-white/[0.04] p-3.5">
            <Avatar name={target.nama} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{target.nama}</p>
              <p className="mt-0.5 truncate text-xs text-ink-soft">
                {target.email}
              </p>
            </div>
          </div>

          <div className="rounded-input border border-amber-300/20 bg-amber-400/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-amber-100">
            Data di bawah akan menjadi NIM dan program studi resmi mahasiswa.
            Pastikan sudah sesuai dengan data akademik.
          </div>

          <Input
            label="NIM"
            placeholder="Contoh: 24520017"
            value={nim}
            onChange={(event) => {
              setNim(event.target.value);
              setErrors((current) => ({ ...current, nim: undefined }));
              setError(null);
            }}
            error={errors.nim}
            maxLength={20}
            inputMode="numeric"
            autoComplete="off"
            required
          />

          <div>
            <p className="mb-1.5 text-xs font-bold text-slate-200">
              Program studi <span className="text-coral-500">*</span>
            </p>
            <SelectMenu
              value={programStudi}
              options={prodiOptions(target.programStudiClaim)}
              onChange={(value) => {
                setProgramStudi(value);
                setErrors((current) => ({
                  ...current,
                  programStudi: undefined,
                }));
                setError(null);
              }}
              placeholder="Pilih program studi"
              className="w-full"
            />
            {errors.programStudi ? (
              <p className="mt-1 text-xs font-medium text-coral-600" role="alert">
                {errors.programStudi}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function RejectRegistrationModal({
  target,
  onClose,
  onRejected,
}: {
  target: RegistrationItem | null;
  onClose: () => void;
  onRejected: (item: RegistrationItem) => void;
}) {
  const toast = useToast();
  const [alasan, setAlasan] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setAlasan("");
    setError(undefined);
  }, [target]);

  const submit = async () => {
    if (!target || saving) return;

    if (alasan.trim().length < 3) {
      setError("Alasan penolakan wajib diisi minimal 3 karakter.");
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      await tendikService.rejectRegistration(target.id, {
        alasan: alasan.trim(),
      });
      onRejected(target);
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Pendaftaran gagal ditolak. Silakan coba lagi.",
      );
      setError(message);
      toast.error("Gagal menolak", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={saving ? () => undefined : onClose}
      title="Tolak pendaftaran mahasiswa"
      description={
        target
          ? `Akun ${target.nama} tidak akan diaktifkan.`
          : "Pendaftaran tidak akan diaktifkan."
      }
      icon={<XCircle className="size-5" />}
      size="sm"
      closeOnBackdrop={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={() => void submit()}
            loading={saving}
            icon={<XCircle />}
          >
            Tolak pendaftaran
          </Button>
        </>
      }
    >
      {target ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-input border border-white/10 bg-white/[0.04] p-3.5">
            <Avatar name={target.nama} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{target.nama}</p>
              <p className="mt-0.5 truncate text-xs text-ink-soft">
                {target.email}
              </p>
            </div>
          </div>

          <Textarea
            label="Alasan penolakan"
            placeholder="Jelaskan alasan agar mahasiswa dapat memperbaiki pendaftarannya…"
            value={alasan}
            onChange={(event) => {
              setAlasan(event.target.value);
              setError(undefined);
            }}
            error={error}
            maxLength={500}
            rows={4}
            required
            hint={`${alasan.trim().length}/500 karakter`}
          />
        </div>
      ) : null}
    </Modal>
  );
}
