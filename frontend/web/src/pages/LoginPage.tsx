import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Sprout,
  XCircle,
} from "lucide-react";
import { RoleMismatchError, useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { pemetaanService } from "../services/dashboardService";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/layout/Logo";
import { AngkatanWidget } from "../components/login/AngkatanWidget";
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

type LoginErrorKind = "auth" | "pending" | "rejected" | "role";

const LOGIN_ERROR_TITLE: Record<LoginErrorKind, string> = {
  auth: "Gagal masuk",
  pending: "Menunggu verifikasi Tendik",
  rejected: "Pendaftaran akun ditolak",
  role: "Role tidak sesuai",
};

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
  const [errorKind, setErrorKind] = useState<LoginErrorKind>("auth");
  const [shake, setShake] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === "undefined" ? 900 : window.innerHeight,
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const expired = new URLSearchParams(location.search).get("expired") === "1";

  /**
   * Jumlah tahun menyesuaikan tinggi viewport agar widget tetap utuh pada
   * layar 600-1080 px maupun saat zoom 90-125%.
   */
  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const maxYears = viewportHeight < 720 ? 3 : viewportHeight < 880 ? 4 : 5;
  const pemetaan = useApiQuery(() => pemetaanService.get(), []);

  const selectRole = (next: Role) => {
    setRole(next);
    setError(null);
    setErrorKind("auth");
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
    setErrorKind("auth");

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
      const pending = /menunggu verifikasi tendik/i.test(message);
      const rejected = /ditolak oleh tendik/i.test(message);
      const kind: LoginErrorKind = pending
        ? "pending"
        : rejected
          ? "rejected"
          : mismatch
            ? "role"
            : "auth";
      const visibleMessage = mismatch
        ? `Akun ini bukan terdaftar sebagai ${ROLE_META[role].label}. Coba pilih role lain.`
        : message;

      setPassword("");
      setShowPassword(false);
      setError(visibleMessage);
      setErrorKind(kind);
      failWithShake();
      toast.error(LOGIN_ERROR_TITLE[kind], visibleMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas p-3 sm:p-5 lg:p-0">
      <div
        className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full bg-primary-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-0 size-[380px] rounded-full bg-sa-200/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-200/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] w-full min-w-0 max-w-[1440px] overflow-hidden rounded-panel border border-white/80 bg-white/60 shadow-card backdrop-blur-sm sm:min-h-[calc(100vh-2.5rem)] lg:h-screen lg:min-h-0 lg:max-w-none lg:grid-cols-[1.05fr_0.95fr] lg:rounded-none lg:border-0 lg:bg-canvas-soft lg:shadow-none">
        {/* Panel kiri: tinggi penuh, logo di atas, sambutan di tengah, widget di bawah. */}
        <section className="relative hidden min-h-screen overflow-hidden bg-navy-950 p-8 text-white [@media(max-height:560px)]:p-5 lg:flex lg:h-screen lg:min-h-0 lg:flex-col xl:p-12">
          <div className="pointer-events-none absolute inset-0 bg-hero-navy" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-90" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 bg-dot-grid bg-[size:28px_28px] opacity-25 [mask-image:radial-gradient(circle_at_60%_40%,black,transparent_80%)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-20 top-10 size-72 animate-drift rounded-full bg-primary-400/25 blur-3xl"
            style={{ animationDuration: "16s" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 size-80 animate-drift rounded-full bg-sa-400/20 blur-3xl"
            style={{ animationDuration: "20s", animationDirection: "reverse" }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <Link
              to="/"
              aria-label="Kembali ke beranda"
              className="inline-flex min-h-11 min-w-0 items-center rounded-input transition-opacity hover:opacity-90"
            >
              <Logo tone="light" />
            </Link>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/55 xl:inline-flex">
              <Sparkles className="size-3 text-gold-300" />
              Sejak 2024
            </span>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center py-6 [@media(max-height:560px)]:py-3 xl:py-8">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-200 backdrop-blur">
              <Sparkles className="size-3.5" />
              Fakultas Teknik · Universitas Madura
            </span>
            <h1 className="mt-5 max-w-xl font-display text-[clamp(2rem,3vw,3.4rem)] font-extrabold leading-[1.06] tracking-tight [@media(max-height:720px)]:text-[1.75rem]">
              Satu ruang untuk{" "}
              <span className="text-gradient-gold">skripsi &amp; peminatan</span>{" "}
              risetmu.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65 [@media(max-height:780px)]:hidden">
              Repository skripsi Informatika UNIRA dengan alur pengajuan yang rapi,
              verifikasi Kaprodi, dan pemetaan peminatan Business Intelligence serta
              Smart Agriculture.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 [@media(max-height:560px)]:hidden">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-bi-400/20 bg-bi-400/10 px-3 py-1.5 text-[11px] font-semibold text-bi-300">
                <BrainCircuit className="size-3.5" />
                Business Intelligence
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sa-400/20 bg-sa-400/10 px-3 py-1.5 text-[11px] font-semibold text-sa-300">
                <Sprout className="size-3.5" />
                Smart Agriculture
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-auto min-h-0 max-w-xl">
            <AngkatanWidget
              data={pemetaan.data?.byAngkatan ?? []}
              loading={pemetaan.loading}
              error={pemetaan.error}
              onRetry={pemetaan.refetch}
              maxYears={maxYears}
            />
            <p className="mt-3 flex items-center gap-2 text-[10px] text-white/40 [@media(max-height:720px)]:hidden">
              <GraduationCap className="size-3.5" />
              Sistem Repository Skripsi dan Pemetaan Peminatan
            </p>
          </div>
        </section>

        {/* Panel kanan: formulir login. */}
        <section className="relative flex min-h-[calc(100vh-1.5rem)] w-full min-w-0 flex-col justify-center px-5 py-9 sm:min-h-[calc(100vh-2.5rem)] sm:px-10 lg:h-screen lg:min-h-0 lg:justify-start lg:overflow-y-auto lg:px-12 xl:px-16">
          <div
            className="pointer-events-none absolute right-0 top-0 size-40 rounded-full bg-primary-100/50 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto my-auto w-full max-w-md">
            <Link
              to="/"
              aria-label="Kembali ke beranda"
              className="mb-5 inline-flex min-h-11 items-center rounded-input transition-opacity hover:opacity-90 lg:hidden"
            >
              <Logo />
            </Link>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "glass relative w-full rounded-panel border p-5 shadow-card sm:p-7 [@media(max-height:720px)]:sm:p-5",
                shake && "animate-shake",
              )}
            >
              <Link
                to="/"
                className="group -ml-1 mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-slate-400 transition-[color,transform] duration-200 hover:-translate-x-1 hover:text-slate-200 focus-visible:ring-cyan-400"
              >
                <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
                Kembali ke Beranda
              </Link>
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
                  Pendaftaran diterima. Akun{" "}
                  <span className="font-bold">{registeredEmail}</span> sedang
                  menunggu verifikasi Tendik. Kamu bisa masuk setelah pendaftaran
                  disetujui.
                </p>
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className={cn(
                  "mt-5 flex items-start gap-2.5 rounded-input border px-3.5 py-3 text-xs animate-slide-up",
                  errorKind === "pending"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-coral-200 bg-coral-50 text-coral-700",
                )}
              >
                {errorKind === "pending" ? (
                  <Clock3 className="mt-0.5 size-4 shrink-0" />
                ) : errorKind === "rejected" ? (
                  <XCircle className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-bold">{LOGIN_ERROR_TITLE[errorKind]}</p>
                  <p className="mt-0.5 leading-relaxed">{error}</p>
                </div>
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
                          active ? "text-[#070812]" : "text-slate-400 hover:text-white",
                        )}
                      >
                        {active ? (
                          reduceMotion ? (
                            <span className="absolute inset-0 rounded-lg bg-[#F3F5FF] shadow-[0_10px_28px_-18px_rgba(165,180,252,0.8)]" />
                          ) : (
                            <motion.span
                              layoutId="login-role-indicator"
                              className="absolute inset-0 rounded-lg bg-[#F3F5FF] shadow-[0_10px_28px_-18px_rgba(165,180,252,0.8)]"
                              transition={{ type: "spring", stiffness: 260, damping: 26 }}
                            />
                          )
                        ) : null}
                        <span
                          className={cn(
                            "relative z-10 grid size-6 place-items-center rounded-md",
                            active ? "text-[#4C1D95]" : "text-slate-500",
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

            <p className="mt-6 text-center text-xs text-ink-soft [@media(max-height:720px)]:mt-4">
              Belum memiliki akun mahasiswa?{" "}
              <Link
                to="/register"
                className="font-bold text-primary-600 transition hover:text-primary-700 hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[10px] leading-relaxed text-ink-faint [@media(max-height:720px)]:hidden">
              <GraduationCap className="size-3.5" />
              © {new Date().getFullYear()} Universitas Madura · Fakultas Teknik
            </p>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
