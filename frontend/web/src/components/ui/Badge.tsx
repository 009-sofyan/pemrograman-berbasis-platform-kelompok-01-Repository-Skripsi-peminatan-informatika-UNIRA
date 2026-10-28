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
  indigo: "bg-primary-50 text-primary-700 ring-primary-100",
  mint: "bg-mint-50 text-mint-700 ring-mint-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  coral: "bg-coral-50 text-coral-700 ring-coral-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200/70",
};

const SOLID: Record<Tone, string> = {
  indigo: "bg-primary-600 text-white",
  mint: "bg-mint-600 text-white",
  sky: "bg-sky-600 text-white",
  amber: "bg-amber-500 text-white",
  coral: "bg-coral-600 text-white",
  violet: "bg-violet-600 text-white",
  slate: "bg-slate-600 text-white",
};

const OUTLINE: Record<Tone, string> = {
  indigo: "border-primary-200 bg-white text-primary-700",
  mint: "border-mint-200 bg-white text-mint-700",
  sky: "border-sky-200 bg-white text-sky-700",
  amber: "border-amber-200 bg-white text-amber-700",
  coral: "border-coral-200 bg-white text-coral-700",
  violet: "border-violet-200 bg-white text-violet-700",
  slate: "border-slate-200 bg-white text-slate-600",
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
        variant !== "outline" && "ring-inset",
        variantClass,
        SIZES[size],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current opacity-80" /> : null}
      {children}
    </span>
  );
}
