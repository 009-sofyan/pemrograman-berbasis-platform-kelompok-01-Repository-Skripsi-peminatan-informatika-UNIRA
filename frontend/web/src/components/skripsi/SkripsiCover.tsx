import { useEffect, useState } from "react";
import type { PeminatanValue } from "../../types";
import { cn } from "../../lib/cn";
import { resolveFileUrl } from "../../lib/files";
import { GeneratedCover } from "./GeneratedCover";

/**
 * Urutan sampul: unggahan mahasiswa (coverUrl) -> GeneratedCover lokal.
 * Tidak ada permintaan gambar eksternal; kegagalan muat selalu jatuh ke
 * generator deterministik agar kartu tidak pernah kosong.
 */
export function SkripsiCover({
  id,
  judul,
  peminatan,
  tahun,
  author,
  coverUrl,
  className,
  priority = false,
}: {
  id: number;
  judul: string;
  peminatan: PeminatanValue;
  tahun: number | string;
  author?: string | null;
  coverUrl?: string | null;
  className?: string;
  priority?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [coverUrl]);

  const src = coverUrl ? resolveFileUrl(coverUrl) : null;

  if (!src || imageFailed) {
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
        src={src}
        alt={`Sampul skripsi: ${judul}`}
        width={600}
        height={800}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={() => setImageFailed(true)}
        className="size-full object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
        aria-hidden="true"
      />
    </div>
  );
}
