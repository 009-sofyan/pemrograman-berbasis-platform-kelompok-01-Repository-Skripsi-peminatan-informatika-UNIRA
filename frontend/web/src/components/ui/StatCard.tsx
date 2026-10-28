import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/cn";
import type { Tone } from "../../constants";
import { Skeleton } from "./Skeleton";

const ICON_TONES: Record<Tone, string> = {
  indigo: "bg-primary-50 text-primary-600 ring-primary-100",
  mint: "bg-mint-50 text-mint-600 ring-mint-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  coral: "bg-coral-50 text-coral-600 ring-coral-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  slate: "bg-slate-100 text-slate-500 ring-slate-200",
};

const ACCENTS: Record<Tone, string> = {
  indigo: "from-primary-500 to-violet-500",
  mint: "from-mint-500 to-emerald-400",
  sky: "from-sky-500 to-cyan-400",
  amber: "from-amber-500 to-orange-400",
  coral: "from-coral-500 to-rose-400",
  violet: "from-violet-500 to-fuchsia-400",
  slate: "from-slate-400 to-slate-300",
};

export function StatCard({
  label,
  value,
  caption,
  icon,
  tone = "indigo",
  badge,
  to,
  loading = false,
  className,
}: {
  label: string;
  value: string | number;
  caption?: string;
  icon: ReactNode;
  tone?: Tone;
  badge?: string;
  to?: string;
  loading?: boolean;
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-card",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-70",
          ACCENTS[tone],
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-gradient-to-br opacity-[0.07] blur-xl transition group-hover:opacity-[0.12]",
          ACCENTS[tone],
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-2xl ring-1",
            ICON_TONES[tone],
          )}
        >
          {icon}
        </span>
        {to ? (
          <span className="grid size-7 place-items-center rounded-lg text-slate-300 transition group-hover:bg-slate-100 group-hover:text-slate-600">
            <ArrowUpRight className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-xs font-semibold text-ink-soft">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-20" />
      ) : (
        <p className="mt-1 text-[26px] font-extrabold tracking-tight text-ink">
          {value}
        </p>
      )}
      <div className="mt-2 flex min-h-5 items-center gap-2">
        {badge ? (
          <span
            className={cn(
              "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold",
              ICON_TONES[tone],
            )}
          >
            {badge}
          </span>
        ) : null}
        {caption ? (
          <p className="line-clamp-1 text-[11px] text-ink-faint">{caption}</p>
        ) : null}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2">
        {content}
      </Link>
    );
  }

  return content;
}
