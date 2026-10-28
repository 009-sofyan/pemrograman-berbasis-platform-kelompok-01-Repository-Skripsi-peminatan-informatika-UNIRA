import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Hash,
  Library,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApiQuery } from "../hooks/useApiQuery";
import { skripsiService } from "../services/skripsiService";
import { ROLE_META, STATUS_META } from "../constants";
import { cn } from "../lib/cn";
import { formatDate, formatDateTime, truncate } from "../lib/format";
import { resolveFileUrl } from "../lib/files";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";

export default function SkripsiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const numericId = Number(id);
  const validId = Number.isInteger(numericId) && numericId > 0;
  const [copied, setCopied] = useState(false);

  const query = useApiQuery(
    () => skripsiService.getById(numericId),
    [numericId],
    { enabled: validId },
  );

  const skripsi = query.data?.data;
  useDocumentTitle(skripsi ? truncate(skripsi.judul, 50) : "Detail Skripsi");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Tautan disalin", "Bagikan tautan detail skripsi ini.");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Gagal menyalin", "Browser menolak akses clipboard.");
    }
  };

  if (!validId) {
    return (
      <div className="space-y-5">
        <BackLink />
        <Card>
          <EmptyState
            icon={<XCircle className="size-5" />}
            title="ID skripsi tidak valid"
            description="Tautan yang kamu buka tidak memiliki ID skripsi yang benar."
            action={
              <Link to="/repository">
                <Button variant="secondary" icon={<ArrowLeft />}>
                  Kembali ke repository
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  if (query.loading) {
    return (
      <div className="space-y-5">
        <BackLink />
        <Card>
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="mt-3 h-4 w-1/3" />
          <div className="mt-6 flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </Card>
        <div className="grid gap-4 lg:grid-cols-[1.6fr_0.4fr]">
          <Card>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-11/12" />
            <Skeleton className="mt-2 h-4 w-4/5" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </Card>
          <Card>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-4 h-24 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (query.error || !skripsi) {
    return (
      <div className="space-y-5">
        <BackLink />
        <Card>
          <EmptyState
            icon={<FileText className="size-5" />}
            title="Skripsi tidak ditemukan"
            description={
              query.error ??
              "Data skripsi mungkin sudah dihapus atau belum pernah tersedia."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="secondary" icon={<ArrowLeft />} onClick={() => history.back()}>
                  Kembali
                </Button>
                <Link to="/repository">
                  <Button icon={<Library />}>Buka repository</Button>
                </Link>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  const fileUrl = resolveFileUrl(skripsi.fileUrl);
  const meta = STATUS_META[skripsi.status];
  const submitted = ["diajukan", "disetujui", "ditolak"].includes(skripsi.status);
  const decided = ["disetujui", "ditolak"].includes(skripsi.status);
  const decisionApproved = skripsi.status === "disetujui";

  return (
    <div className="space-y-5">
      <BackLink />

      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 surface-gradient" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={skripsi.status} size="sm" />
            <PeminatanBadge value={skripsi.peminatan} size="sm" />
            <Badge tone="slate" size="sm">
              <CalendarDays className="size-3" />
              {skripsi.tahun}
            </Badge>
            <Badge tone="indigo" size="sm">
              <Hash className="size-3" />
              Skripsi #{skripsi.id}
            </Badge>
          </div>
          <h1 className="mt-4 max-w-4xl text-xl font-extrabold leading-snug tracking-tight text-ink sm:text-[26px]">
            {skripsi.judul}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="size-4 text-primary-500" />
              NIM <span className="font-bold text-ink">{skripsi.nim}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4 text-primary-500" />
              {skripsi.programStudi}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-4 text-primary-500" />
              Ditambahkan {formatDate(skripsi.createdAt)}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {fileUrl ? (
              <>
                <a href={fileUrl} target="_blank" rel="noreferrer" download>
                  <Button icon={<Download />}>Unduh berkas PDF</Button>
                </a>
                <a href={fileUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" icon={<ExternalLink />}>
                    Buka di tab baru
                  </Button>
                </a>
              </>
            ) : (
              <Button variant="secondary" icon={<FileText />} disabled>
                Berkas PDF belum tersedia
              </Button>
            )}
            <Button
              variant="ghost"
              icon={copied ? <Check /> : <Copy />}
              onClick={copyLink}
            >
              {copied ? "Tersalin" : "Salin tautan"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_0.4fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Abstrak"
              description="Ringkasan penelitian yang tercatat di repository."
              icon={<BookOpen className="size-5" />}
            />
            {skripsi.abstrak ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                {skripsi.abstrak}
              </p>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                <p className="text-xs font-semibold text-slate-500">
                  Abstrak belum diisi oleh mahasiswa.
                </p>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Informasi Skripsi"
              description="Metadata yang tersimpan pada database repository."
              icon={<FileText className="size-5" />}
            />
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoRow label="ID Skripsi" value={`#${skripsi.id}`} icon={<Hash />} />
              <InfoRow label="Tahun" value={String(skripsi.tahun)} icon={<CalendarDays />} />
              <InfoRow
                label="Program Studi"
                value={skripsi.programStudi}
                icon={<GraduationCap />}
              />
              <InfoRow label="NIM" value={skripsi.nim} icon={<GraduationCap />} />
              <InfoRow
                label="ID Mahasiswa"
                value={String(skripsi.mahasiswaId)}
                icon={<Hash />}
              />
              <InfoRow
                label="Terakhir diperbarui"
                value={formatDateTime(skripsi.createdAt)}
                icon={<Clock3 />}
              />
              <InfoRow
                label="Peminatan"
                value={
                  skripsi.peminatan ? (
                    <PeminatanBadge value={skripsi.peminatan} size="xs" />
                  ) : (
                    "Belum memilih"
                  )
                }
                icon={<Library />}
              />
              <InfoRow
                label="Status"
                value={<StatusBadge status={skripsi.status} size="xs" />}
                icon={<ShieldCheck />}
              />
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Berkas Skripsi"
              description="Dokumen PDF yang diunggah mahasiswa."
              icon={<FileText className="size-5" />}
            />
            {fileUrl ? (
              <div className="mt-4 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-white text-coral-500 shadow-sm ring-1 ring-slate-200">
                    <FileText className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink">Berkas PDF</p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {skripsi.fileUrl}
                    </p>
                  </div>
                </div>
                <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-3 block">
                  <Button size="sm" className="w-full" icon={<Download />}>
                    Unduh dokumen
                  </Button>
                </a>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  compact
                  icon={<FileText className="size-5" />}
                  title="Belum ada berkas"
                  description="Mahasiswa belum mengunggah PDF untuk skripsi ini."
                />
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Alur Verifikasi"
              description="Posisi skripsi pada proses persetujuan."
              icon={<ShieldCheck className="size-5" />}
            />
            <div className="mt-5">
              <TimelineStep
                title="Draft dibuat"
                description={formatDateTime(skripsi.createdAt)}
                state="done"
              />
              <TimelineStep
                title="Diajukan"
                description={
                  submitted
                    ? "Menunggu atau sudah diproses Kaprodi"
                    : "Belum diajukan oleh mahasiswa"
                }
                state={submitted ? "done" : "pending"}
              />
              <TimelineStep
                title="Keputusan Kaprodi"
                description={
                  decided
                    ? decisionApproved
                      ? "Skripsi disetujui"
                      : "Skripsi ditolak"
                    : skripsi.status === "diajukan"
                      ? "Sedang menunggu verifikasi"
                      : "Menunggu pengajuan"
                }
                state={
                  decided
                    ? decisionApproved
                      ? "done"
                      : "rejected"
                    : skripsi.status === "diajukan"
                      ? "current"
                      : "pending"
                }
                last
              />
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Status saat ini
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-xs font-bold text-ink">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.label}
                <span className="font-medium text-slate-400">— {meta.description}</span>
              </p>
            </div>
          </Card>

          {user ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-[11px] leading-relaxed text-ink-soft shadow-soft">
              Kamu masuk sebagai{" "}
              <span className="font-bold text-ink">{ROLE_META[user.role].label}</span>.
              {user.role === "mahasiswa"
                ? " Unduh PDF untuk dijadikan referensi, dan gunakan halaman Pengajuan untuk mengelola skripsimu sendiri."
                : user.role === "kaprodi"
                  ? " Pengajuan baru dapat diproses melalui halaman Verifikasi Skripsi."
                  : " Data mahasiswa dan peminatan dapat dikelola melalui halaman Data Mahasiswa."}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/repository"
      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-primary-600"
    >
      <ArrowLeft className="size-3.5" />
      Kembali ke repository
    </Link>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 [&>svg]:size-3">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-xs font-semibold text-ink">{value}</dd>
    </div>
  );
}

function TimelineStep({
  title,
  description,
  state,
  last = false,
}: {
  title: string;
  description: string;
  state: "done" | "current" | "pending" | "rejected";
  last?: boolean;
}) {
  const icon =
    state === "done" ? (
      <CheckCircle2 className="size-4" />
    ) : state === "rejected" ? (
      <XCircle className="size-4" />
    ) : state === "current" ? (
      <Clock3 className="size-4" />
    ) : (
      <Circle className="size-3" />
    );

  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      {!last ? (
        <span
          className={cn(
            "absolute left-[13px] top-6 h-[calc(100%-18px)] w-px",
            state === "done" ? "bg-mint-200" : "bg-slate-200",
          )}
        />
      ) : null}
      <span
        className={cn(
          "relative z-10 grid size-7 shrink-0 place-items-center rounded-full ring-4 ring-white",
          state === "done"
            ? "bg-mint-100 text-mint-600"
            : state === "rejected"
              ? "bg-coral-100 text-coral-600"
              : state === "current"
                ? "bg-amber-100 text-amber-600"
                : "bg-slate-100 text-slate-400",
        )}
      >
        {icon}
      </span>
      <div className="pt-0.5">
        <p className="text-xs font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-ink-soft">{description}</p>
      </div>
    </div>
  );
}
