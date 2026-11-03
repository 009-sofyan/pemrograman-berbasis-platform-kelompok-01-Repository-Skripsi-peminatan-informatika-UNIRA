import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/cn";
import type { Tone } from "../../constants";
import { Skeleton } from "./Skeleton";
import { CountUp } from "./CountUp";

const ICON_TONES: Record<Tone, string> = {
  indigo: "bg-primary-500/10 text-primary-300 ring-primary-400/20",
  bi: "bg-bi-500/12 text-bi-300 ring-bi-400/20",
  sa: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20",
  mint: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20",
  sky: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  amber: "bg-amber-400/10 text-amber-300 ring-amber-300/20",
  coral: "bg-rose-400/10 text-rose-300 ring-rose-300/20",
  rose: "bg-rose-400/10 text-rose-300 ring-rose-300/20",
  violet: "bg-violet-500/12 text-violet-300 ring-violet-400/20",
  navy: "bg-white/[0.06] text-slate-300 ring-white/10",
  gold: "bg-gold-400/10 text-gold-300 ring-gold-400/25",
  slate: "bg-white/[0.05] text-slate-300 ring-white/10",
};

const ACCENTS: Record<Tone, string> = {
  indigo: "from-primary-500 to-violet-500",
  bi: "from-violet-500 to-indigo-400",
  sa: "from-cyan-400 to-sky-500",
  mint: "from-cyan-400 to-sky-500",
  sky: "from-sky-400 to-cyan-300",
  amber: "from-amber-400 to-orange-400",
  coral: "from-rose-500 to-rose-400",
  rose: "from-rose-500 to-rose-400",
  violet: "from-violet-500 to-fuchsia-400",
  navy: "from-slate-500 to-slate-400",
  gold: "from-gold-300 to-amber-400",
  slate: "from-slate-500 to-slate-400",
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
  const numericValue = typeof value === "number" ? value : null;
  const content = (
    <div
      className={cn(
        "ai-card group relative h-full overflow-hidden rounded-panel p-5 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-card",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-80",
          ACCENTS[tone],
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-gradient-to-br opacity-[0.12] blur-2xl transition group-hover:opacity-25",
          ACCENTS[tone],
        )}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white ring-1 ring-white/15 shadow-[0_0_26px_-8px_rgba(99,102,241,0.7)]",
            ACCENTS[tone],
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        {to ? (
          <span className="grid size-8 place-items-center rounded-full text-slate-500 transition group-hover:bg-white/[0.06] group-hover:text-slate-200">
            <ArrowUpRight className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-xs font-semibold text-ink-soft">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-20" />
      ) : numericValue !== null ? (
        <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink">
          <CountUp value={numericValue} />
        </p>
      ) : (
        <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink">
          {value}
        </p>
      )}
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-2">
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
      <Link
        to={to}
        className="block h-full rounded-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
      >
        {content}
      </Link>
    );
  }

  return content;
}
