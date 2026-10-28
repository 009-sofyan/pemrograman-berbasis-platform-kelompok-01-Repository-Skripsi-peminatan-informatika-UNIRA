import { GraduationCap } from "lucide-react";
import { cn } from "../../lib/cn";
import { APP_NAME, APP_SUBTITLE } from "../../constants";

interface LogoProps {
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
}

export function Logo({ tone = "dark", compact = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 text-white shadow-glow">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.45),transparent_50%)]" />
        <GraduationCap className="relative size-6" strokeWidth={2.1} />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-[13px] font-extrabold uppercase tracking-[0.16em]",
            tone === "light" ? "text-white" : "text-ink",
          )}
        >
          {APP_NAME}
        </span>
        {!compact ? (
          <span
            className={cn(
              "mt-0.5 block truncate text-[11px] font-medium tracking-wide",
              tone === "light" ? "text-slate-400" : "text-ink-soft",
            )}
          >
            {APP_SUBTITLE}
          </span>
        ) : null}
      </span>
    </div>
  );
}
