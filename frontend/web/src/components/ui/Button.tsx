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
    "bg-navy-800 text-white shadow-soft hover:bg-navy-700 active:bg-navy-900 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/20",
  secondary:
    "border border-navy-100 bg-white text-navy-800 shadow-soft hover:border-navy-200 hover:bg-navy-50/60",
  ghost: "text-ink-soft hover:bg-navy-50 hover:text-ink",
  danger:
    "bg-coral-600 text-white shadow-[0_14px_30px_-18px_rgba(211,47,47,0.65)] hover:bg-coral-700 active:bg-coral-700",
  outline:
    "border border-primary-200 bg-primary-50/70 text-primary-700 hover:border-primary-300 hover:bg-primary-100/80",
  mint: "bg-sa-600 text-white shadow-[0_14px_30px_-18px_rgba(5,150,105,0.6)] hover:bg-sa-700",
  gold: "bg-gold-400 text-navy-900 shadow-gold-glow hover:bg-gold-300 active:bg-gold-500",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-11 gap-1.5 rounded-input px-3 text-xs",
  md: "h-11 gap-2 rounded-input px-4 text-sm",
  lg: "h-12 gap-2.5 rounded-input px-6 text-sm",
  icon: "size-11 rounded-input",
};

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
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
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
