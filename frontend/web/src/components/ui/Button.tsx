import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline"
  | "mint"
  | "gold";

type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[#F3F5FF] text-[#070812] shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_18px_44px_-22px_rgba(165,180,252,0.65)] hover:bg-white active:bg-slate-200 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/70",
  secondary:
    "border border-white/15 bg-white/[0.04] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/25 hover:bg-white/[0.08]",
  ghost: "text-slate-300 hover:bg-white/[0.06] hover:text-white",
  danger:
    "bg-rose-500 text-white shadow-[0_14px_34px_-18px_rgba(244,63,94,0.7)] hover:bg-rose-400 active:bg-rose-500",
  outline:
    "border border-white/25 bg-transparent text-white hover:border-white/45 hover:bg-white/[0.07]",
  mint: "border border-cyan-300/30 bg-cyan-400/10 text-cyan-100 shadow-[0_14px_34px_-22px_rgba(34,211,238,0.55)] hover:bg-cyan-400/[0.16]",
  gold: "bg-[#F3F5FF] text-[#070812] shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_18px_44px_-24px_rgba(245,197,24,0.45)] hover:bg-white active:bg-slate-200",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-10 gap-1.5 rounded-full px-3.5 text-xs",
  md: "h-11 gap-2 rounded-full px-4.5 text-sm",
  lg: "h-12 gap-2.5 rounded-full px-6 text-sm",
  icon: "size-11 rounded-full",
};

/**
 * Dipakai juga oleh elemen <a> agar tautan unduhan publik tetap memiliki
 * tampilan yang sama dengan Button tanpa kehilangan atribut target/rel.
 */
export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClassName({ variant, size, className })}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : icon ? (
        <span className="grid place-items-center [&>svg]:size-4" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
      {!loading && iconRight ? (
        <span className="grid place-items-center [&>svg]:size-4" aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </button>
  );
}
