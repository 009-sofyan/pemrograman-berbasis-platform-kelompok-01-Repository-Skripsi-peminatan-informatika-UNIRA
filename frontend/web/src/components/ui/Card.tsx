import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padded?: boolean;
}

export function Card({ className, hover = false, padded = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-soft",
        padded && "p-5 sm:p-6",
        hover &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-ink">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
