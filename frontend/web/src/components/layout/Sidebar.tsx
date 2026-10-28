import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowUpRight,
  GraduationCap,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { NAV_ITEMS, ROLE_META } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { Logo } from "./Logo";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();

  const sections = useMemo(() => {
    if (!user) return [];
    const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
    return (["Utama", "Kelola", "Akun"] as const)
      .map((section) => ({
        section,
        items: items.filter((item) => item.section === section),
      }))
      .filter((group) => group.items.length > 0);
  }, [user]);

  if (!user) return null;

  const roleMeta = ROLE_META[user.role];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen w-[280px] flex-col overflow-hidden border-r border-white/10 bg-slate-950 text-white transition-transform duration-300",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
      aria-label="Navigasi utama"
    >
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-30" />
      <div className="pointer-events-none absolute -left-24 top-1/3 size-64 rounded-full bg-primary-500/15 blur-3xl" />

      <div className="relative flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <Logo tone="light" />
        <button
          type="button"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Tutup navigasi"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="relative shrink-0 px-4 pt-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-primary-400/30 to-violet-400/20 text-primary-200 ring-1 ring-white/10">
              <GraduationCap className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Fakultas Teknik
              </p>
              <p className="truncate text-xs font-semibold text-slate-100">UNIRA</p>
            </div>
            <Badge tone={roleMeta.tone} size="xs" className="ring-0">
              {roleMeta.label}
            </Badge>
          </div>
        </div>
      </div>

      <nav className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {sections.map((group) => (
          <div key={group.section} className="mb-4 last:mb-0">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {group.section}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-primary-500/25 via-primary-500/10 to-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary-300 to-violet-400 shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
                      ) : null}
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg transition",
                          isActive
                            ? "bg-white/10 text-primary-200"
                            : "text-slate-500 group-hover:text-slate-300",
                        )}
                      >
                        <item.icon className="size-4.5" strokeWidth={2} />
                      </span>
                      <span className="truncate">{item.label}</span>
                      {isActive ? (
                        <span className="ml-auto size-1.5 rounded-full bg-mint-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative shrink-0 border-t border-white/10 p-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary-500/15 to-violet-500/10 p-3.5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-200">
            <Sparkles className="size-3.5" />
            Workspace
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
            {roleMeta.description}
          </p>
          <NavLink
            to="/profil"
            onClick={onClose}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-primary-200 transition hover:text-white"
          >
            Kelola profil
            <ArrowUpRight className="size-3.5" />
          </NavLink>
        </div>
      </div>

      <div className="relative shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/[0.05]">
          <Avatar name={user.nama} size="md" className="ring-white/20" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{user.nama}</p>
            <p className="truncate text-[10px] text-slate-400">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-coral-500/10 hover:text-coral-300"
            aria-label="Keluar dari akun"
            title="Keluar"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
