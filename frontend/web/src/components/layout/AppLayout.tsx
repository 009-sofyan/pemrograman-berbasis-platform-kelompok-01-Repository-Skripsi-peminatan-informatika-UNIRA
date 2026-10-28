import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { APP_NAME } from "../../constants";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup navigasi"
        />
      ) : null}

      <div className="lg:pl-[304px]">
        <div className="mx-auto max-w-[1560px] px-3 pb-8 pt-3 sm:px-4 lg:px-6 lg:pt-4">
          <Topbar onOpenMenu={() => setMobileOpen(true)} />
          <main className="mt-5 animate-fade-in">
            <Outlet />
          </main>
          <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-[11px] text-slate-400 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {APP_NAME} · Fakultas Teknik UNIRA
            </p>
            <p className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-mint-500" />
              Pemetaan Peminatan Business Intelligence &amp; Smart Agriculture
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
