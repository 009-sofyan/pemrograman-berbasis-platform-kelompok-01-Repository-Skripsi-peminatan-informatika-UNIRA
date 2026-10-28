import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, Home, SearchX } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { ROLE_LANDING } from "../constants";
import { Button } from "../components/ui/Button";
import { Logo } from "../components/layout/Logo";

export default function NotFoundPage() {
  useDocumentTitle("Halaman Tidak Ditemukan");
  const { user } = useAuth();
  const navigate = useNavigate();

  const home = user ? ROLE_LANDING[user.role] : "/login";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute inset-0 bg-grid-slate bg-[size:34px_34px] opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-primary-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-mint-200/40 blur-3xl" />

      <header className="relative z-10 px-5 py-5 sm:px-8">
        <Logo />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-16 pt-6 sm:px-8">
        <div className="w-full max-w-2xl text-center">
          <div className="relative mx-auto w-fit">
            <p className="bg-gradient-to-r from-primary-600 via-violet-600 to-sky-500 bg-clip-text text-[110px] font-extrabold leading-none tracking-tighter text-transparent sm:text-[150px]">
              404
            </p>
            <span className="absolute -right-3 top-3 grid size-11 place-items-center rounded-2xl bg-white text-primary-600 shadow-card ring-1 ring-slate-200/80 sm:-right-6">
              <SearchX className="size-5" />
            </span>
          </div>

          <div className="mx-auto -mt-2 flex w-fit items-center gap-2 rounded-full border border-primary-100 bg-primary-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-600">
            <Compass className="size-3.5" />
            Tersesat di repository
          </div>

          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Halaman tidak ditemukan
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-ink-soft">
            Alamat yang kamu buka mungkin salah, sudah dipindahkan, atau data skripsi
            yang dicari tidak lagi tersedia.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Button
              variant="secondary"
              icon={<ArrowLeft />}
              onClick={() => navigate(-1)}
            >
              Kembali
            </Button>
            <Link to={home}>
              <Button icon={<Home />} iconRight={<ArrowRight />}>
                {user ? "Ke ruang kerja" : "Ke halaman masuk"}
              </Button>
            </Link>
          </div>

          <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-[11px] leading-relaxed text-slate-500 shadow-sm backdrop-blur">
            Gunakan menu navigasi di samping atau kembali ke dashboard untuk
            melanjutkan. Jika masalah berlanjut, hubungi pengelola sistem.
          </div>
        </div>
      </main>
    </div>
  );
}
