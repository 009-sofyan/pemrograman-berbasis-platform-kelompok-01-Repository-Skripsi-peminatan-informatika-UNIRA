import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  FileText,
  Info,
  Library,
  Pencil,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApiQuery } from "../hooks/useApiQuery";
import { skripsiService } from "../services/skripsiService";
import { CURRENT_YEAR } from "../constants";
import type { Skripsi, SkripsiDetailResponse } from "../types";
import { getApiErrorMessage } from "../lib/errors";
import { formatDate, formatNumber, truncate } from "../lib/format";
import { resolveFileUrl } from "../lib/files";
import {
  getTrackedSkripsiIds,
  trackSkripsiId,
  untrackSkripsiId,
} from "../lib/storage";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { TableSkeleton } from "../components/ui/Skeleton";
import { PageHeader } from "../components/ui/PageHeader";
import { cn } from "../lib/cn";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function validatePdf(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) return "Berkas harus berformat PDF.";
  if (file.size > MAX_FILE_SIZE) return "Ukuran berkas maksimal 10 MB.";
  if (file.size === 0) return "Berkas kosong tidak dapat diunggah.";
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type LastCreated = {
  id: number;
  outcome: "submitted" | "draft" | "needs-upload";
  message?: string;
};

export default function PengajuanPage() {
  useDocumentTitle("Pengajuan Skripsi");
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [judul, setJudul] = useState("");
  const [abstrak, setAbstrak] = useState("");
  const [tahun, setTahun] = useState(String(CURRENT_YEAR));
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ judul?: string; tahun?: string; file?: string }>({});
  const [submitNow, setSubmitNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [lastCreated, setLastCreated] = useState<LastCreated | null>(null);

  const [trackedVersion, setTrackedVersion] = useState(0);
  const [trackInput, setTrackInput] = useState("");
  const [tracking, setTracking] = useState(false);
  const [editTarget, setEditTarget] = useState<Skripsi | null>(null);
  const [uploadTarget, setUploadTarget] = useState<Skripsi | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Skripsi | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const trackedQuery = useApiQuery<Skripsi[]>(
    async () => {
      if (!user) return [];
      const ids = getTrackedSkripsiIds(user.id);
      if (ids.length === 0) return [];
      const results = await Promise.allSettled(
        ids.map((id) => skripsiService.getById(id)),
      );
      return results
        .filter(
          (result): result is PromiseFulfilledResult<SkripsiDetailResponse> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value.data)
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA || b.id - a.id;
        });
    },
    [trackedVersion, user?.id],
  );

  const tracked = trackedQuery.data ?? [];
  const yearNumber = Number(tahun);
  const yearValid =
    Number.isInteger(yearNumber) && yearNumber >= 1900 && yearNumber <= CURRENT_YEAR;

  const step = useMemo(() => {
    if (judul.trim().length < 5) return 1;
    if (!file) return 2;
    return 3;
  }, [judul, file]);

  if (!user) return null;

  const handleFile = (nextFile: File | null) => {
    setFileError(null);
    setErrors((current) => ({ ...current, file: undefined }));
    if (!nextFile) {
      setFile(null);
      return;
    }
    const error = validatePdf(nextFile);
    if (error) {
      setFileError(error);
      setFile(null);
      return;
    }
    setFile(nextFile);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const resetForm = () => {
    setJudul("");
    setAbstrak("");
    setTahun(String(CURRENT_YEAR));
    setFile(null);
    setFileError(null);
    setErrors({});
    setSubmitNow(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: { judul?: string; tahun?: string; file?: string } = {};

    if (!judul.trim()) {
      nextErrors.judul = "Judul skripsi wajib diisi.";
    } else if (judul.trim().length < 5) {
      nextErrors.judul = "Judul terlalu pendek, minimal 5 karakter.";
    }

    if (!tahun) {
      nextErrors.tahun = "Tahun wajib diisi.";
    } else if (!yearValid) {
      nextErrors.tahun = `Tahun harus antara 1900 dan ${CURRENT_YEAR}.`;
    }

    if (submitNow && !file) {
      nextErrors.file = "Unggah berkas PDF sebelum mengajukan skripsi.";
    }

    if (fileError) nextErrors.file = fileError;
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setProgress(file ? 0 : null);
    let newId: number | null = null;
    let uploaded = false;
    let submitted = false;

    try {
      const created = await skripsiService.create({
        judul: judul.trim(),
        ...(abstrak.trim() ? { abstrak: abstrak.trim() } : {}),
        tahun: yearNumber,
      });
      newId = created.id;
      trackSkripsiId(user.id, created.id);

      if (file) {
        await skripsiService.uploadFile(created.id, file, setProgress);
        uploaded = true;
      }

      if (submitNow) {
        await skripsiService.submit(created.id);
        submitted = true;
      }

      setTrackedVersion((value) => value + 1);
      setLastCreated({
        id: created.id,
        outcome: submitted ? "submitted" : "draft",
      });
      toast.success(
        submitted ? "Pengajuan berhasil dikirim" : "Draft berhasil disimpan",
        submitted
          ? "Skripsi masuk ke antrean verifikasi Kaprodi."
          : "Kamu dapat melengkapi dan mengajukannya dari daftar di bawah.",
      );
      resetForm();
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (newId) {
        trackSkripsiId(user.id, newId);
        setTrackedVersion((value) => value + 1);
        setLastCreated({
          id: newId,
          outcome: uploaded ? "draft" : "needs-upload",
          message,
        });
        toast.warning(
          uploaded ? "Draft tersimpan" : "Draft tersimpan, berkas belum terunggah",
          message,
        );
        resetForm();
      } else {
        toast.error("Pengajuan gagal", message);
      }
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  const handleTrack = async () => {
    const id = Number(trackInput);
    if (!Number.isInteger(id) || id <= 0) {
      toast.warning("ID tidak valid", "Masukkan angka ID pengajuan yang benar.");
      return;
    }
    setTracking(true);
    try {
      const response = await skripsiService.getById(id);
      trackSkripsiId(user.id, id);
      setTrackedVersion((value) => value + 1);
      setTrackInput("");
      toast.success(
        "Pengajuan ditemukan",
        truncate(response.data.judul, 70),
      );
    } catch (err) {
      toast.error("Gagal melacak pengajuan", getApiErrorMessage(err));
    } finally {
      setTracking(false);
    }
  };

  const handleSubmitTracked = async (item: Skripsi) => {
    if (!item.fileUrl) {
      toast.warning(
        "Berkas belum ada",
        "Unggah berkas PDF terlebih dahulu sebelum mengajukan.",
      );
      setUploadTarget(item);
      return;
    }
    setBusyAction(`${item.id}:submit`);
    try {
      await skripsiService.submit(item.id);
      setTrackedVersion((value) => value + 1);
      toast.success("Skripsi diajukan", "Pengajuan menunggu verifikasi Kaprodi.");
    } catch (err) {
      toast.error("Gagal mengajukan", getApiErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await skripsiService.remove(deleteTarget.id);
      untrackSkripsiId(user.id, deleteTarget.id);
      setTrackedVersion((value) => value + 1);
      toast.success("Draft dihapus", "Data skripsi berhasil dihapus dari repository.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Gagal menghapus", getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const lastCreatedMeta = lastCreated
    ? {
        submitted: {
          icon: CheckCircle2,
          title: "Pengajuan terkirim",
          description: "Skripsi kamu sudah masuk ke antrean verifikasi Kaprodi.",
          className: "border-mint-200 bg-mint-50/80 text-mint-700",
          iconClass: "bg-mint-100 text-mint-600",
        },
        draft: {
          icon: FileText,
          title: "Draft tersimpan",
          description: "Lengkapi berkas dan ajukan dari daftar pengajuan di bawah.",
          className: "border-primary-200 bg-primary-50/80 text-primary-700",
          iconClass: "bg-primary-100 text-primary-600",
        },
        "needs-upload": {
          icon: Info,
          title: "Draft tersimpan, berkas belum terunggah",
          description:
            lastCreated.message ??
            "Buka daftar pengajuan di bawah untuk mengunggah PDF.",
          className: "border-amber-200 bg-amber-50/80 text-amber-700",
          iconClass: "bg-amber-100 text-amber-600",
        },
      }[lastCreated.outcome]
    : null;
  const LastCreatedIcon = lastCreatedMeta?.icon;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ajukan karya ilmiah"
        title="Pengajuan Skripsi"
        description="Isi informasi skripsi, unggah berkas PDF, lalu ajukan untuk diverifikasi Kaprodi. Draft dapat disimpan terlebih dahulu."
        icon={<FilePlus2 className="size-3" />}
        actions={
          <Button
            variant="secondary"
            icon={<Library />}
            onClick={() => navigate("/repository")}
          >
            Lihat repository
          </Button>
        }
      />

      {lastCreated && lastCreatedMeta ? (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
            lastCreatedMeta.className,
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl",
                lastCreatedMeta.iconClass,
              )}
            >
              {LastCreatedIcon ? <LastCreatedIcon className="size-4" /> : null}
            </span>
            <div>
              <p className="text-xs font-bold">
                {lastCreatedMeta.title} · ID #{lastCreated.id}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed opacity-80">
                {lastCreatedMeta.description}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Eye />}
              onClick={() => navigate(`/repository/${lastCreated.id}`)}
            >
              Lihat detail
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLastCreated(null)}
            >
              Tutup
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.45fr]">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <CardHeader
              title="Formulir pengajuan"
              description="Data akan dicatat atas nama akun mahasiswa yang sedang masuk."
              icon={<FilePlus2 className="size-5" />}
            />
            <div className="flex shrink-0 items-center gap-1.5">
              {[
                { number: 1, label: "Informasi" },
                { number: 2, label: "Berkas" },
                { number: 3, label: "Ajukan" },
              ].map((item) => (
                <div key={item.number} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-[10px] font-extrabold transition",
                      step > item.number
                        ? "bg-mint-100 text-mint-700"
                        : step === item.number
                          ? "bg-primary-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {step > item.number ? <CheckCircle2 className="size-3.5" /> : item.number}
                  </span>
                  <span
                    className={cn(
                      "hidden text-[10px] font-bold sm:block",
                      step >= item.number ? "text-ink" : "text-slate-400",
                    )}
                  >
                    {item.label}
                  </span>
                  {item.number < 3 ? (
                    <span className="mx-0.5 h-px w-3 bg-slate-200" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <Input
              label="Judul skripsi"
              placeholder="Contoh: Penerapan Machine Learning untuk Prediksi Kelulusan"
              value={judul}
              onChange={(event) => {
                setJudul(event.target.value);
                setErrors((current) => ({ ...current, judul: undefined }));
              }}
              error={errors.judul}
              hint={`${judul.length}/255 karakter · Gunakan judul final yang disetujui dosen.`}
              maxLength={255}
              required
            />

            <Textarea
              label="Abstrak"
              placeholder="Tuliskan ringkasan penelitian: latar belakang, metode, dan hasil utama…"
              value={abstrak}
              onChange={(event) => setAbstrak(event.target.value)}
              hint={`Opsional · ${abstrak.length}/3000 karakter`}
              maxLength={3000}
              className="min-h-32"
            />

            <div className="grid gap-4 sm:grid-cols-[0.4fr_0.6fr]">
              <Input
                label="Tahun skripsi"
                type="number"
                min={1900}
                max={CURRENT_YEAR}
                value={tahun}
                onChange={(event) => {
                  setTahun(event.target.value);
                  setErrors((current) => ({ ...current, tahun: undefined }));
                }}
                error={errors.tahun}
                hint={`Maksimal ${CURRENT_YEAR}`}
                required
              />
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-700">
                  Peminatan &amp; program studi
                </p>
                <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs text-slate-500">
                  <ShieldCheck className="size-4 text-primary-500" />
                  Mengikuti data akademik yang dikelola Tendik
                </div>
                <p className="mt-1.5 text-xs text-ink-faint">
                  Peminatan diambil dari profil mahasiswa, bukan dari formulir ini.
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
                Berkas skripsi (PDF) <span className="text-coral-500">*</span>
              </p>
              <input
                id="pengajuan-file"
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center gap-3 rounded-2xl border border-mint-200 bg-mint-50/60 p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-coral-500 shadow-sm ring-1 ring-slate-200">
                    <FileText className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink">{file.name}</p>
                    <p className="mt-0.5 text-[10px] text-mint-700">
                      {formatFileSize(file.size)} · Siap diunggah
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFile(null)}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-coral-600"
                    aria-label="Hapus berkas"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={cn(
                    "rounded-2xl border-2 border-dashed transition",
                    dragging
                      ? "border-primary-300 bg-primary-50/70"
                      : "border-slate-200 bg-slate-50/50 hover:border-primary-200 hover:bg-primary-50/30",
                    errors.file || fileError ? "border-coral-300 bg-coral-50/40" : "",
                  )}
                >
                  <label
                    htmlFor="pengajuan-file"
                    className="flex cursor-pointer flex-col items-center justify-center px-5 py-8 text-center"
                  >
                    <span className="grid size-11 place-items-center rounded-2xl bg-white text-primary-500 shadow-sm ring-1 ring-slate-200">
                      <UploadCloud className="size-5" />
                    </span>
                    <p className="mt-3 text-xs font-bold text-ink">
                      Tarik PDF ke sini atau klik untuk memilih
                    </p>
                    <p className="mt-1 text-[10px] text-ink-soft">
                      Khusus PDF · Maksimal 10 MB
                    </p>
                  </label>
                </div>
              )}
              {errors.file || fileError ? (
                <p className="mt-1.5 text-xs font-medium text-coral-600">
                  {errors.file ?? fileError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 size-4 shrink-0 text-primary-500" />
                <div>
                  <p className="text-xs font-bold text-ink">
                    {submitNow
                      ? "Ajukan setelah disimpan"
                      : "Simpan sebagai draft"}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-ink-soft">
                    {submitNow
                      ? "Skripsi langsung masuk ke antrean verifikasi Kaprodi."
                      : "Kamu bisa melengkapi dan mengajukan nanti dari daftar."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={submitNow}
                onClick={() => setSubmitNow((value) => !value)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  submitNow ? "bg-primary-600" : "bg-slate-300",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
                    submitNow ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="max-w-sm text-[10px] leading-relaxed text-slate-400">
                Setelah diajukan, skripsi tidak dapat diedit sampai Kaprodi
                memberikan keputusan. Pastikan data sudah benar.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                  icon={<Send />}
                >
                  {submitting
                    ? progress !== null
                      ? `Mengunggah ${progress}%`
                      : "Memproses…"
                    : submitNow
                      ? "Ajukan skripsi"
                      : "Simpan draft"}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Alur pengajuan"
              description="Tiga langkah sampai skripsi terverifikasi."
              icon={<Sparkles className="size-5" />}
            />
            <div className="mt-4 space-y-1">
              {[
                {
                  icon: FileText,
                  title: "Isi informasi",
                  description: "Judul final, abstrak, dan tahun skripsi.",
                },
                {
                  icon: UploadCloud,
                  title: "Unggah PDF",
                  description: "Berkas maksimal 10 MB, hanya format PDF.",
                },
                {
                  icon: ShieldCheck,
                  title: "Verifikasi Kaprodi",
                  description: "Pengajuan ditinjau lalu disetujui atau ditolak.",
                },
              ].map((item, index) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="grid size-8 place-items-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                      <item.icon className="size-4" />
                    </span>
                    {index < 2 ? <span className="h-6 w-px bg-slate-200" /> : null}
                  </div>
                  <div className="pt-0.5">
                    <p className="text-xs font-bold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-ink-soft">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Checklist berkas"
              description="Siapkan sebelum mengirim."
              icon={<CheckCircle2 className="size-5" />}
            />
            <ul className="mt-4 space-y-2.5">
              {[
                "Judul skripsi sudah final",
                "Abstrak ringkas dan jelas",
                "Dokumen PDF maksimal 10 MB",
                `Tahun tidak melebihi ${CURRENT_YEAR}`,
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11px] text-slate-600">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-mint-500" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                <Info className="size-3" />
                Belum terdaftar?
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800/80">
                Jika muncul pesan “Data mahasiswa belum terdaftar”, hubungi Tendik
                untuk melengkapi NIM dan program studi akunmu.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Lacak pengajuan"
              description="Punya skripsi lama? Masukkan ID-nya."
              icon={<Search className="size-5" />}
            />
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Contoh: 12"
                type="number"
                min={1}
                value={trackInput}
                onChange={(event) => setTrackInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleTrack();
                  }
                }}
                wrapperClassName="flex-1"
              />
              <Button
                variant="secondary"
                onClick={() => void handleTrack()}
                loading={tracking}
                disabled={!trackInput.trim()}
                className="mt-[1px] h-11 shrink-0"
              >
                Lacak
              </Button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
              ID pengajuan tercantum pada konfirmasi setelah pengajuan dibuat.
            </p>
          </Card>
        </div>
      </div>

      <Card padded={false}>
        <div className="p-5 pb-3 sm:p-6 sm:pb-3">
          <CardHeader
            title="Pengajuan dari perangkat ini"
            description="Daftar ID pengajuan yang dibuat atau dilacak di browser ini. Aksi tetap diverifikasi oleh backend."
            icon={<Clock3 className="size-5" />}
            action={
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                  {formatNumber(tracked.length)} pengajuan
                </span>
                <button
                  type="button"
                  onClick={trackedQuery.refetch}
                  className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
                  aria-label="Muat ulang pengajuan"
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </div>
            }
          />

          {trackedQuery.loading ? (
            <div className="mt-4">
              <TableSkeleton rows={3} />
            </div>
          ) : trackedQuery.error ? (
            <div className="mt-4">
              <EmptyState
                compact
                title="Gagal memuat pengajuan"
                description={trackedQuery.error}
                action={
                  <Button variant="secondary" size="sm" onClick={trackedQuery.refetch}>
                    Coba lagi
                  </Button>
                }
              />
            </div>
          ) : tracked.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                compact
                icon={<FileText className="size-5" />}
                title="Belum ada pengajuan yang dilacak"
                description="Pengajuan yang kamu buat akan otomatis muncul di sini. Untuk pengajuan lama, gunakan kartu Lacak pengajuan di atas."
              />
            </div>
          ) : (
            <>
              <div className="mt-3 hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[820px] text-left">
                  <thead>
                    <tr className="table-head">
                      <th className="px-6 py-2.5 font-bold">Skripsi</th>
                      <th className="px-3 py-2.5 font-bold">Status</th>
                      <th className="px-3 py-2.5 font-bold">Peminatan</th>
                      <th className="px-3 py-2.5 font-bold">Berkas</th>
                      <th className="px-6 py-2.5 text-right font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracked.map((item) => {
                      const editable = item.status === "draft" || item.status === "ditolak";
                      const fileUrl = resolveFileUrl(item.fileUrl);
                      return (
                        <tr key={item.id} className="table-row">
                          <td className="px-6 py-4">
                            <p className="max-w-md text-xs font-bold leading-relaxed text-ink">
                              {truncate(item.judul, 90)}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              ID #{item.id} · {item.tahun} · dibuat{" "}
                              {formatDate(item.createdAt)}
                            </p>
                          </td>
                          <td className="px-3 py-4">
                            <StatusBadge status={item.status} size="xs" />
                          </td>
                          <td className="px-3 py-4">
                            <PeminatanBadge value={item.peminatan} size="xs" short />
                          </td>
                          <td className="px-3 py-4">
                            {fileUrl ? (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700"
                              >
                                <Download className="size-3.5" />
                                PDF
                              </a>
                            ) : (
                              <span className="text-[11px] text-amber-600">Belum ada</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <IconAction
                                label="Lihat detail"
                                onClick={() => navigate(`/repository/${item.id}`)}
                                icon={<Eye className="size-3.5" />}
                              />
                              {editable ? (
                                <IconAction
                                  label="Edit skripsi"
                                  onClick={() => setEditTarget(item)}
                                  icon={<Pencil className="size-3.5" />}
                                />
                              ) : null}
                              <IconAction
                                label="Unggah / ganti PDF"
                                onClick={() => setUploadTarget(item)}
                                icon={<UploadCloud className="size-3.5" />}
                              />
                              {editable ? (
                                <>
                                  <IconAction
                                    label="Ajukan skripsi"
                                    tone="mint"
                                    loading={busyAction === `${item.id}:submit`}
                                    onClick={() => void handleSubmitTracked(item)}
                                    icon={<Send className="size-3.5" />}
                                  />
                                  <IconAction
                                    label="Hapus skripsi"
                                    tone="danger"
                                    onClick={() => setDeleteTarget(item)}
                                    icon={<Trash2 className="size-3.5" />}
                                  />
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:hidden">
                {tracked.map((item) => {
                  const editable = item.status === "draft" || item.status === "ditolak";
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={item.status} size="xs" />
                        <span className="text-[10px] text-slate-400">
                          ID #{item.id}
                        </span>
                      </div>
                      <p className="mt-2.5 line-clamp-3 text-xs font-bold leading-relaxed text-ink">
                        {item.judul}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <PeminatanBadge value={item.peminatan} size="xs" short />
                        <span className="text-[10px] text-slate-400">{item.tahun}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye />}
                          onClick={() => navigate(`/repository/${item.id}`)}
                        >
                          Detail
                        </Button>
                        {editable ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Pencil />}
                            onClick={() => setEditTarget(item)}
                          >
                            Edit
                          </Button>
                        ) : null}
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<UploadCloud />}
                          onClick={() => setUploadTarget(item)}
                        >
                          PDF
                        </Button>
                        {editable ? (
                          <Button
                            variant="mint"
                            size="sm"
                            icon={<Send />}
                            loading={busyAction === `${item.id}:submit`}
                            onClick={() => void handleSubmitTracked(item)}
                          >
                            Ajukan
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50/80 via-white to-mint-50/60 px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-primary-600 shadow-sm ring-1 ring-primary-100">
            <Library className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold text-ink">
              Ingin melihat referensi skripsi lain?
            </p>
            <p className="mt-0.5 text-[11px] text-ink-soft">
              Telusuri repository berdasarkan peminatan dan tahun sebelum menyusun
              judul.
            </p>
          </div>
        </div>
        <Link to="/repository">
          <Button variant="outline" size="sm" icon={<ArrowRight />}>
            Buka repository
          </Button>
        </Link>
      </div>

      <EditSkripsiModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => setTrackedVersion((value) => value + 1)}
      />

      <UploadBerkasModal
        target={uploadTarget}
        onClose={() => setUploadTarget(null)}
        onUploaded={() => setTrackedVersion((value) => value + 1)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Hapus draft skripsi?"
        description={
          deleteTarget
            ? `“${truncate(deleteTarget.judul, 90)}” akan dihapus permanen dari repository.`
            : ""
        }
        confirmLabel="Hapus skripsi"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
}

function IconAction({
  label,
  icon,
  onClick,
  tone = "slate",
  loading = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: "slate" | "mint" | "danger";
  loading?: boolean;
}) {
  const toneClass = {
    slate: "text-slate-500 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600",
    mint: "text-mint-600 hover:border-mint-200 hover:bg-mint-50",
    danger: "text-coral-500 hover:border-coral-200 hover:bg-coral-50",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={label}
      aria-label={label}
      className={cn(
        "grid size-8 place-items-center rounded-lg border border-transparent transition disabled:cursor-not-allowed disabled:opacity-50",
        toneClass,
      )}
    >
      {loading ? <RefreshCw className="size-3.5 animate-spin" /> : icon}
    </button>
  );
}

function EditSkripsiModal({
  target,
  onClose,
  onSaved,
}: {
  target: Skripsi | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [judul, setJudul] = useState("");
  const [abstrak, setAbstrak] = useState("");
  const [tahun, setTahun] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setJudul(target.judul);
    setAbstrak(target.abstrak ?? "");
    setTahun(String(target.tahun));
    setError(null);
  }, [target]);

  const save = async () => {
    if (!target) return;
    const year = Number(tahun);
    if (!judul.trim() || judul.trim().length < 5) {
      setError("Judul minimal 5 karakter.");
      return;
    }
    if (!Number.isInteger(year) || year < 1900 || year > CURRENT_YEAR) {
      setError(`Tahun harus antara 1900 dan ${CURRENT_YEAR}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await skripsiService.update(target.id, {
        judul: judul.trim(),
        abstrak: abstrak.trim(),
        tahun: year,
      });
      toast.success("Skripsi diperbarui", "Perubahan berhasil disimpan.");
      onSaved();
      onClose();
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast.error("Gagal memperbarui", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={saving ? () => undefined : onClose}
      title="Edit data skripsi"
      description="Hanya skripsi berstatus draft atau ditolak yang dapat diedit."
      icon={<Edit3 className="size-5" />}
      size="md"
      closeOnBackdrop={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={() => void save()} loading={saving}>
            Simpan perubahan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-700">
            {error}
          </div>
        ) : null}
        <Input
          label="Judul skripsi"
          value={judul}
          onChange={(event) => setJudul(event.target.value)}
          maxLength={255}
          required
        />
        <Textarea
          label="Abstrak"
          value={abstrak}
          onChange={(event) => setAbstrak(event.target.value)}
          maxLength={3000}
          className="min-h-28"
        />
        <Input
          label="Tahun"
          type="number"
          min={1900}
          max={CURRENT_YEAR}
          value={tahun}
          onChange={(event) => setTahun(event.target.value)}
          required
        />
      </div>
    </Modal>
  );
}

function UploadBerkasModal({
  target,
  onClose,
  onUploaded,
}: {
  target: Skripsi | null;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!target) return;
    setFile(null);
    setError(null);
    setProgress(0);
    setDragging(false);
  }, [target]);

  const pickFile = (nextFile: File | null) => {
    setError(null);
    if (!nextFile) {
      setFile(null);
      return;
    }
    const validation = validatePdf(nextFile);
    if (validation) {
      setError(validation);
      setFile(null);
      return;
    }
    setFile(nextFile);
  };

  const upload = async () => {
    if (!target || !file) {
      setError("Pilih berkas PDF terlebih dahulu.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      await skripsiService.uploadFile(target.id, file, setProgress);
      toast.success("Berkas terunggah", "PDF skripsi berhasil disimpan.");
      onUploaded();
      onClose();
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast.error("Gagal mengunggah", message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={uploading ? () => undefined : onClose}
      title="Unggah berkas skripsi"
      description={target ? truncate(target.judul, 90) : undefined}
      icon={<UploadCloud className="size-5" />}
      size="md"
      closeOnBackdrop={!uploading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Batal
          </Button>
          <Button
            onClick={() => void upload()}
            loading={uploading}
            disabled={!file}
            icon={<UploadCloud />}
          >
            {uploading ? `Mengunggah ${progress}%` : "Unggah PDF"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-700">
            {error}
          </div>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center gap-3 rounded-2xl border border-mint-200 bg-mint-50/60 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-coral-500 shadow-sm ring-1 ring-slate-200">
              <FileText className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">{file.name}</p>
              <p className="mt-0.5 text-[10px] text-mint-700">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => pickFile(null)}
              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-coral-600"
              aria-label="Hapus berkas"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              pickFile(event.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={cn(
              "cursor-pointer rounded-2xl border-2 border-dashed px-5 py-9 text-center transition",
              dragging
                ? "border-primary-300 bg-primary-50/70"
                : "border-slate-200 bg-slate-50/50 hover:border-primary-200 hover:bg-primary-50/30",
            )}
          >
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-white text-primary-500 shadow-sm ring-1 ring-slate-200">
              <UploadCloud className="size-5" />
            </span>
            <p className="mt-3 text-xs font-bold text-ink">
              Klik atau tarik berkas PDF ke sini
            </p>
            <p className="mt-1 text-[10px] text-ink-soft">Maksimal 10 MB</p>
          </div>
        )}
        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[10px] leading-relaxed text-slate-500">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary-500" />
          Mengunggah berkas baru akan menggantikan berkas PDF sebelumnya.
        </div>
      </div>
    </Modal>
  );
}
