import { cn } from "../../lib/cn";
import { APP_NAME, APP_SUBTITLE } from "../../constants";

interface LogoProps {
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
}

/**
 * Memakai satu-satunya aset merek yang tersedia di proyek:
 * public/favicon.svg. Folder public/brand belum ada di repository.
 */
export function Logo({ tone = "dark", compact = false, className }: LogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span
        className={cn(
          "relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-input",
          tone === "light"
            ? "bg-white/10 ring-1 ring-white/15"
            : "bg-white ring-1 ring-navy-100 shadow-soft",
        )}
      >
        <img
          src="/favicon.svg"
          alt=""
          width={44}
          height={44}
          className="size-full object-cover"
        />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate font-display text-[12px] font-extrabold uppercase tracking-[0.14em]",
            tone === "light" ? "text-white" : "text-ink",
          )}
        >
          {APP_NAME}
        </span>
        {!compact ? (
          <span
            className={cn(
              "mt-0.5 block truncate text-[10px] font-medium tracking-wide",
              tone === "light" ? "text-white/55" : "text-ink-soft",
            )}
          >
            {APP_SUBTITLE}
          </span>
        ) : null}
      </span>
    </div>
  );
}
