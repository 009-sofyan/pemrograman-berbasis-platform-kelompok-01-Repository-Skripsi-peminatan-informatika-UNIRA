import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { Tone } from "../../constants";

type BadgeVariant = "soft" | "solid" | "outline";
type BadgeSize = "xs" | "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  title?: string;
}

const SOFT: Record<Tone, string> = {
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

const SOLID: Record<Tone, string> = {
  indigo: "bg-primary-300 text-slate-950 ring-primary-200/40",
  bi: "bg-bi-300 text-slate-950 ring-bi-200/40",
  sa: "bg-cyan-300 text-slate-950 ring-cyan-200/40",
  mint: "bg-cyan-300 text-slate-950 ring-cyan-200/40",
  sky: "bg-sky-300 text-slate-950 ring-sky-200/40",
  amber: "bg-amber-300 text-slate-950 ring-amber-200/40",
  coral: "bg-rose-300 text-slate-950 ring-rose-200/40",
  rose: "bg-rose-300 text-slate-950 ring-rose-200/40",
  violet: "bg-violet-300 text-slate-950 ring-violet-200/40",
  navy: "bg-slate-200 text-slate-950 ring-slate-100/40",
  gold: "bg-gold-300 text-slate-950 ring-gold-200/40",
  slate: "bg-slate-300 text-slate-950 ring-slate-200/40",
};

const OUTLINE: Record<Tone, string> = {
  indigo: "border border-primary-400/30 bg-transparent text-primary-300",
  bi: "border border-bi-400/30 bg-transparent text-bi-300",
  sa: "border border-cyan-300/30 bg-transparent text-cyan-200",
  mint: "border border-cyan-300/30 bg-transparent text-cyan-200",
  sky: "border border-sky-300/30 bg-transparent text-sky-300",
  amber: "border border-amber-300/30 bg-transparent text-amber-300",
  coral: "border border-rose-300/30 bg-transparent text-rose-300",
  rose: "border border-rose-300/30 bg-transparent text-rose-300",
  violet: "border border-violet-400/30 bg-transparent text-violet-300",
  navy: "border border-white/15 bg-transparent text-slate-300",
  gold: "border border-gold-400/30 bg-transparent text-gold-300",
  slate: "border border-white/15 bg-transparent text-slate-300",
};

const SIZES: Record<BadgeSize, string> = {
  xs: "h-5 gap-1 px-2 text-[10px]",
  sm: "h-6 gap-1.5 px-2.5 text-[11px]",
  md: "h-7 gap-1.5 px-3 text-xs",
};

export function Badge({
  children,
  tone = "slate",
  variant = "soft",
  size = "sm",
  dot = false,
  className,
  title,
}: BadgeProps) {
  const variantClass =
    variant === "solid" ? SOLID[tone] : variant === "outline" ? OUTLINE[tone] : SOFT[tone];
  return (
    <span
      title={title}
      className={cn(
        "inline-flex w-fit items-center whitespace-nowrap rounded-full font-semibold ring-1 ring-inset",
        variantClass,
        SIZES[size],
        className,
      )}
    >
      {dot ? (
        <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}
