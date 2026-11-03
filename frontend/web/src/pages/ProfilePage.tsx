import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
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
  GraduationCap,
  Hash,
  Info,
  KeyRound,
  Library,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Pencil,
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
  PROGRAM_STUDI_DEFAULT,
  ROLE_CAPABILITIES,
  ROLE_META,
  SA,
} from "../constants";
import type { Role } from "../types";
import { getApiErrorMessage } from "../lib/errors";
import {
  formatDate,
  formatDateTime,
  getAngkatan,
  parseJwtExpiry,
} from "../lib/format";
import { fileToAvatarDataUrl } from "../lib/profile";
import { cn } from "../lib/cn";
import { EASE, fadeUp, staggerContainer, staggerItem } from "../lib/motion";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { PeminatanBadge } from "../components/ui/PeminatanBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Skeleton } from "../components/ui/Skeleton";
import { Modal } from "../components/ui/Modal";
import { Input, Textarea } from "../components/ui/Input";

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

const ROLE_ID_LABEL: Record<Role, string> = {
  mahasiswa: "NIM",
  kaprodi: "NIDN",
  tendik: "NIP",
};

export default function ProfilePage() {
  useDocumentTitle("Profil Saya");
  const { user, token, logout, refreshProfile, updateProfile } = useAuth();
  const toast = useToast();
  const reduceMotion = useReducedMotion();

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

  const [editOpen, setEditOpen] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editTelepon, setEditTelepon] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

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
  const academic = user.role === "mahasiswa" ? saya.data?.data ?? null : null;
  const academicIdLabel = ROLE_ID_LABEL[user.role];
  const academicId = academic?.nim ?? null;
  const programStudi =
    academic?.programStudi ??
    (user.role === "mahasiswa" ? PROGRAM_STUDI_DEFAULT : "Fakultas Teknik");
  const angkatan = academicId ? getAngkatan(academicId) : "—";
  const accountStatus = sessionExpired ? "Sesi berakhir" : "Aktif";

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.info(`${label} disalin`, value);
    } catch {
      toast.warning("Gagal menyalin", `Salin ${label.toLowerCase()} secara manual.`);
    }
  };

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

  const openEdit = () => {
    setEditNama(user.nama);
    setEditTelepon(user.telepon ?? "");
    setEditBio(user.bio ?? "");
    setEditError(null);
    setEditOpen(true);
  };

  const saveProfile = () => {
    if (!editNama.trim()) {
      setEditError("Nama lengkap wajib diisi.");
      return;
    }

    updateProfile({
      nama: editNama.trim(),
      telepon: editTelepon.trim(),
      bio: editBio.trim(),
    });
    setEditOpen(false);
    toast.success(
      "Profil diperbarui",
      "Perubahan nama, telepon, dan bio tampil di perangkat ini.",
    );
  };

  return (
    <div className="space-y-5">
      <motion.section
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={fadeUp}
        className="relative"
      >
        <div className="relative overflow-hidden rounded-panel border border-white/10 bg-navy-950 px-5 pb-28 pt-6 shadow-card sm:px-8 sm:pb-32 sm:pt-8">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#05060F] via-[#10122B] to-[#062330]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-hero-glow opacity-80"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-dot-grid bg-[size:26px_26px] opacity-20 [mask-image:radial-gradient(circle_at_60%_35%,black,transparent_78%)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-16 -top-20 size-64 animate-pulse-glow rounded-full bg-gold-400/25 blur-3xl"
            style={{ animationDuration: "14s" }}
            aria-hidden="true"
          />

          <div className="relative flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-200 backdrop-blur">
              <UserRound className="size-3.5" />
              Akun &amp; akses
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={refreshing}
                className="inline-flex h-9 items-center gap-1.5 rounded-input border border-white/15 bg-white/10 px-2.5 text-[11px] font-bold text-white/80 backdrop-blur transition hover:bg-white/15 hover:text-white disabled:cursor-wait disabled:opacity-60"
                aria-label="Muat ulang profil"
              >
                <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
                <span className="hidden sm:inline">Muat ulang</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-input border border-white/15 bg-white/10 px-2.5 text-[11px] font-bold text-white/80 backdrop-blur transition hover:bg-coral-500/20 hover:text-white"
                aria-label="Keluar dari akun"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>

          <h1 className="relative mt-6 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Profil Saya
          </h1>
          <p className="relative mt-2 max-w-xl text-xs leading-relaxed text-white/65 sm:text-sm">
            Kelola identitas akun, data akademik, dan keamanan sesi dalam satu
            ruang yang selaras dengan dashboard Repository Skripsi Informatika
            UNIRA.
          </p>
        </div>

        <div className="relative -mt-20 px-3 sm:px-6">
          <div className="rounded-panel border border-white/15 bg-navy-900 p-5 shadow-elevated ring-1 ring-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-navy-900/80 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
                  className="relative -mt-16 w-fit shrink-0 sm:-mt-20"
                >
                  <div className="rounded-panel bg-gradient-to-br from-gold-300 via-gold-400 to-sa-400 p-1 shadow-gold-glow">
                    <Avatar
                      name={user.nama}
                      src={user.avatarUrl}
                      size="xl"
                      className="ring-4 ring-navy-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-navy-900 bg-gold-400 text-navy-900 shadow-md transition hover:bg-gold-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 disabled:cursor-wait disabled:opacity-70"
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
                </motion.div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
                      {user.nama}
                    </h2>
                    <Badge
                      tone={roleMeta.tone}
                      size="sm"
                      className="border border-white/10 ring-0"
                    >
                      <ShieldCheck className="size-3" />
                      {roleMeta.label}
                    </Badge>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/65">
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="size-3.5 text-gold-300" />
                      {academicIdLabel}{" "}
                      {academicId ?? "belum tersedia"}
                    </span>
                    <span className="text-white/25" aria-hidden="true">
                      •
                    </span>
                    <span>{programStudi}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/55">
                    <Mail className="size-3.5" />
                    {user.email}
                  </p>
                  {photoError ? (
                    <p className="mt-2 max-w-xl rounded-lg border border-coral-400/30 bg-coral-500/15 px-2.5 py-1.5 text-[10px] leading-relaxed text-coral-100">
                      {photoError}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="gold"
                  size="sm"
                  icon={<Pencil />}
                  onClick={openEdit}
                >
                  Edit Profil
                </Button>
                <Link to={action.to}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<action.icon />}
                    className="border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15 hover:text-white"
                  >
                    {action.label}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={staggerContainer}
        className="grid gap-4 md:grid-cols-2"
      >
        <motion.div variants={staggerItem} className="h-full">
          <Card className="h-full">
            <CardHeader
              title="Info akun"
              description="Identitas dasar yang terhubung dengan sesi ini."
              icon={<UserRound className="size-5" />}
              action={
                <Badge
                  tone={sessionExpired ? "coral" : "mint"}
                  size="xs"
                  dot
                >
                  {accountStatus}
                </Badge>
              }
            />
            <dl className="mt-4 space-y-0.5">
              <InfoRow
                icon={<UserRound className="size-3.5" />}
                label="Nama lengkap"
                value={user.nama}
              />
              <InfoRow
                icon={<Mail className="size-3.5" />}
                label="Email"
                value={user.email}
                action={
                  <CopyButton
                    label="Email"
                    value={user.email}
                    onCopy={copyValue}
                  />
                }
              />
              <InfoRow
                icon={<Phone className="size-3.5" />}
                label="Telepon"
                value={user.telepon?.trim() || "Belum diisi"}
              />
              <InfoRow
                icon={<KeyRound className="size-3.5" />}
                label="ID akun"
                value={`#${user.id}`}
              />
              <InfoRow
                icon={<CalendarDays className="size-3.5" />}
                label="Terdaftar sejak"
                value={formatDate(user.createdAt)}
              />
            </dl>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="h-full">
          <Card className="h-full">
            <CardHeader
              title="Data akademik"
              description="NIM/NIP, program studi, dan peminatan riset."
              icon={<GraduationCap className="size-5" />}
              action={
                <Badge tone={roleMeta.tone} size="xs">
                  {roleMeta.label}
                </Badge>
              }
            />

            {saya.loading && user.role === "mahasiswa" ? (
              <div className="mt-4 space-y-2.5" aria-label="Memuat data akademik">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-11 w-full rounded-input" />
                ))}
              </div>
            ) : saya.error && user.role === "mahasiswa" ? (
              <div className="mt-4 rounded-card border border-coral-100 bg-coral-50/60 p-4">
                <p className="flex items-center gap-2 text-xs font-bold text-coral-800">
                  <Info className="size-4" />
                  Data akademik belum dapat dimuat
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
            ) : (
              <dl className="mt-4 space-y-0.5">
                <InfoRow
                  icon={<Hash className="size-3.5" />}
                  label={academicIdLabel}
                  value={academicId ?? "Belum tersedia"}
                  action={
                    academicId ? (
                      <CopyButton
                        label={academicIdLabel}
                        value={academicId}
                        onCopy={copyValue}
                      />
                    ) : undefined
                  }
                />
                <InfoRow
                  icon={<Library className="size-3.5" />}
                  label="Program studi"
                  value={programStudi}
                />
                <InfoRow
                  icon={<CalendarDays className="size-3.5" />}
                  label="Angkatan"
                  value={angkatan}
                />
                <InfoRow
                  icon={<Sparkles className="size-3.5" />}
                  label="Peminatan"
                  value={
                    user.role === "mahasiswa" ? (
                      <PeminatanBadge value={currentPeminatan} size="xs" />
                    ) : (
                      "Tidak berlaku"
                    )
                  }
                />
              </dl>
            )}

            {user.role === "mahasiswa" && !academic && !saya.loading && !saya.error ? (
              <p className="mt-3 flex items-start gap-1.5 rounded-input border border-amber-100 bg-amber-50/70 px-3 py-2 text-[10px] leading-relaxed text-amber-800/80">
                <Info className="mt-0.5 size-3 shrink-0" />
                Data NIM dan program studi belum dilengkapi Tendik. Hubungi Tendik
                agar data akademikmu muncul di sini.
              </p>
            ) : null}
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="md:col-span-2">
          <Card>
            <CardHeader
              title="Keamanan akun"
              description="Status sesi, metode autentikasi, dan tindakan keluar."
              icon={<LockKeyhole className="size-5" />}
              action={
                <Badge
                  tone={sessionExpired ? "coral" : "mint"}
                  size="xs"
                  dot
                >
                  {accountStatus}
                </Badge>
              }
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <SecurityTile
                icon={<LockKeyhole className="size-4" />}
                label="Masa berlaku token"
                value={
                  expiresAt
                    ? formatDateTime(expiresAt.toISOString())
                    : "Tidak tersedia"
                }
                caption={
                  sessionExpired
                    ? "Sesi sudah berakhir."
                    : "Sistem mengeluarkan kamu otomatis saat token kedaluwarsa."
                }
                tone={sessionExpired ? "coral" : "mint"}
              />
              <SecurityTile
                icon={<ShieldCheck className="size-4" />}
                label="Metode autentikasi"
                value="Bearer token (JWT)"
                caption="Token dikirim pada header Authorization setiap permintaan API."
              />
              <SecurityTile
                icon={<KeyRound className="size-4" />}
                label="Kata sandi"
                value="Belum tersedia"
                caption="Perubahan kata sandi belum disediakan oleh API saat ini."
                tone="amber"
              />
            </div>
            <div className="mt-4 flex flex-col items-start gap-3 rounded-card border border-coral-100 bg-coral-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-coral-800">
                  Keluar dari perangkat ini
                </p>
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
        </motion.div>
      </motion.section>

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
                className="flex items-start gap-2.5 rounded-input border border-navy-50 bg-canvas-soft/50 px-3.5 py-3"
              >
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sa-100 text-sa-600">
                  <Check className="size-3" />
                </span>
                <span className="text-[11px] leading-relaxed text-ink-soft">
                  {item}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-start gap-2 rounded-input border border-primary-100 bg-primary-50/60 px-3.5 py-3">
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
              <div className="mt-4 rounded-card border border-coral-100 bg-coral-50/60 p-4">
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
              <div className="mt-4 rounded-card border border-sa-200 bg-sa-50/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-input bg-white text-sa-600 shadow-sm ring-1 ring-sa-100">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sa-600">
                      Peminatan kamu
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                      {currentPeminatan === SA ? (
                        <Sprout className="size-4 text-sa-600" />
                      ) : (
                        <BrainCircuit className="size-4 text-sky-600" />
                      )}
                      {currentPeminatan}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-sa-800/80">
                      Pilihan ini tersimpan di server dan menjadi dasar pemetaan
                      peminatan prodi. Perubahan hanya dapat dilakukan oleh Tendik
                      melalui menu Data Mahasiswa.
                    </p>
                  </div>
                </div>
              </div>
            ) : locked ? (
              <div className="mt-4 rounded-card border border-amber-200 bg-amber-50/60 p-4">
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
                  disimpan, pilihan{" "}
                  <strong className="text-ink">tidak dapat diubah</strong> dari
                  halaman ini.
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
                  <p className="mt-3 rounded-input border border-coral-200 bg-coral-50 px-3 py-2.5 text-[11px] text-coral-700">
                    {choiceError}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-col gap-2 border-t border-navy-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-ink-faint">
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
            <div className="mt-4 rounded-card border border-navy-100 bg-gradient-to-br from-navy-50/70 to-white p-4">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-input ring-1",
                    user.role === "kaprodi"
                      ? "bg-primary-50 text-primary-600 ring-primary-100"
                      : "bg-sa-50 text-sa-600 ring-sa-100",
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
          <div className="flex items-start gap-2 rounded-input border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11px] leading-relaxed text-amber-800">
            <Info className="mt-0.5 size-4 shrink-0" />
            Peminatan hanya dapat dipilih <strong>satu kali</strong>. Pastikan
            pilihan sudah sesuai dengan rencana topik skripsi sebelum melanjutkan.
          </div>
          <p className="text-xs leading-relaxed text-ink-soft">
            Setelah tersimpan, data pemetaan prodi akan diperbarui dan perubahan
            hanya dapat dilakukan melalui Tendik.
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
          Kamu dapat masuk kembali kapan saja menggunakan email dan password yang
          sama.
        </p>
      </ConfirmDialog>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profil"
        description="Nama, telepon, bio, dan foto disimpan sebagai profil lokal perangkat ini."
        icon={<Pencil className="size-5" />}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveProfile} icon={<CheckCircle2 />}>
              Simpan perubahan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {editError ? (
            <div className="rounded-input border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-xs text-coral-700">
              {editError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-card border border-navy-100 bg-navy-50/40 p-3.5 sm:flex-row sm:items-center">
            <Avatar name={user.nama} src={user.avatarUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink">Foto profil</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-ink-soft">
                JPG, PNG, atau WebP. Foto tampil di topbar, sidebar, dan kartu
                karyamu.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Camera />}
                  loading={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Ganti foto
                </Button>
                {user.avatarUrl ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 />}
                    onClick={handleRemovePhoto}
                    className="text-coral-600 hover:bg-coral-50 hover:text-coral-700"
                  >
                    Hapus
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <Input
            label="Nama lengkap"
            value={editNama}
            onChange={(event) => {
              setEditNama(event.target.value);
              setEditError(null);
            }}
            maxLength={80}
            required
          />
          <Input
            label="Telepon"
            value={editTelepon}
            onChange={(event) => setEditTelepon(event.target.value)}
            placeholder="Contoh: 0812 3456 7890"
            maxLength={30}
          />
          <Textarea
            label="Bio singkat"
            value={editBio}
            onChange={(event) => setEditBio(event.target.value)}
            placeholder="Ceritakan minat riset atau fokus studimu…"
            maxLength={240}
            className="min-h-24"
            hint={`${editBio.length}/240 karakter`}
          />
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  action,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-input px-1 py-2.5 transition-colors hover:bg-navy-50/40">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-600 ring-1 ring-navy-100">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </dt>
        <dd className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-ink">
          <span className="min-w-0 break-words">{value}</span>
          {action}
        </dd>
      </div>
    </div>
  );
}

function CopyButton({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string, label: string) => Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => void onCopy(value, label)}
      className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-faint transition hover:bg-navy-50 hover:text-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      aria-label={`Salin ${label}`}
      title={`Salin ${label}`}
    >
      <Copy className="size-3" />
    </button>
  );
}

function SecurityTile({
  icon,
  label,
  value,
  caption,
  tone = "navy",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  caption: string;
  tone?: "navy" | "mint" | "coral" | "amber";
}) {
  const tones = {
    navy: "bg-navy-50 text-navy-600 ring-navy-100",
    mint: "bg-sa-50 text-sa-600 ring-sa-100",
    coral: "bg-coral-50 text-coral-600 ring-coral-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
  } as const;

  return (
    <div className="rounded-card border border-navy-100 bg-canvas-soft/40 p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-lg ring-1",
            tones[tone],
          )}
        >
          {icon}
        </span>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </p>
      </div>
      <p className="mt-2 break-words text-xs font-bold text-ink">{value}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-ink-faint">{caption}</p>
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
      idle: "border-navy-100 bg-white hover:border-sky-200 hover:bg-sky-50/30",
      icon: "bg-sky-50 text-sky-600 ring-sky-100",
      check: "bg-sky-400 text-[#070812]",
    },
    mint: {
      active: "border-sa-300 bg-sa-50/70 ring-2 ring-sa-100",
      idle: "border-navy-100 bg-white hover:border-sa-200 hover:bg-sa-50/30",
      icon: "bg-sa-50 text-sa-600 ring-sa-100",
      check: "bg-cyan-400 text-[#070812]",
    },
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-3 rounded-card border p-3.5 text-left transition",
        active ? tones.active : tones.idle,
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-input ring-1",
          tones.icon,
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-ink">{title}</span>
          <span className="rounded-full bg-navy-50 px-1.5 py-0.5 text-[9px] font-bold text-navy-500">
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
            : "border-navy-200 bg-white text-transparent",
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
      className="group flex items-center gap-3 rounded-input border border-navy-50 p-3 transition hover:border-navy-100 hover:bg-navy-50/50"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-primary-100">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold text-ink">{title}</span>
        <span className="block text-[10px] leading-relaxed text-ink-faint">
          {description}
        </span>
      </span>
      <ArrowRight className="size-3.5 shrink-0 text-slate-400 transition group-hover:text-primary-400" />
    </Link>
  );
}
