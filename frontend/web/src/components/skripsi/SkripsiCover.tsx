import { useEffect, useState } from "react";
import { GraduationCap, ImageOff } from "lucide-react";
import { BI, SA } from "../../constants";
import type { PeminatanValue } from "../../types";
import { cn } from "../../lib/cn";
import { resolveFileUrl } from "../../lib/files";
import { getGeneratedCover } from "../../lib/imagery";

type CoverTone = "bi" | "sa" | "neutral";

function isImageFile(value: string | null | undefined): boolean {
  if (!value) return false;
  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(value.trim());
}

function getCoverCandidate(
  coverUrl: string | null | undefined,
  fileUrl: string | null | undefined,
): string | null {
  const explicitCover = coverUrl?.trim();
  if (explicitCover) return explicitCover;
  if (isImageFile(fileUrl)) return fileUrl?.trim() ?? null;
  return null;
}

export function SkripsiCover({
  id,
  judul,
  peminatan,
  tahun,
  coverUrl,
  fileUrl,
  className,
  priority = false,
}: {
  id: number;
  judul: string;
  peminatan: PeminatanValue;
  tahun: number | string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  className?: string;
  priority?: boolean;
}) {
  const generated = getGeneratedCover(id, peminatan);
  const candidate = getCoverCandidate(coverUrl, fileUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    setLoaded(false);
  }, [candidate]);

  const tone: CoverTone =
    peminatan === BI ? "bi" : peminatan === SA ? "sa" : "neutral";

  const gradientClass =
    tone === "bi"
      ? "from-navy-900 via-navy-800 to-bi-700"
      : tone === "sa"
        ? "from-navy-900 via-navy-800 to-sa-700"
        : "from-navy-900 via-navy-800 to-navy-600";

  const shortCode = peminatan === BI ? "BI" : peminatan === SA ? "SA" : "SKRIPSI";
  const explicitSrc = candidate ? resolveFileUrl(candidate) : null;
  const showImage = !imageFailed;
  const imageSrc = explicitSrc ?? generated.src;

  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden bg-navy-900",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          gradientClass,
        )}
        aria-hidden="true"
      />

      {showImage ? (
        <>
          <img
            src={generated.blurDataUrl}
            alt=""
            width={generated.width}
            height={generated.height}
            aria-hidden="true"
            className={cn(
              "absolute inset-0 size-full scale-110 object-cover blur-xl transition-opacity duration-500",
              loaded ? "opacity-0" : "opacity-100",
            )}
          />
          <img
            src={imageSrc}
            {...(!explicitSrc
              ? {
                  srcSet: generated.srcSet,
                  sizes: "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px",
                }
              : {})}
            alt={`Sampul skripsi: ${judul}`}
            width={generated.width}
            height={generated.height}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onLoad={() => setLoaded(true)}
            onError={() => setImageFailed(true)}
            className={cn(
              "absolute inset-0 size-full object-cover transition-[transform,opacity] duration-700 ease-out group-hover:scale-105",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white/50">
          <div className="flex flex-col items-center gap-2">
            <ImageOff className="size-8" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
              Sampul tidak tersedia
            </span>
          </div>
        </div>
      )}

      {/* Overlay navy agar judul dan badge tetap terbaca (WCAG AA). */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-950/75 via-navy-950/10 to-navy-950/75"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.16em] text-navy-800 shadow-sm">
          <img src="/favicon.svg" alt="" width={14} height={14} className="size-3.5 rounded-[3px]" />
          UNIRA
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full border border-white/25 bg-white/15 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur">
          {shortCode}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-white/70">
          Skripsi · {tahun}
        </p>
        <h3 className="mt-1 line-clamp-3 font-display text-[13px] font-extrabold leading-snug text-white">
          {judul}
        </h3>
        <div className="mt-2 flex items-center gap-1.5 text-[8px] font-semibold text-white/65">
          <GraduationCap className="size-3" />
          Informatika · Fakultas Teknik
        </div>
      </div>
    </div>
  );
}
