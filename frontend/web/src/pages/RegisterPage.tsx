import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../components/ui/Button";
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
  const navigate = useNavigate();
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
    } else if (form.password.length < 6) {
      nextErrors.password = "Password minimal 6 karakter";
    }
    if (form.confirm !== form.password) {
      nextErrors.confirm = "Konfirmasi password tidak sama";
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      const message = await register({
        nama: form.nama.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      toast.success("Pendaftaran berhasil", message);
      navigate("/login", {
        replace: true,
        state: { registeredEmail: form.email.trim().toLowerCase() },
      });
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

      <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1180px] overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-card backdrop-blur-sm lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col xl:p-12">
          <div className="pointer-events-none absolute inset-0 bg-mesh opacity-55" />
          <div className="pointer-events-none absolute inset-0 bg-grid-slate bg-[size:32px_32px] opacity-25" />
          <div className="relative">
            <Logo tone="light" />
          </div>

          <div className="relative mt-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-200">
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
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.07] text-[11px] font-extrabold text-primary-200">
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
                placeholder="Minimal 6 karakter"
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
          </div>
        </section>
      </div>
    </div>
  );
}
