import { useState } from "react";
import { cn } from "../../lib/cn";
import { APP_NAME, APP_SUBTITLE } from "../../constants";

interface LogoProps {
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
  imageClassName?: string;
  hideTextOnMobile?: boolean;
}

function LogoImage({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "grid size-full place-items-center bg-[#070A14] px-1 text-center text-[8px] font-black uppercase leading-none tracking-[0.08em] text-gold-300",
          className,
        )}
        aria-label="Logo Repository Skripsi UNIRA"
      >
        UNIRA
      </span>
    );
  }

  return (
    <img
      src="/logo-repository.jpg"
      alt="Logo Repository Skripsi UNIRA"
      width={512}
      height={512}
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("size-full object-contain", className)}
    />
  );
}

export function Logo({
  tone = "dark",
  compact = false,
  className,
  imageClassName,
  hideTextOnMobile = false,
}: LogoProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-xl bg-[#070A14] ring-1 ring-white/15",
          imageClassName ?? "size-10",
        )}
      >
        <LogoImage />
      </span>
      <span className={cn("min-w-0", hideTextOnMobile && "hidden sm:block")}>
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
