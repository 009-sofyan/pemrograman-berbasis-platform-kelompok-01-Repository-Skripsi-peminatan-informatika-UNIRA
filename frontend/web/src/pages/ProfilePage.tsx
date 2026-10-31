import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  FilePlus2,
  Info,
  KeyRound,
  Library,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { peminatanService } from "../services/peminatanService";
import {
  BI,
  CURRENT_ROLE_HELP,
  ROLE_CAPABILITIES,
  ROLE_META,
  SA,
} from "../constants";
import type { Role } from "../types";
import { getApiErrorMessage } from "../lib/errors";
import { formatDate, formatDateTime, parseJwtExpiry } from "../lib/format";
import { fileToAvatarDataUrl } from "../lib/profile";
import { cn } from "../lib/cn";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Skeleton } from "../components/ui/Skeleton";

const ROLE_ACTIONS: Record<
  Role,
  { label: string; to: string; description: string; icon: typeof Library }
> = {
  mahasiswa: {
    label: "Ajukan skripsi",
    to: "/pengajuan",
    description: "Buat pengajuan baru atau lanjutkan draft.",
    icon: FilePlus2,
  },
  kaprodi: {
    label: "Verifikasi skripsi",
    to: "/persetujuan",
    description: "Tinjau pengajuan yang menunggu keputusan.",
    icon: BadgeCheck,
  },
  tendik: {
    label: "Kelola data mahasiswa",
    to: "/mahasiswa",
    description: "Tambah atau perbarui data akademik mahasiswa.",
    icon: Users,
  },
};

export default function ProfilePage() {
  useDocumentTitle("Profil Saya");
  const { user, token, logout, refreshProfile, updateProfile } = useAuth();
  const toast = useToast();

  const [refreshing, setRefreshing] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [choice, setChoice] = useState<"Business Intelligence" | "Smart Agriculture" | "">("");
  const [savedChoice, setSavedChoice] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const saya = useApiQuery(() => peminatanService.getSaya(), [], {
    enabled: user?.role === "mahasiswa",
  });

  const expiresAt = useMemo(
    () => (token ? parseJwtExpiry(token) : null),
    [token],
  );
  const sessionExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false;

  if (!user) return null;

  const roleMeta = ROLE_META[user.role];
  const capabilities = ROLE_CAPABILITIES[user.role];
  const action = ROLE_ACTIONS[user.role];
  const currentPeminatan = saya.data?.data.peminatan ?? savedChoice;
  const hasPeminatan = Boolean(currentPeminatan);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      if (user.role === "mahasiswa") saya.refetch();
      toast.success("Profil diperbarui", "Data akun berhasil dimuat ulang dari server.");
    } catch (err) {
      toast.error("Gagal memuat profil", getApiErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(user.email);
      toast.info("Email disalin", user.email);
    } catch {
      toast.warning("Gagal menyalin", "Salin email secara manual dari kartu profil.");
    }
  };

  const requestSave = () => {
    if (!choice) {
      setChoiceError("Pilih salah satu peminatan terlebih dahulu.");
      return;
    }
    setChoiceError(null);
    setConfirmOpen(true);
  };

  const saveChoice = async () => {
    if (!choice) return;
    setSaving(true);
    setChoiceError(null);
    try {
      const response = await peminatanService.pilih({ peminatan: choice });
      setSavedChoice(response.peminatan);
      saya.setData((prev) =>
        prev
          ? {
              ...prev,
              data: { ...prev.data, peminatan: response.peminatan },
            }
          : prev,
      );
      setConfirmOpen(false);
      toast.success(
        "Peminatan berhasil dipilih",
        `${response.peminatan} kini tercatat sebagai peminatan risetmu.`,
      );
    } catch (err) {
      const message = getApiErrorMessage(err);
      setChoiceError(message);
      if (message.toLowerCase().includes("tidak dapat diubah")) {
        setLocked(true);
        toast.warning("Peminatan sudah final", message);
      } else {
        toast.error("Gagal menyimpan peminatan", message);
      }
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const avatarUrl = await fileToAvatarDataUrl(file);
      updateProfile({ avatarUrl });
      toast.success(
        "Foto profil diperbarui",
        "Foto baru langsung tampil di topbar, sidebar, dan kartu karyamu.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memproses foto.";
      setPhotoError(message);
      toast.error("Gagal mengunggah foto", message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    updateProfile({ avatarUrl: null });
    setPhotoError(null);
    toast.info("Foto profil dihapus", "Avatar kembali menggunakan inisial namamu.");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Akun & akses"
        title="Profil Saya"
        description="Kelola foto profil serta lihat informasi akun, masa berlaku sesi, dan hak akses sesuai peranmu di Repository Skripsi Informatika UNIRA."
        icon={<UserRound className="size-3" />}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<RefreshCw />}
              onClick={() => void handleRefresh()}
              loading={refreshing}
            >
              Muat ulang
            </Button>
            <Button
              variant="secondary"
              icon={<LogOut />}
              onClick={() => setLogoutOpen(true)}
              className="text-coral-600 hover:bg-coral-50 hover:text-coral-700"
            >
              Keluar
            </Button>
          </>
        }
      />

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft">
        <div className="h-28 bg-gradient-to-r from-primary-600 via-violet-600 to-sky-500 sm:h-32" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-grid-slate bg-[size:26px_26px] opacity-20 sm:h-32" />
        <div className="relative px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative w-fit">
                <Avatar
                  name={user.nama}
                  src={user.avatarUrl}
                  size="xl"
                  className="ring-4 ring-white shadow-card"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-primary-600 to-violet-600 text-white shadow-md transition hover:from-primary-500 hover:to-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
                  aria-label={user.avatarUrl ? "Ganti foto profil" : "Unggah foto profil"}
                  title={user.avatarUrl ? "Ganti foto profil" : "Unggah foto profil"}
                >
                  {uploadingPhoto ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Camera className="size-3.5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-label="Pilih foto profil"
                  onChange={(event) => void handlePhotoSelected(event)}
                />
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                    {user.nama}
                  </h2>
                  <Badge tone={roleMeta.tone} size="sm" dot>
                    {roleMeta.label}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                  <Mail className="size-3.5 text-slate-400" />
                  {user.email}
                </p>
                {user.telepon ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                    <Phone className="size-3.5 text-slate-400" />
                    {user.telepon}
                  </p>
                ) : null}
                {user.bio ? (
                  <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-slate-500">
                    {user.bio}
                  </p>
                ) : null}
                {photoError ? (
                  <p className="mt-2 max-w-xl rounded-lg border border-coral-200 bg-coral-50 px-2.5 py-1.5 text-[10px] leading-relaxed text-coral-700">
                    {photoError}
                  </p>
                ) : (
                  <p className="mt-2 flex items-center gap-1.5 text-[10px] leading-relaxed text-slate-400">
                    <Camera className="size-3 shrink-0" />
                    {user.avatarUrl
                      ? "Foto profil tampil otomatis di topbar, sidebar, dan kartu karyamu."
                      : "Unggah foto agar avatar inisial diganti di topbar, sidebar, dan kartu karyamu."}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={<Copy />} onClick={() => void copyEmail()}>
                Salin email
              </Button>
              {user.avatarUrl ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Trash2 />}
                  onClick={handleRemovePhoto}
                  className="text-coral-600 hover:bg-coral-50 hover:text-coral-700"
                >
                  Hapus foto
                </Button>
              ) : null}
              <Link to={action.to}>
                <Button size="sm" icon={<action.icon />} iconRight={<ArrowRight />}>
                  {action.label}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoTile
              label="Peran akun"
              value={roleMeta.label}
              icon={<ShieldCheck className="size-4" />}
              caption={roleMeta.description}
            />
            <InfoTile
              label="ID akun"
              value={`#${user.id}`}
              icon={<KeyRound className="size-4" />}
              caption="Identitas internal sistem"
            />
            <InfoTile
              label="Terdaftar sejak"
              value={formatDate(user.createdAt)}
              icon={<CalendarDays className="size-4" />}
              caption="Tanggal akun dibuat"
            />
            <InfoTile
              label="Sesi berlaku hingga"
              value={expiresAt ? formatDateTime(expiresAt.toISOString()) : "Tidak diketahui"}
              icon={<LockKeyhole className="size-4" />}
              caption={sessionExpired ? "Sesi sudah berakhir" : "Token JWT aktif"}
              tone={sessionExpired ? "coral" : "mint"}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader
            title="Hak akses peran"
            description={`Fitur yang tersedia untuk akun ${roleMeta.label}.`}
            icon={<ShieldCheck className="size-5" />}
            action={
              <Badge tone={roleMeta.tone} size="xs">
                {user.role}
              </Badge>
            }
          />
          <ul className="mt-4 space-y-2.5">
            {capabilities.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-3"
              >
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mint-100 text-mint-600">
                  <Check className="size-3" />
                </span>
                <span className="text-[11px] leading-relaxed text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary-100 bg-primary-50/60 px-3.5 py-3">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary-500" />
            <p className="text-[11px] leading-relaxed text-primary-800/80">
              {CURRENT_ROLE_HELP[user.role]}
            </p>
          </div>
        </Card>

        {user.role === "mahasiswa" ? (
          <Card>
            <CardHeader
              title="Peminatan riset"
              description="Pilihan peminatan bersifat final dan hanya dapat ditentukan satu kali."
              icon={<Sparkles className="size-5" />}
              action={
                saya.loading ? (
                  <Skeleton className="h-5 w-20" />
                ) : saya.error ? (
                  <Badge tone="coral" size="xs" dot>
                    Gagal dimuat
                  </Badge>
                ) : hasPeminatan ? (
                  <Badge tone="mint" size="xs" dot>
                    Sudah dipilih
                  </Badge>
                ) : (
                  <Badge tone="amber" size="xs" dot>
                    Belum dipilih
                  </Badge>
                )
              }
            />

            {saya.loading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : saya.error ? (
              <div className="mt-4 rounded-2xl border border-coral-100 bg-coral-50/60 p-4">
                <p className="flex items-center gap-2 text-xs font-bold text-coral-800">
                  <Info className="size-4" />
                  Data peminatan belum dapat dimuat
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-coral-700/80">
                  {saya.error}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw />}
                  onClick={saya.refetch}
                  className="mt-3"
                >
                  Coba lagi
                </Button>
              </div>
            ) : hasPeminatan ? (
              <div className="mt-4 rounded-2xl border border-mint-200 bg-mint-50/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-mint-600 shadow-sm ring-1 ring-mint-100">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-mint-600">
                      Peminatan kamu
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                      {currentPeminatan === SA ? (
                        <Sprout className="size-4 text-mint-600" />
                      ) : (
                        <BrainCircuit className="size-4 text-sky-600" />
                      )}
                      {currentPeminatan}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-mint-800/80">
                      Pilihan ini tersimpan di server dan menjadi dasar pemetaan peminatan
                      prodi. Perubahan hanya dapat dilakukan oleh Tendik melalui menu Data
                      Mahasiswa.
                    </p>
                  </div>
                </div>
              </div>
            ) : locked ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <LockKeyhole className="size-4" />
                  Peminatan sudah pernah dipilih
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-amber-800/80">
                  Server menolak perubahan karena peminatan bersifat final. Hubungi
                  Tendik atau Kaprodi jika terjadi kesalahan data.
                </p>
              </div>
            ) : (
              <>
                <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">
                  Pilih peminatan yang paling sesuai dengan topik risetmu. Setelah
                  disimpan, pilihan <strong className="text-ink">tidak dapat diubah</strong>{" "}
                  dari halaman ini.
                </p>

                <div className="mt-4 space-y-2.5">
                  <ChoiceOption
                    active={choice === BI}
                    title="Business Intelligence"
                    short="BI"
                    description="Analitik data, machine learning, sistem pendukung keputusan, dan transformasi digital."
                    icon={<BrainCircuit className="size-5" />}
                    tone="sky"
                    onClick={() => {
                      setChoice(BI);
                      setChoiceError(null);
                    }}
                  />
                  <ChoiceOption
                    active={choice === SA}
                    title="Smart Agriculture"
                    short="SA"
                    description="Teknologi pertanian presisi, IoT, monitoring lingkungan, dan keberlanjutan pangan."
                    icon={<Sprout className="size-5" />}
                    tone="mint"
                    onClick={() => {
                      setChoice(SA);
                      setChoiceError(null);
                    }}
                  />
                </div>

                {choiceError ? (
                  <p className="mt-3 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2.5 text-[11px] text-coral-700">
                    {choiceError}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
                    <Info className="mt-0.5 size-3 shrink-0 text-amber-500" />
                    Data akademik (NIM &amp; prodi) harus sudah dilengkapi Tendik.
                  </p>
                  <Button
                    size="sm"
                    onClick={requestSave}
                    disabled={!choice}
                    icon={<CheckCircle2 />}
                  >
                    Simpan peminatan
                  </Button>
                </div>
              </>
            )}
          </Card>
        ) : (
          <Card>
            <CardHeader
              title="Ringkasan peran"
              description={`Kamu masuk sebagai ${roleMeta.label}.`}
              icon={<Users className="size-5" />}
            />
            <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-2xl ring-1",
                    user.role === "kaprodi"
                      ? "bg-primary-50 text-primary-600 ring-primary-100"
                      : "bg-mint-50 text-mint-600 ring-mint-100",
                  )}
                >
                  {user.role === "kaprodi" ? (
                    <BadgeCheck className="size-5" />
                  ) : (
                    <Users className="size-5" />
                  )}
                </span>
                <div>
                  <p className="text-xs font-bold text-ink">
                    {user.role === "kaprodi"
                      ? "Keputusan verifikasi & pemetaan"
                      : "Pengelolaan data akademik"}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                    {user.role === "kaprodi"
                      ? "Pastikan setiap pengajuan diperiksa kelengkapan berkasnya sebelum disetujui atau ditolak."
                      : "Lengkapi data mahasiswa setelah akun mereka terdaftar agar pengajuan skripsi dapat diproses."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              <RoleLink
                to={action.to}
                title={action.label}
                description={action.description}
                icon={<action.icon className="size-4" />}
              />
              <RoleLink
                to="/repository"
                title="Repository skripsi"
                description="Telusuri seluruh karya ilmiah yang tercatat."
                icon={<Library className="size-4" />}
              />
              {user.role === "kaprodi" ? (
                <RoleLink
                  to="/pemetaan"
                  title="Pemetaan peminatan"
                  description="Lihat distribusi mahasiswa BI dan SA."
                  icon={<BrainCircuit className="size-4" />}
                />
              ) : (
                <RoleLink
                  to="/mahasiswa"
                  title="Data mahasiswa"
                  description="Kelola NIM, program studi, dan peminatan."
                  icon={<Users className="size-4" />}
                />
              )}
            </div>
          </Card>
        )}
      </section>

      <Card>
        <CardHeader
          title="Sesi & keamanan"
          description="Informasi autentikasi yang sedang aktif pada perangkat ini."
          icon={<LockKeyhole className="size-5" />}
          action={
            <Badge tone={sessionExpired ? "coral" : "mint"} size="xs" dot>
              {sessionExpired ? "Berakhir" : "Aktif"}
            </Badge>
          }
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Masa berlaku token
            </p>
            <p className="mt-1.5 text-xs font-bold text-ink">
              {expiresAt ? formatDateTime(expiresAt.toISOString()) : "Tidak tersedia"}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
              Sistem akan otomatis mengeluarkan kamu jika token kedaluwarsa atau
              server menolak sesi.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Metode autentikasi
            </p>
            <p className="mt-1.5 text-xs font-bold text-ink">
              Bearer token (JWT)
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
              Token dikirim pada header Authorization untuk setiap permintaan API.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-coral-100 bg-coral-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-coral-800">Keluar dari perangkat ini</p>
            <p className="mt-0.5 text-[11px] text-coral-700/80">
              Sesi akan dihapus dari browser dan kamu harus masuk kembali.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<LogOut />}
            onClick={() => setLogoutOpen(true)}
          >
            Keluar sekarang
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(confirmOpen)}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void saveChoice()}
        title="Simpan peminatan ini?"
        description={`Kamu memilih ${choice || "—"}.`}
        confirmLabel="Ya, simpan permanen"
        tone="amber"
        loading={saving}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11px] leading-relaxed text-amber-800">
            <Info className="mt-0.5 size-4 shrink-0" />
            Peminatan hanya dapat dipilih <strong>satu kali</strong>. Pastikan pilihan
            sudah sesuai dengan rencana topik skripsi sebelum melanjutkan.
          </div>
          <p className="text-xs leading-relaxed text-ink-soft">
            Setelah tersimpan, data pemetaan prodi akan diperbarui dan perubahan hanya
            dapat dilakukan melalui Tendik.
          </p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={logout}
        title="Keluar dari akun?"
        description={user.email}
        confirmLabel="Ya, keluar"
        tone="danger"
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Kamu dapat masuk kembali kapan saja menggunakan email dan password yang sama.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function InfoTile({
  label,
  value,
  caption,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
  tone?: "indigo" | "mint" | "coral";
}) {
  const tones = {
    indigo: "bg-primary-50 text-primary-600 ring-primary-100",
    mint: "bg-mint-50 text-mint-600 ring-mint-100",
    coral: "bg-coral-50 text-coral-600 ring-coral-100",
  } as const;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-lg ring-1",
            tones[tone],
          )}
        >
          {icon}
        </span>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-2 truncate text-xs font-bold text-ink" title={value}>
        {value}
      </p>
      <p className="mt-0.5 truncate text-[10px] text-slate-400">{caption}</p>
    </div>
  );
}

function ChoiceOption({
  active,
  title,
  short,
  description,
  icon,
  tone,
  onClick,
}: {
  active: boolean;
  title: string;
  short: string;
  description: string;
  icon: ReactNode;
  tone: "sky" | "mint";
  onClick: () => void;
}) {
  const tones = {
    sky: {
      active: "border-sky-300 bg-sky-50/70 ring-2 ring-sky-100",
      idle: "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/30",
      icon: "bg-sky-50 text-sky-600 ring-sky-100",
      check: "bg-sky-600 text-white",
    },
    mint: {
      active: "border-mint-300 bg-mint-50/70 ring-2 ring-mint-100",
      idle: "border-slate-200 bg-white hover:border-mint-200 hover:bg-mint-50/30",
      icon: "bg-mint-50 text-mint-600 ring-mint-100",
      check: "bg-mint-600 text-white",
    },
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition",
        active ? tones.active : tones.idle,
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl ring-1",
          tones.icon,
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-ink">{title}</span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
            {short}
          </span>
        </span>
        <span className="mt-1 block text-[10px] leading-relaxed text-ink-soft">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "mt-1 grid size-5 shrink-0 place-items-center rounded-full border transition",
          active
            ? cn("border-transparent", tones.check)
            : "border-slate-300 bg-white text-transparent",
        )}
      >
        <Check className="size-3" />
      </span>
    </button>
  );
}

function RoleLink({
  to,
  title,
  description,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50/70"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-primary-100">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold text-ink">{title}</span>
        <span className="block text-[10px] leading-relaxed text-slate-400">
          {description}
        </span>
      </span>
      <ArrowRight className="size-3.5 shrink-0 text-slate-300 transition group-hover:text-primary-500" />
    </Link>
  );
}
