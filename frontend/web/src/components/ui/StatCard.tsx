import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/cn";
import type { Tone } from "../../constants";
import { Skeleton } from "./Skeleton";
import { CountUp } from "./CountUp";

const ICON_TONES: Record<Tone, string> = {
  indigo: "bg-primary-50 text-primary-600 ring-primary-100",
  bi: "bg-bi-50 text-bi-600 ring-bi-100",
  sa: "bg-sa-50 text-sa-600 ring-sa-100",
  mint: "bg-sa-50 text-sa-600 ring-sa-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  coral: "bg-coral-50 text-coral-600 ring-coral-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  navy: "bg-navy-50 text-navy-700 ring-navy-100",
  gold: "bg-gold-50 text-gold-700 ring-gold-200",
  slate: "bg-slate-100 text-slate-500 ring-slate-200",
};

const ACCENTS: Record<Tone, string> = {
  indigo: "from-primary-500 to-violet-500",
  bi: "from-bi-500 to-violet-400",
  sa: "from-sa-500 to-teal-300",
  mint: "from-sa-500 to-teal-300",
  sky: "from-sky-500 to-cyan-400",
  amber: "from-amber-500 to-orange-400",
  coral: "from-coral-500 to-rose-400",
  rose: "from-rose-500 to-coral-400",
  violet: "from-violet-500 to-fuchsia-400",
  navy: "from-navy-700 to-navy-500",
  gold: "from-gold-400 to-amber-300",
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
  const numericValue = typeof value === "number" ? value : null;
  const content = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-panel border border-white/80 bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-navy-100 hover:shadow-card",
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
          "pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-gradient-to-br opacity-[0.07] blur-xl transition group-hover:opacity-[0.14]",
          ACCENTS[tone],
        )}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-input ring-1",
            ICON_TONES[tone],
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        {to ? (
          <span className="grid size-8 place-items-center rounded-lg text-ink-faint transition group-hover:bg-navy-50 group-hover:text-navy-700">
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
