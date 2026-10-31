import { CalendarDays, Eye, FileText } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatarForUser } from "../../lib/profile";
import type { Skripsi } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { PeminatanBadge } from "../ui/PeminatanBadge";
import { SkripsiCover } from "./SkripsiCover";
import { SkripsiPdfButton } from "./SkripsiPdfButton";

export function SkripsiCard({
  item,
  onOpen,
  priority = false,
}: {
  item: Skripsi;
  onOpen: () => void;
  priority?: boolean;
}) {
  const { user } = useAuth();
  const authorName = item.namaMahasiswa ?? "Mahasiswa Informatika";
  const avatarSrc = getAvatarForUser(user, {
    nama: item.namaMahasiswa,
    email: item.emailMahasiswa,
  });

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-panel border border-white/80 bg-white shadow-soft transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card focus-within:-translate-y-1 focus-within:shadow-card">
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400"
        aria-label={`Lihat detail dan abstrak skripsi: ${item.judul}`}
      >
        <SkripsiCover
          id={item.id}
          judul={item.judul}
          peminatan={item.peminatan}
          tahun={item.tahun}
          coverUrl={item.coverUrl}
          fileUrl={item.fileUrl}
          priority={priority}
        />
      </button>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <PeminatanBadge value={item.peminatan} size="xs" />
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-ink-faint">
            <CalendarDays className="size-3" aria-hidden="true" />
            {item.tahun}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-3 min-h-[4.2rem] font-display text-[13.5px] font-extrabold leading-relaxed text-ink transition-colors group-hover:text-primary-700">
          {item.judul}
        </h3>

        <div className="mt-4 flex items-center gap-2.5 rounded-input border border-navy-50 bg-canvas-soft/60 p-2.5">
          <Avatar name={authorName} src={avatarSrc} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-extrabold text-ink">{authorName}</p>
            <p className="mt-0.5 truncate text-[9.5px] font-semibold text-ink-faint">
              NIM {item.nim} · {item.tahun}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-navy-50 pt-4">
          <Button
            variant="outline"
            size="sm"
            icon={<Eye />}
            onClick={onOpen}
            className="min-w-0 flex-1 whitespace-nowrap px-2.5 text-[10px]"
          >
            Detail
          </Button>

          {item.fileUrl ? (
            <SkripsiPdfButton
              id={item.id}
              title={item.judul}
              mode="open"
              variant="secondary"
              size="sm"
              label="Akses PDF"
              className="shrink-0 whitespace-nowrap px-2.5 text-[10px]"
            />
          ) : (
            <button
              type="button"
              disabled
              title="Berkas PDF belum tersedia"
              className="inline-flex h-11 shrink-0 cursor-not-allowed items-center justify-center gap-1.5 rounded-input border border-navy-50 bg-canvas-soft px-2.5 text-[10px] font-semibold text-ink-faint"
            >
              <FileText className="size-3.5" aria-hidden="true" />
              Akses PDF
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
