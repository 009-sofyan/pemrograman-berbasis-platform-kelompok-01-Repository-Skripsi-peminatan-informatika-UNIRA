import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600">
            {icon ? (
              <span className="grid size-5 place-items-center rounded-md bg-primary-50">
                {icon}
              </span>
            ) : null}
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </div>
  );
}
