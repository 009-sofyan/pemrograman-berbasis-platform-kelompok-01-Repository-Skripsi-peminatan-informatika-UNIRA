import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { BI, SA } from "../../constants";
import type { PeminatanValue } from "../../types";
import { cn } from "../../lib/cn";
import { resolveFileUrl } from "../../lib/files";

type CoverTone = "bi" | "sa" | "neutral";

interface CoverTheme {
  background: string;
  accent: string;
  glow: string;
}

const COVER_THEMES: Record<CoverTone, CoverTheme> = {
  bi: {
    background:
      "bg-[linear-gradient(145deg,#1e1b4b_0%,#312e81_30%,#4338ca_62%,#7c3aed_100%)]",
    accent: "from-indigo-200 via-violet-200 to-fuchsia-200",
    glow: "bg-violet-400/35",
  },
  sa: {
    background:
      "bg-[linear-gradient(145deg,#022c22_0%,#064e3b_30%,#047857_62%,#10b981_100%)]",
    accent: "from-emerald-200 via-mint-200 to-teal-200",
    glow: "bg-emerald-300/35",
  },
  neutral: {
    background:
      "bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_38%,#475569_72%,#64748b_100%)]",
    accent: "from-slate-200 via-slate-300 to-white",
    glow: "bg-slate-300/30",
  },
};

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
  judul,
  peminatan,
  tahun,
  coverUrl,
  fileUrl,
  className,
  priority = false,
}: {
  judul: string;
  peminatan: PeminatanValue;
  tahun: number | string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  className?: string;
  priority?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = resolveFileUrl(
    getCoverCandidate(coverUrl, fileUrl),
  );
  const tone: CoverTone =
    peminatan === BI ? "bi" : peminatan === SA ? "sa" : "neutral";
  const theme = COVER_THEMES[tone];
  const shortCode =
    peminatan === BI ? "BI" : peminatan === SA ? "SA" : "SKRIPSI";

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden bg-slate-900",
        className,
      )}
    >
      {showImage ? (
        <>
          <img
            src={imageUrl ?? undefined}
            alt={`Sampul skripsi: ${judul}`}
            loading={priority ? "eager" : "lazy"}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/65 via-transparent to-slate-950/40" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-4">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-white/85">
              <GraduationCap className="size-3 shrink-0" />
              <span className="truncate">UNIRA · {tahun}</span>
            </span>
            <span className="inline-flex shrink-0 items-center rounded-full border border-white/25 bg-white/15 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur">
              {shortCode}
            </span>
          </div>
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10" />
        </>
      ) : (
        <div className={cn("absolute inset-0", theme.background)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_88%_78%,rgba(255,255,255,0.13),transparent_34%)]" />
          <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(30deg,rgba(255,255,255,0.85)_1px,transparent_1px),linear-gradient(150deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div
            className={cn(
              "absolute -right-16 -top-20 size-48 rounded-full border border-white/20 blur-[0.5px]",
              theme.glow,
            )}
          />
          <div className="absolute -right-5 top-8 size-32 rounded-full border border-white/15" />
          <div className="absolute -left-14 bottom-12 size-40 rounded-full bg-white/[0.06] blur-2xl" />

          <span className="absolute -right-4 top-[26%] select-none text-[64px] font-extrabold leading-none tracking-[-0.08em] text-white/[0.065]">
            UNIRA
          </span>
          <GraduationCap
            className="absolute -bottom-7 -right-7 size-48 rotate-[-10deg] text-white/[0.075]"
            strokeWidth={1.1}
          />

          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
          <div className="absolute inset-y-0 left-3 w-px bg-white/20" />
          <div className="absolute inset-y-0 left-[13px] w-px bg-black/10" />

          <div className="relative flex h-full flex-col px-5 py-5 pl-7 sm:px-6 sm:pl-8">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-white/75">
                <GraduationCap className="size-3 shrink-0" />
                <span className="truncate">Universitas Madura</span>
              </span>
              <span className="inline-flex shrink-0 items-center rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/90 backdrop-blur">
                {shortCode}
              </span>
            </div>

            <div className="mt-7 sm:mt-9">
              <p className="text-[7.5px] font-bold uppercase tracking-[0.27em] text-white/55">
                Skripsi · {tahun}
              </p>
              <h3 className="mt-2.5 line-clamp-4 text-[15px] font-extrabold leading-[1.35] text-white sm:text-base">
                {judul}
              </h3>
              <div
                className={cn(
                  "mt-3 h-px w-12 bg-gradient-to-r",
                  theme.accent,
                )}
              />
            </div>

            <div className="mt-auto pt-5">
              <div className="flex items-end justify-between gap-2 border-t border-white/15 pt-3">
                <div className="min-w-0">
                  <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/55">
                    Program Studi
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-extrabold text-white">
                    Informatika
                  </p>
                  <p className="text-[7.5px] font-semibold text-white/60">
                    Fakultas Teknik
                  </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 text-white/90 shadow-sm backdrop-blur">
                  <GraduationCap className="size-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
