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
        "ai-card rounded-panel",
        "min-w-0",
        padded && "p-5 sm:p-6",
        hover &&
          "transition-all duration-200 ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-card",
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
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {icon ? (
          <span className="node-badge grid size-10 shrink-0 place-items-center rounded-xl text-white ring-1 ring-white/15">
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
