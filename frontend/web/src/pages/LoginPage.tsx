import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
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
import { RoleMismatchError, useAuth } from "../contexts/AuthContext";
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

const ROLE_ID_LABEL: Record<Role, string> = {
  mahasiswa: "NIM",
  kaprodi: "NIDN",
  tendik: "NIP",
};

const ROLE_HELP: Record<Role, string> = {
  mahasiswa: "Masuk dengan email kampus yang terhubung dengan NIM kamu.",
  kaprodi: "Masuk dengan email dinas yang terhubung dengan NIDN kamu.",
  tendik: "Masuk dengan email dinas yang terhubung dengan NIP kamu.",
};

const FEATURES = [
  {
    icon: LibraryBig,
    title: "Repository terpusat",
    description: "Telusuri referensi berdasarkan judul, tahun, dan peminatan.",
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
  const reduceMotion = useReducedMotion();
  const registeredEmail =
    (location.state as { registeredEmail?: string } | null)?.registeredEmail ?? "";
  const justRegistered = Boolean(registeredEmail);
  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("mahasiswa");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const expired = new URLSearchParams(location.search).get("expired") === "1";

  const selectRole = (next: Role) => {
    setRole(next);
    setError(null);
    setFieldErrors({});
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % ROLE_OPTIONS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + ROLE_OPTIONS.length) % ROLE_OPTIONS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = ROLE_OPTIONS.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    selectRole(ROLE_OPTIONS[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  };

  const failWithShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 320);
  };

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
    if (Object.keys(nextErrors).length > 0) {
      failWithShake();
      return;
    }

    setLoading(true);
    try {
      const user = await login({
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      const firstName = user.nama.split(" ")[0] ?? user.nama;
      toast.success(
        `Selamat datang, ${firstName}!`,
        `Kamu masuk sebagai ${ROLE_META[user.role].label}.`,
      );
      navigate(ROLE_LANDING[user.role], { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err, "Email atau password salah.");
      const mismatch =
        err instanceof RoleMismatchError || /role\s+tidak\s+sesuai/i.test(message);
      const visibleMessage = mismatch
        ? `Akun ini bukan terdaftar sebagai ${ROLE_META[role].label}. Coba pilih role lain.`
        : message;

      setPassword("");
      setShowPassword(false);
      setError(visibleMessage);
      failWithShake();
      toast.error(mismatch ? "Role tidak sesuai" : "Gagal masuk", visibleMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas p-3 sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full bg-primary-300/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 right-0 size-[380px] rounded-full bg-sa-200/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-200/25 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1280px] overflow-hidden rounded-panel border border-white/80 bg-white/60 shadow-card backdrop-blur-sm lg:grid-cols-[1.02fr_0.98fr]">
        <section
          className="relative hidden overflow-hidden bg-navy-950 p-10 text-white lg:flex lg:flex-col xl:p-12"
          onMouseMove={(event) => {
            if (reduceMotion || !window.matchMedia("(min-width: 1024px)").matches) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            setParallax({ x: x * 14, y: y * 14 });
          }}
          onMouseLeave={() => setParallax({ x: 0, y: 0 })}
        >
          <div className="pointer-events-none absolute inset-0 bg-hero-navy" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-90" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-dot-grid bg-[size:28px_28px] opacity-25 [mask-image:radial-gradient(circle_at_60%_40%,black,transparent_80%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-20 top-10 size-72 animate-drift rounded-full bg-primary-400/25 blur-3xl" style={{ animationDuration: "16s" }} aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-80 animate-drift rounded-full bg-sa-400/20 blur-3xl" style={{ animationDuration: "20s", animationDirection: "reverse" }} aria-hidden="true" />

          <div className="relative">
            <Logo tone="light" />
          </div>

          <div className="relative mt-12 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-200 backdrop-blur">
              <Sparkles className="size-3.5" />
              Fakultas Teknik · Universitas Madura
            </span>
            <h1 className="mt-6 font-display text-[42px] font-extrabold leading-[1.06] tracking-tight xl:text-[52px]">
              Satu ruang untuk{" "}
              <span className="text-gradient-gold">skripsi &amp; peminatan</span>{" "}
              risetmu.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/65">
              Repository skripsi Informatika UNIRA dengan alur pengajuan yang rapi,
              verifikasi Kaprodi, dan pemetaan peminatan Business Intelligence serta
              Smart Agriculture.
            </p>

            <div className="mt-9 space-y-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-input border border-white/10 bg-white/[0.07] text-gold-200 backdrop-blur">
                    <feature.icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{feature.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/55">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kartu dekoratif: pola antarmuka, bukan foto stok. */}
          <div
            className="relative mt-10 hidden xl:block"
            style={{
              transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
              transition: reduceMotion ? undefined : "transform 180ms ease-out",
            }}
            aria-hidden="true"
          >
            <div className="absolute -right-6 -top-8 w-52 rotate-3 animate-float rounded-card border border-white/15 bg-white/[0.08] p-3 backdrop-blur-md [animation-delay:-2s]">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
                  Status
                </span>
                <BadgeCheck className="size-3.5 text-gold-300" />
              </div>
              <p className="mt-2 text-xs font-bold text-white">Pengajuan terverifikasi</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-gold-300 to-sa-300" />
              </div>
            </div>
            <div className="ml-16 w-[min(100%,24rem)] -rotate-1 animate-float rounded-card border border-white/15 bg-white/10 p-4 shadow-elevated backdrop-blur-xl [animation-delay:-5s]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-sa-400" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">
                    Pemetaan angkatan
                  </span>
                </div>
                <ChartPie className="size-4 text-white/50" />
              </div>
              <div className="mt-4 flex h-20 items-end gap-2">
                {[38, 62, 48, 78, 56, 88, 66].map((height, index) => (
                  <div key={index} className="flex flex-1 items-end gap-1">
                    <div
                      className="w-1/2 rounded-t bg-bi-400"
                      style={{ height: `${height * 0.72}%` }}
                    />
                    <div
                      className="w-1/2 rounded-t bg-sa-400"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[9px] text-white/50">
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-bi-400" /> BI
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-sa-400" /> SA
                </span>
                <span className="font-bold text-white/75">2026</span>
              </div>
            </div>
          </div>

          <div className="relative mt-auto pt-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-bi-400/20 bg-bi-400/10 px-3 py-1.5 text-[11px] font-semibold text-bi-200">
                <BrainCircuit className="size-3.5" />
                Business Intelligence
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sa-400/20 bg-sa-400/10 px-3 py-1.5 text-[11px] font-semibold text-sa-200">
                <Sprout className="size-3.5" />
                Smart Agriculture
              </span>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-white/45">
              <GraduationCap className="size-4" />
              Sistem Repository Skripsi dan Pemetaan Peminatan
            </p>
          </div>
        </section>

        <section className="relative flex flex-col justify-center px-5 py-9 sm:px-10 lg:px-12 xl:px-16">
          <div className="pointer-events-none absolute right-0 top-0 size-40 rounded-full bg-primary-100/50 blur-3xl" aria-hidden="true" />
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "glass relative mx-auto w-full max-w-md rounded-panel border p-5 shadow-card sm:p-7",
              shake && "animate-shake",
            )}
          >
            <div className="mb-7 lg:hidden">
              <Logo />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-600">
              Selamat datang kembali
            </p>
            <h2 className="mt-2 font-display text-[28px] font-extrabold tracking-tight text-ink">
              Masuk ke ruang kerja
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Pilih peranmu, lalu masuk dengan akun kampus yang sesuai.
            </p>

            {expired ? (
              <div className="mt-5 flex items-start gap-2.5 rounded-input border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>Sesi sebelumnya telah berakhir. Silakan masuk kembali untuk melanjutkan.</p>
              </div>
            ) : null}

            {justRegistered ? (
              <div className="mt-5 flex items-start gap-2.5 rounded-input border border-sa-200 bg-sa-50 px-3.5 py-3 text-xs text-sa-800 animate-slide-up">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sa-600" />
                <p>
                  Pendaftaran berhasil. Akun <span className="font-bold">{registeredEmail}</span>{" "}
                  sudah dibuat. Masuk untuk melanjutkan, lalu minta Tendik melengkapi data
                  akademikmu.
                </p>
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-input border border-coral-200 bg-coral-50 px-3.5 py-3 text-xs text-coral-700 animate-slide-up"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <div className="flex items-center justify-between">
                  <p
                    id="role-label"
                    className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint"
                  >
                    Masuk sebagai
                  </p>
                  <span className="text-[10px] font-medium text-ink-faint">
                    Pilih satu peran
                  </span>
                </div>
                <div
                  role="tablist"
                  aria-label="Pilih peran akun"
                  aria-labelledby="role-label"
                  className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-input border border-navy-100 bg-canvas-soft/80 p-1.5"
                >
                  {ROLE_OPTIONS.map((option, index) => {
                    const active = role === option.value;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        ref={(node) => {
                          tabRefs.current[index] = node;
                        }}
                        type="button"
                        role="tab"
                        id={`role-tab-${option.value}`}
                        aria-selected={active}
                        aria-controls="login-panel"
                        tabIndex={active ? 0 : -1}
                        onClick={() => selectRole(option.value)}
                        onKeyDown={(event) => onTabKeyDown(event, index)}
                        className={cn(
                          "relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-center text-[10px] font-bold transition-colors duration-200",
                          active ? "text-white" : "text-ink-soft hover:text-ink",
                        )}
                      >
                        {active ? (
                          reduceMotion ? (
                            <span className="absolute inset-0 rounded-lg bg-navy-800 shadow-soft" />
                          ) : (
                            <motion.span
                              layoutId="login-role-indicator"
                              className="absolute inset-0 rounded-lg bg-navy-800 shadow-soft"
                              transition={{ type: "spring", stiffness: 260, damping: 26 }}
                            />
                          )
                        ) : null}
                        <span
                          className={cn(
                            "relative z-10 grid size-6 place-items-center rounded-md",
                            active ? "text-gold-300" : "text-primary-500",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="relative z-10 truncate">
                          {ROLE_META[option.value].label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
                  {ROLE_META[role].description}
                </p>
              </div>

              <div id="login-panel" role="tabpanel" aria-labelledby={`role-tab-${role}`}>
                <Input
                  label={`${ROLE_ID_LABEL[role]} / Email`}
                  type="email"
                  autoComplete="username"
                  placeholder="nama@unira.ac.id"
                  icon={Mail}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFieldErrors((current) => ({ ...current, email: undefined }));
                  }}
                  error={fieldErrors.email}
                  hint={ROLE_HELP[role]}
                  required
                />
                <div className="mt-4">
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
                        className="grid size-9 place-items-center rounded-lg text-ink-faint transition hover:bg-navy-50 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
                iconRight={<ArrowRight />}
              >
                {loading ? "Memverifikasi…" : `Masuk sebagai ${ROLE_META[role].label}`}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-ink-soft">
              Belum memiliki akun mahasiswa?{" "}
              <Link
                to="/register"
                className="font-bold text-primary-600 transition hover:text-primary-700 hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[10px] leading-relaxed text-ink-faint">
              <GraduationCap className="size-3.5" />
              © {new Date().getFullYear()} Universitas Madura · Fakultas Teknik
            </p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
