import { useId } from "react";
import { BI, SA } from "../../constants";
import type { PeminatanValue } from "../../types";
import { cn } from "../../lib/cn";

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function GeneratedCover({
  id,
  judul,
  peminatan,
  tahun,
  author,
  className,
}: {
  id: number;
  judul: string;
  peminatan: PeminatanValue;
  tahun: number | string;
  author?: string | null;
  className?: string;
}) {
  const filterId = `grain-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const seed = hashSeed(`${id}-${judul}-${peminatan ?? "none"}`);
  const tone =
    peminatan === BI
      ? "bi"
      : peminatan === SA
        ? "sa"
        : seed % 2 === 0
          ? "sa"
          : "bi";
  const angle = 108 + (seed % 64);
  const blobA = {
    left: 8 + (seed % 46),
    top: 10 + ((seed >> 4) % 38),
  };
  const blobB = {
    left: 52 + ((seed >> 7) % 40),
    top: 50 + ((seed >> 11) % 38),
  };
  const shortCode = peminatan === BI ? "BI" : peminatan === SA ? "SA" : "SKRIPSI";
  const authorName = author?.trim() || "Mahasiswa Informatika";

  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden bg-navy-950 text-white",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "absolute -inset-1/2 bg-gradient-to-br",
          tone === "bi"
            ? "from-[#070812] via-[#2B1D63] to-[#7C3AED]"
            : "from-[#040B12] via-[#0B3E4C] to-[#06B6D4]",
        )}
        style={{ transform: `rotate(${angle}deg)` }}
      />

      <div
        className={cn(
          "absolute size-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl",
          tone === "bi" ? "bg-bi-500/40" : "bg-sa-500/35",
        )}
        style={{ left: `${blobA.left}%`, top: `${blobA.top}%` }}
      />
      <div
        className={cn(
          "absolute size-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl",
          tone === "bi" ? "bg-primary-400/25" : "bg-emerald-300/20",
        )}
        style={{ left: `${blobB.left}%`, top: `${blobB.top}%` }}
      />
      <div className="absolute -bottom-16 -left-16 size-[58%] rounded-full bg-gold-400/15 blur-3xl" />

      <div className="absolute inset-0 bg-dot-grid bg-[size:22px_22px] opacity-20" />

      <svg
        className="pointer-events-none absolute inset-0 size-full opacity-[0.09] mix-blend-soft-light"
        aria-hidden="true"
      >
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="2"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>

      <img
        src="/favicon.svg"
        alt=""
        width={280}
        height={280}
        className="pointer-events-none absolute -bottom-10 -right-12 w-[62%] select-none opacity-[0.08] brightness-0 invert"
      />

      <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.16em] text-navy-800 shadow-sm">
        <img
          src="/favicon.svg"
          alt=""
          width={14}
          height={14}
          className="size-3.5 rounded-[3px]"
        />
        UNIRA
      </span>

      <span className="absolute right-3.5 top-3.5 inline-flex shrink-0 items-center rounded-full border border-white/25 bg-white/15 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur">
        {shortCode}
      </span>

      <span className="absolute left-4 top-16 h-10 w-px rounded-full bg-gradient-to-b from-gold-300 via-gold-400/60 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950 via-navy-950/90 to-transparent px-4 pb-4 pt-16">
        <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-gold-200/90">
          Skripsi · {tahun}
        </p>
        <h3 className="mt-1.5 line-clamp-4 font-display text-[13px] font-extrabold leading-snug text-white sm:text-sm">
          {judul}
        </h3>
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[8px] font-semibold text-white/65">
          <span className="truncate">{authorName}</span>
          <span className="shrink-0 tabular-nums">{tahun}</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
    </div>
  );
}
