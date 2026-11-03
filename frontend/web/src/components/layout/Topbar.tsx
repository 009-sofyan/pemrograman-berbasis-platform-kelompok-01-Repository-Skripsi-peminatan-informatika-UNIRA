import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useClickOutside } from "../../hooks/useClickOutside";
import { PAGE_TITLES, ROLE_META } from "../../constants";
import { cn } from "../../lib/cn";
import { formatDate } from "../../lib/format";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

const ROLE_ICON = {
  mahasiswa: GraduationCap,
  kaprodi: ShieldCheck,
  tendik: BriefcaseBusiness,
};

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  if (!user) return null;

  const segments = location.pathname.split("/").filter(Boolean);
  const basePath = segments[0] ? `/${segments[0]}` : "/dashboard";
  const title = PAGE_TITLES[basePath] ?? "Repository Skripsi";
  const isDetail = basePath === "/repository" && segments.length > 1;
  const RoleIcon = ROLE_ICON[user.role];
  const roleMeta = ROLE_META[user.role];

  return (
    <header className="glass sticky top-3 z-40 flex h-16 items-center gap-3 rounded-panel border px-2.5 shadow-soft sm:px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        className="grid size-11 shrink-0 place-items-center rounded-input border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] lg:hidden"
        aria-label="Buka navigasi"
      >
        <Menu className="size-4.5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-ink-faint">
          <Link to="/dashboard" className="transition hover:text-cyan-300">
            UNIRA
          </Link>
          <ChevronRight className="size-3" />
          <span className="truncate text-cyan-300/90">{title}</span>
          {isDetail ? (
            <>
              <ChevronRight className="size-3" />
              <span>Detail</span>
            </>
          ) : null}
        </div>
        <p className="mt-0.5 truncate font-display text-sm font-bold text-ink">
          {isDetail ? "Detail Skripsi" : title}
        </p>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-slate-300 xl:flex">
        <CalendarDays className="size-3.5 text-cyan-300" />
        {formatDate(new Date().toISOString(), {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>

      <Badge tone={roleMeta.tone} size="sm" className="hidden sm:inline-flex">
        <RoleIcon className="size-3" />
        {roleMeta.label}
      </Badge>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-input border p-1 pr-2 transition",
            menuOpen
              ? "border-white/20 bg-white/[0.06] shadow-sm"
              : "border-transparent hover:border-white/10 hover:bg-white/[0.04]",
          )}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Menu akun"
        >
          <Avatar name={user.nama} src={user.avatarUrl} size="sm" />
          <span className="hidden max-w-[120px] truncate text-xs font-bold text-ink md:block">
            {user.nama}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-ink-faint transition-transform",
              menuOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-64 origin-top-right animate-scale-in overflow-hidden rounded-card border border-white/10 bg-[#0A0D1C]/95 shadow-elevated backdrop-blur-xl"
          >
            <div className="border-b border-white/10 bg-gradient-to-br from-violet-500/10 to-transparent p-4">
              <div className="flex items-center gap-3">
                <Avatar name={user.nama} src={user.avatarUrl} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{user.nama}</p>
                  <p className="truncate text-[11px] text-ink-soft">{user.email}</p>
                </div>
              </div>
              <Badge tone={roleMeta.tone} size="xs" className="mt-3">
                <RoleIcon className="size-3" />
                {roleMeta.label}
              </Badge>
            </div>
            <div className="p-1.5">
              <Link
                to="/profil"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
                className="flex min-h-11 items-center gap-2.5 rounded-input px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <UserRound className="size-4 text-ink-faint" />
                Profil saya
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                role="menuitem"
                className="flex min-h-11 w-full items-center gap-2.5 rounded-input px-3 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10"
              >
                <LogOut className="size-4" />
                Keluar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
