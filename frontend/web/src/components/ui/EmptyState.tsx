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
        "flex flex-col items-center justify-center rounded-card border border-dashed border-white/12 bg-gradient-to-b from-white/[0.03] to-transparent text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
        className,
      )}
    >
      {icon ? (
        <span className="mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-400/10 text-cyan-200 shadow-[0_0_30px_-12px_rgba(99,102,241,0.8)] ring-1 ring-white/10">
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
