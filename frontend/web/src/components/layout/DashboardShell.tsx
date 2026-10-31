import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { APP_NAME } from "../../constants";
import { OfflineBanner } from "../ui/OfflineBanner";
import { PageTransition } from "../ui/Reveal";

export function DashboardShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>
      <OfflineBanner />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup navigasi"
        />
      ) : null}

      <div className="min-h-screen lg:pl-[280px]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-3 pb-28 pt-3 sm:px-5 sm:pb-24 lg:px-6 lg:pb-8 xl:px-8">
          <Topbar onOpenMenu={() => setMobileOpen(true)} />
          <main id="main-content" className="mt-5 flex-1 pb-10 sm:mt-6">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
          <footer className="mt-auto flex flex-col items-center justify-between gap-2 border-t border-navy-100/70 pt-5 text-[10px] text-ink-faint sm:flex-row">
            <p>
              © {new Date().getFullYear()} {APP_NAME} · Fakultas Teknik UNIRA
            </p>
            <p className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sa-500" />
              Pemetaan Peminatan Business Intelligence &amp; Smart Agriculture
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
