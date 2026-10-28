import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline"
  | "mint";

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
    "bg-gradient-to-r from-primary-600 to-violet-600 text-white shadow-glow hover:from-primary-500 hover:to-violet-500 active:from-primary-700 active:to-violet-700",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-ink",
  ghost: "text-slate-600 hover:bg-slate-100/80 hover:text-ink",
  danger:
    "bg-gradient-to-r from-coral-600 to-rose-500 text-white shadow-[0_16px_35px_-18px_rgba(225,29,72,0.7)] hover:from-coral-500 hover:to-rose-400",
  outline:
    "border border-primary-200 bg-primary-50/60 text-primary-700 hover:border-primary-300 hover:bg-primary-100/70",
  mint: "bg-gradient-to-r from-mint-600 to-emerald-500 text-white shadow-glow-mint hover:from-mint-500 hover:to-emerald-400",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 rounded-xl px-3 text-xs",
  md: "h-11 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2.5 rounded-2xl px-6 text-sm",
  icon: "size-10 rounded-xl",
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
        "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : icon ? (
        <span className="grid place-items-center [&>svg]:size-4">{icon}</span>
      ) : null}
      {children}
      {!loading && iconRight ? (
        <span className="grid place-items-center [&>svg]:size-4">{iconRight}</span>
      ) : null}
    </button>
  );
}
