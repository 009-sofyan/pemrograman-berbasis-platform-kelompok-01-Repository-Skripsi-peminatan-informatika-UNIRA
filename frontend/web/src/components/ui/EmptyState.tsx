import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
        className,
      )}
    >
      {icon ? (
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/70">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-bold text-ink">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-ink-soft">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
