import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  ChartPie,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LibraryBig,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/layout/Logo";
import { ROLE_LANDING, ROLE_META } from "../constants";
import type { Role } from "../types";
import { getApiErrorMessage } from "../lib/errors";
import { cn } from "../lib/cn";

const ROLE_OPTIONS = [
  { value: "mahasiswa" as const, icon: GraduationCap },
  { value: "kaprodi" as const, icon: ShieldCheck },
  { value: "tendik" as const, icon: BriefcaseBusiness },
];

const ROLE_ICON_TONE: Record<Role, string> = {
  mahasiswa: "bg-sky-50 text-sky-600 ring-sky-100",
  kaprodi: "bg-primary-50 text-primary-600 ring-primary-100",
  tendik: "bg-mint-50 text-mint-600 ring-mint-100",
};

const FEATURES = [
  {
    icon: LibraryBig,
    title: "Repository terpusat",
    description: "Telusuri referensi skripsi berdasarkan judul, tahun, dan peminatan.",
  },
  {
    icon: ChartPie,
    title: "Pemetaan BI & SA",
    description: "Pantau distribusi mahasiswa Business Intelligence dan Smart Agriculture.",
  },
  {
    icon: ShieldCheck,
    title: "Akses sesuai peran",
    description: "Mahasiswa, Kaprodi, dan Tendik mendapat ruang kerja yang terpisah.",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const registeredEmail =
    (location.state as { registeredEmail?: string } | null)?.registeredEmail ?? "";
  const justRegistered = Boolean(registeredEmail);
  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("mahasiswa");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const expired = new URLSearchParams(location.search).get("expired") === "1";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      nextErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Format email tidak valid";
    }
    if (!password) {
      nextErrors.password = "Password wajib diisi";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const user = await login({
        email: email.trim().toLowerCase(),
        password,
      });
      const firstName = user.nama.split(" ")[0] ?? user.nama;
      if (user.role !== role) {
        toast.warning(
          "Peran akun berbeda",
          `Akun ini terdaftar sebagai ${ROLE_META[user.role].label}. Kamu diarahkan ke dashboard ${ROLE_META[user.role].label}.`,
        );
      } else {
        toast.success(
          `Selamat datang, ${firstName}!`,
          `Kamu masuk sebagai ${ROLE_META[user.role].label}.`,
        );
      }
      navigate(ROLE_LANDING[user.role], { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err, "Email atau password salah.");
      setError(message);
      toast.error("Gagal masuk", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas p-3 sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full bg-primary-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 size-[380px] rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-200/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1280px] overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-card backdrop-blur-sm lg:grid-cols-[1.04fr_0.96fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col xl:p-12">
          <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
          <div className="pointer-events-none absolute inset-0 bg-grid-slate bg-[size:32px_32px] opacity-30" />
          <div className="pointer-events-none absolute -right-20 top-10 size-72 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-mint-500/10 blur-3xl" />

          <div className="relative">
            <Logo tone="light" />
          </div>

          <div className="relative mt-14 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-200 backdrop-blur">
              <Sparkles className="size-3.5" />
              Fakultas Teknik · Universitas Madura
            </span>
            <h1 className="mt-6 text-[42px] font-extrabold leading-[1.08] tracking-tight xl:text-[50px]">
              Satu ruang untuk{" "}
              <span className="bg-gradient-to-r from-primary-300 via-violet-300 to-mint-300 bg-clip-text text-transparent">
                skripsi &amp; peminatan
              </span>{" "}
              risetmu.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-300">
              Repository skripsi Informatika UNIRA dengan alur pengajuan yang rapi,
              verifikasi Kaprodi, dan pemetaan peminatan Business Intelligence serta
              Smart Agriculture.
            </p>

            <div className="mt-9 space-y-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-primary-200 backdrop-blur">
                    <feature.icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{feature.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-auto pt-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[11px] font-semibold text-sky-200">
                <BrainCircuit className="size-3.5" />
                Business Intelligence
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-400/20 bg-mint-400/10 px-3 py-1.5 text-[11px] font-semibold text-mint-200">
                <Sprout className="size-3.5" />
                Smart Agriculture
              </span>
            </div>
            <p className="mt-5 flex items-center gap-2 text-[11px] text-slate-500">
              <GraduationCap className="size-4" />
              Sistem Repository Skripsi dan Pemetaan Peminatan
            </p>
          </div>
        </section>

        <section className="relative flex flex-col justify-center px-5 py-9 sm:px-10 lg:px-12 xl:px-16">
          <div className="pointer-events-none absolute right-0 top-0 size-40 rounded-full bg-primary-100/50 blur-3xl" />
          <div className="relative mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600">
              Selamat datang kembali
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              Masuk ke workspace
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Pilih peranmu, lalu masuk dengan akun kampus yang sesuai.
            </p>

            {expired ? (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>
                  Sesi sebelumnya telah berakhir. Silakan masuk kembali untuk
                  melanjutkan.
                </p>
              </div>
            ) : null}

            {justRegistered ? (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-mint-200 bg-mint-50 px-3.5 py-3 text-xs text-mint-800 animate-slide-up">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-mint-600" />
                <p>
                  Pendaftaran berhasil. Akun{" "}
                  <span className="font-bold">{registeredEmail}</span> sudah dibuat.
                  Masuk untuk melanjutkan, lalu minta Tendik melengkapi data akademikmu.
                </p>
              </div>
            ) : null}

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
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Masuk sebagai
                  </p>
                  <span className="text-[10px] font-medium text-slate-400">
                    Pilih satu peran
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Pilih peran akun"
                  className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1.5"
                >
                  {ROLE_OPTIONS.map((option) => {
                    const active = role === option.value;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setRole(option.value);
                          setError(null);
                        }}
                        className={cn(
                          "group relative flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center transition-all duration-200",
                          active
                            ? "bg-gradient-to-br from-primary-600 to-violet-600 text-white shadow-glow"
                            : "text-slate-500 hover:bg-white hover:text-ink hover:shadow-sm",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-8 place-items-center rounded-lg ring-1 transition",
                            active
                              ? "bg-white/15 text-white ring-white/20"
                              : ROLE_ICON_TONE[option.value],
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="truncate text-[10.5px] font-bold tracking-tight">
                          {ROLE_META[option.value].label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                  {ROLE_META[role].description}
                </p>
              </div>

              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="nama@unira.ac.id"
                icon={Mail}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                error={fieldErrors.email}
                required
              />
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Masukkan password"
                icon={LockKeyhole}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                }}
                error={fieldErrors.password}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
                iconRight={<ArrowRight />}
              >
                {loading ? "Memverifikasi…" : "Masuk ke repository"}
              </Button>
            </form>

            <p className="mt-7 text-center text-xs text-ink-soft">
              Belum memiliki akun mahasiswa?{" "}
              <Link
                to="/register"
                className="font-bold text-primary-600 transition hover:text-primary-700 hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>

            <p className="mt-8 text-center text-[10px] leading-relaxed text-slate-400">
              © {new Date().getFullYear()} Universitas Madura · Fakultas Teknik
              <br />
              Repository Skripsi &amp; Pemetaan Peminatan Informatika
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
