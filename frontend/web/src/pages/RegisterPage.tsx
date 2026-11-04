import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  Home,
  LockKeyhole,
  LogIn,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Button, buttonClassName } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/layout/Logo";
import { getApiErrorMessage } from "../lib/errors";

const STEPS = [
  {
    title: "Daftar akun mahasiswa",
    description: "Gunakan email aktif dan password yang aman.",
  },
  {
    title: "Lengkapi data akademik",
    description: "Tendik menambahkan NIM, program studi, dan peminatanmu.",
  },
  {
    title: "Mulai ajukan skripsi",
    description: "Unggah berkas PDF dan pantau status verifikasi Kaprodi.",
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setError(null);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string | undefined> = {};

    if (!form.nama.trim()) nextErrors.nama = "Nama lengkap wajib diisi";
    if (!form.email.trim()) {
      nextErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Format email tidak valid";
    }
    if (!form.password) {
      nextErrors.password = "Password wajib diisi";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password minimal 8 karakter";
    }
    if (form.confirm !== form.password) {
      nextErrors.confirm = "Konfirmasi password tidak sama";
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const message = await register({
        nama: form.nama.trim(),
        email,
        password: form.password,
      });
      setSubmittedEmail(email);
      toast.success("Pendaftaran diterima", message);
    } catch (err) {
      const message = getApiErrorMessage(err, "Pendaftaran gagal. Silakan coba lagi.");
      setError(message);
      toast.error("Gagal mendaftar", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas p-3 sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute -left-20 -top-24 size-[380px] rounded-full bg-primary-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 size-[360px] rounded-full bg-mint-200/40 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1180px] overflow-hidden rounded-[2rem] border border-white/10 bg-canvas-soft/85 shadow-card backdrop-blur-sm lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-navy-950 p-10 text-white lg:flex lg:flex-col xl:p-12">
          <div className="pointer-events-none absolute inset-0 bg-mesh opacity-55" />
          <div className="pointer-events-none absolute inset-0 bg-grid-slate bg-[size:32px_32px] opacity-25" />
          <div
            className="ai-blob pointer-events-none absolute -bottom-32 -right-24 size-[26rem] opacity-40 animate-drift"
            aria-hidden="true"
          />
          <div className="relative">
            <Logo tone="light" />
          </div>

          <div className="relative mt-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-300">
              <Sparkles className="size-3.5" />
              Registrasi mahasiswa
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight xl:text-[44px]">
              Mulai perjalanan{" "}
              <span className="bg-gradient-to-r from-primary-300 to-mint-300 bg-clip-text text-transparent">
                skripsi
              </span>{" "}
              kamu.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
              Satu akun untuk mengakses repository, mengajukan skripsi, dan memilih
              peminatan riset.
            </p>

            <div className="mt-10 space-y-5">
              {STEPS.map((step, index) => (
                <div key={step.title} className="flex gap-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.07] text-[11px] font-extrabold text-primary-300">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-auto flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-xs text-slate-300">
            <CheckCircle2 className="size-4 shrink-0 text-mint-300" />
            Pendaftaran hanya membuat akun. Data NIM dan program studi dilengkapi
            Tendik melalui halaman Data Mahasiswa.
          </div>
        </section>

        <section className="flex flex-col justify-center px-5 py-9 sm:px-10 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-7 flex items-center justify-between lg:hidden">
              <Logo />
              <Link
                to="/login"
                className="text-xs font-bold text-primary-600 hover:underline"
              >
                Masuk
              </Link>
            </div>

            {submittedEmail ? (
              <div className="animate-slide-up">
                <span className="grid size-14 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-300/20">
                  <Clock3 className="size-7" aria-hidden="true" />
                </span>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600">
                  Pendaftaran diterima
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
                  Menunggu verifikasi Tendik
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Akun <span className="font-bold text-ink">{submittedEmail}</span>{" "}
                  sudah dibuat. Kamu belum bisa masuk sampai Tendik menyetujui
                  pendaftaran ini.
                </p>

                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <p className="text-xs font-bold text-amber-900">Apa selanjutnya?</p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed text-amber-800">
                    <li>Tendik memeriksa data akun dan mencocokkan NIM serta program studi.</li>
                    <li>Setelah disetujui, akun berubah menjadi aktif dan kamu dapat masuk.</li>
                    <li>Jika ditolak, alasan penolakan akan tampil saat kamu mencoba masuk.</li>
                  </ol>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Link
                    to="/"
                    className={buttonClassName({
                      variant: "secondary",
                      size: "lg",
                      className: "flex-1",
                    })}
                  >
                    <Home className="size-4" aria-hidden="true" />
                    Beranda
                  </Link>
                  <Link
                    to="/login"
                    state={{ registeredEmail: submittedEmail }}
                    className={buttonClassName({
                      variant: "primary",
                      size: "lg",
                      className: "flex-1",
                    })}
                  >
                    <LogIn className="size-4" aria-hidden="true" />
                    Masuk
                  </Link>
                </div>

                <p className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[11px] leading-relaxed text-slate-500">
                  <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary-500" />
                  Butuh bantuan? Hubungi Tendik Fakultas Teknik dengan menyebutkan
                  email yang baru kamu daftarkan.
                </p>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="mb-6 hidden items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-primary-600 lg:inline-flex"
                >
                  <ArrowLeft className="size-3.5" />
                  Kembali ke halaman masuk
                </Link>

                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600">
                  Buat akun baru
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
                  Registrasi mahasiswa
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Setelah mendaftar, hubungi Tendik untuk melengkapi data akademikmu.
                </p>

                {error ? (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-2.5 rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-3 text-xs text-coral-700 animate-slide-up"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                ) : null}

                <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                  <Input
                    label="Nama lengkap"
                    placeholder="Nama sesuai data akademik"
                    icon={UserRound}
                    value={form.nama}
                    onChange={(event) => update("nama", event.target.value)}
                    error={errors.nama}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="nama@unira.ac.id"
                    icon={Mail}
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    error={errors.email}
                    required
                  />
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    icon={LockKeyhole}
                    value={form.password}
                    onChange={(event) => update("password", event.target.value)}
                    error={errors.password}
                    required
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    }
                  />
                  <Input
                    label="Konfirmasi password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    icon={LockKeyhole}
                    value={form.confirm}
                    onChange={(event) => update("confirm", event.target.value)}
                    error={errors.confirm}
                    required
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    loading={loading}
                    iconRight={<ArrowRight />}
                  >
                    {loading ? "Mendaftarkan…" : "Daftar sebagai mahasiswa"}
                  </Button>
                </form>

                <div className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[11px] leading-relaxed text-slate-500">
                  <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary-500" />
                  Pastikan email aktif. Akun mahasiswa yang sudah terdaftar akan
                  dihubungkan ke data NIM oleh Tendik.
                </div>

                <p className="mt-6 text-center text-xs text-ink-soft">
                  Sudah punya akun?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-primary-600 transition hover:text-primary-700 hover:underline"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
