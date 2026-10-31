import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { GraduationCap, LogOut, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { NAV_ITEMS, ROLE_META, type NavItem } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { Logo } from "./Logo";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

const ROLE_BOTTOM_ORDER: Record<string, string[]> = {
  mahasiswa: ["/dashboard", "/repository", "/pengajuan", "/peminatan", "/profil"],
  kaprodi: ["/dashboard", "/repository", "/persetujuan", "/pemetaan", "/profil"],
  tendik: ["/dashboard", "/repository", "/mahasiswa", "/profil"],
};

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const reduceMotion = useReducedMotion();

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

  const mobileItems = useMemo(() => {
    if (!user) return [];
    const order = ROLE_BOTTOM_ORDER[user.role] ?? [];
    return order
      .map((to) => NAV_ITEMS.find((item) => item.to === to))
      .filter((item): item is NavItem => Boolean(item));
  }, [user]);

  if (!user) return null;

  const roleMeta = ROLE_META[user.role];

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[280px] flex-col overflow-hidden border-r border-white/10 bg-navy-950 text-white transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navigasi utama"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(99,102,241,0.28),transparent_48%),radial-gradient(circle_at_80%_100%,rgba(16,185,129,0.14),transparent_50%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Logo tone="light" />
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-input text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Tutup navigasi"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="relative shrink-0 px-4 pt-4">
          <div className="rounded-card border border-white/10 bg-white/[0.06] p-3 backdrop-blur">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-input bg-gradient-to-br from-gold-400/25 to-gold-400/5 text-gold-300 ring-1 ring-white/10">
                <GraduationCap className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Fakultas Teknik
                </p>
                <p className="truncate text-xs font-semibold text-white/90">
                  Universitas Madura
                </p>
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
              <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-white/35">
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
                        "group relative flex min-h-11 items-center gap-3 rounded-input px-3 py-2 text-[13px] font-semibold transition-colors duration-200",
                        isActive
                          ? "text-white"
                          : "text-white/55 hover:bg-white/[0.06] hover:text-white",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? (
                          reduceMotion ? (
                            <span className="absolute inset-0 rounded-input bg-white/10 ring-1 ring-white/10" />
                          ) : (
                            <motion.span
                              layoutId="sidebar-active-pill"
                              className="absolute inset-0 rounded-input bg-white/10 ring-1 ring-white/10"
                              transition={{ type: "spring", stiffness: 260, damping: 26 }}
                            />
                          )
                        ) : null}
                        {isActive ? (
                          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold-400" />
                        ) : null}
                        <span
                          className={cn(
                            "relative z-10 grid size-8 shrink-0 place-items-center rounded-lg transition",
                            isActive
                              ? "bg-gold-400/15 text-gold-300"
                              : "text-white/40 group-hover:text-white/75",
                          )}
                        >
                          <item.icon className="size-4.5" strokeWidth={2} />
                        </span>
                        <span className="relative z-10 truncate">{item.label}</span>
                        {isActive ? (
                          <span className="relative z-10 ml-auto size-1.5 rounded-full bg-gold-300" />
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
          <div className="flex items-center gap-3 rounded-card p-2">
            <Avatar
              name={user.nama}
              src={user.avatarUrl}
              size="md"
              className="ring-white/20"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{user.nama}</p>
              <p className="truncate text-[10px] text-white/45">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="grid size-11 shrink-0 place-items-center rounded-input text-white/45 transition hover:bg-coral-500/15 hover:text-coral-300"
              aria-label="Keluar dari akun"
              title="Keluar"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Bottom navigation khusus perangkat sentuh / layar kecil. */}
      <nav
        className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-panel border px-1 py-1 shadow-elevated lg:hidden"
        aria-label="Navigasi cepat"
      >
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-card px-1 text-[9px] font-bold transition",
                isActive ? "bg-navy-800 text-white shadow-soft" : "text-ink-soft",
              )
            }
          >
            <item.icon className="size-4" />
            <span className="w-full truncate text-center">{item.label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
