import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ROLE_LANDING, ROLE_META } from "../constants";
import { Button } from "../components/ui/Button";
import { Logo } from "../components/layout/Logo";

export default function UnauthorizedPage() {
  useDocumentTitle("Akses Ditolak");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const home = user ? ROLE_LANDING[user.role] : "/login";
  const roleMeta = user ? ROLE_META[user.role] : null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute inset-0 bg-grid-slate bg-[size:34px_34px] opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-coral-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-primary-200/40 blur-3xl" />

      <header className="relative z-10 px-5 py-5 sm:px-8">
        <Logo />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-16 pt-6 sm:px-8">
        <div className="w-full max-w-2xl text-center">
          <div className="relative mx-auto w-fit">
            <p className="bg-gradient-to-r from-coral-600 via-rose-500 to-amber-500 bg-clip-text text-[110px] font-extrabold leading-none tracking-tighter text-transparent sm:text-[150px]">
              403
            </p>
            <span className="absolute -right-3 top-3 grid size-11 place-items-center rounded-2xl bg-white text-coral-600 shadow-card ring-1 ring-slate-200/80 sm:-right-6">
              <ShieldAlert className="size-5" />
            </span>
          </div>

          <div className="mx-auto -mt-2 flex w-fit items-center gap-2 rounded-full border border-coral-100 bg-coral-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-coral-600">
            <LockKeyhole className="size-3.5" />
            Akses dibatasi
          </div>

          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Kamu tidak memiliki akses
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-ink-soft">
            Halaman ini hanya tersedia untuk peran tertentu. Gunakan menu yang sesuai
            dengan hak akses akunmu atau kembali ke ruang kerja.
          </p>

          {user && roleMeta ? (
            <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] text-slate-500 shadow-sm">
              <ShieldCheck className="size-4 text-primary-500" />
              Masuk sebagai{" "}
              <span className="font-bold text-ink">{user.nama}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                {roleMeta.label}
              </span>
            </div>
          ) : null}

          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Button
              variant="secondary"
              icon={<ArrowLeft />}
              onClick={() => navigate(-1)}
            >
              Kembali
            </Button>
            <Link to={home}>
              <Button icon={<ArrowRight />}>
                {user ? "Ke ruang kerja saya" : "Ke halaman masuk"}
              </Button>
            </Link>
          </div>

          {user ? (
            <button
              type="button"
              onClick={logout}
              className="mt-5 text-[11px] font-semibold text-slate-500 underline-offset-4 transition hover:text-coral-600 hover:underline"
            >
              Keluar dan masuk dengan akun lain
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}
