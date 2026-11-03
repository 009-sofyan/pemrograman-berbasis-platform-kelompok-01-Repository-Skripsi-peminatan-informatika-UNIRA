import { useEffect, useMemo, useState } from "react";
import type { PeminatanValue } from "../../types";
import { cn } from "../../lib/cn";
import { resolveCover, type CoverSkripsi } from "../../lib/cover";
import { useCoverCacheVersion } from "../../hooks/useCoverCacheVersion";
import { GeneratedCover } from "./GeneratedCover";

/**
 * Urutan sampul: cover API (coverUrl/cover_url) -> cover sementara lokal
 * (cover-temp:<id>) -> GeneratedCover. Jika sebuah gambar gagal dimuat,
 * komponen mencoba kandidat berikutnya agar tidak pernah menampilkan
 * gambar rusak.
 */
export function SkripsiCover({
  id,
  judul,
  peminatan,
  tahun,
  author,
  coverUrl,
  skripsi,
  className,
  priority = false,
}: {
  id: number;
  judul: string;
  peminatan: PeminatanValue;
  tahun: number | string;
  author?: string | null;
  coverUrl?: string | null;
  skripsi?: CoverSkripsi;
  className?: string;
  priority?: boolean;
}) {
  const cacheVersion = useCoverCacheVersion();
  const [attempt, setAttempt] = useState(0);

  const coverSource = useMemo<CoverSkripsi>(
    () => skripsi ?? { id, coverUrl },
    [skripsi, id, coverUrl],
  );

  useEffect(() => {
    setAttempt(0);
  }, [coverSource.id, coverSource.coverUrl, coverSource.cover_url, cacheVersion]);

  const src = resolveCover(coverSource, attempt);

  if (!src) {
    return (
      <GeneratedCover
        id={id}
        judul={judul}
        peminatan={peminatan}
        tahun={tahun}
        author={author}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden bg-navy-900",
        className,
      )}
    >
      <img
        key={attempt}
        src={src}
        alt={`Sampul skripsi: ${judul}`}
        width={600}
        height={800}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={() => setAttempt((value) => value + 1)}
        className="size-full object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
        aria-hidden="true"
      />
    </div>
  );
}
