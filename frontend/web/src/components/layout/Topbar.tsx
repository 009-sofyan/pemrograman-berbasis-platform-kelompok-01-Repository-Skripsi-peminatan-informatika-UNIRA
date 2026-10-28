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
    <header className="sticky top-3 z-40 flex h-16 items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-3 shadow-soft backdrop-blur-xl sm:px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-ink lg:hidden"
        aria-label="Buka navigasi"
      >
        <Menu className="size-4.5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          <span>Workspace</span>
          <ChevronRight className="size-3" />
          <span className="truncate text-primary-600">{title}</span>
          {isDetail ? (
            <>
              <ChevronRight className="size-3" />
              <span>Detail</span>
            </>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-sm font-bold text-ink">
          {isDetail ? "Detail Skripsi" : title}
        </p>
      </div>

      <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-[11px] font-semibold text-slate-500 xl:flex">
        <CalendarDays className="size-3.5 text-primary-500" />
        {formatDate(new Date().toISOString(), {
          weekday: "short",
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
            "flex items-center gap-2 rounded-xl border border-transparent p-1 pr-2 transition hover:border-slate-200 hover:bg-white",
            menuOpen && "border-slate-200 bg-white shadow-sm",
          )}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <Avatar name={user.nama} size="sm" />
          <span className="hidden max-w-[120px] truncate text-xs font-bold text-ink md:block">
            {user.nama}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-slate-400 transition-transform",
              menuOpen && "rotate-180",
            )}
          />
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-64 origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card"
          >
            <div className="border-b border-slate-100 bg-gradient-to-br from-primary-50/70 to-white p-4">
              <div className="flex items-center gap-3">
                <Avatar name={user.nama} size="md" />
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
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-ink"
              >
                <UserRound className="size-4 text-slate-400" />
                Profil saya
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-coral-600 transition hover:bg-coral-50"
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
