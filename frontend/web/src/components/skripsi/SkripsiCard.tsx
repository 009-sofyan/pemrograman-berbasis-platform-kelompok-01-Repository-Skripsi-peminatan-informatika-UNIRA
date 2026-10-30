import {
  BadgeCheck,
  CalendarDays,
  Eye,
  FileText,
} from "lucide-react";
import type { Skripsi } from "../../types";
import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { PeminatanBadge } from "../ui/PeminatanBadge";
import { SkripsiCover } from "./SkripsiCover";
import { SkripsiPdfButton } from "./SkripsiPdfButton";

export function SkripsiCard({
  item,
  onOpen,
}: {
  item: Skripsi;
  onOpen: () => void;
}) {
  const authorName = item.namaMahasiswa ?? "Mahasiswa Informatika";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-primary-200/80 hover:shadow-card">
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400"
        aria-label={`Lihat detail dan abstrak skripsi: ${item.judul}`}
      >
        <SkripsiCover
          judul={item.judul}
          peminatan={item.peminatan}
          tahun={item.tahun}
          coverUrl={item.coverUrl}
          fileUrl={item.fileUrl}
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/0 via-transparent to-transparent transition duration-300 group-hover:from-slate-950/15" />
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <PeminatanBadge value={item.peminatan} size="xs" />
          <Badge tone="mint" size="xs">
            <BadgeCheck className="size-3" />
            Disetujui
          </Badge>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <CalendarDays className="size-3" />
            {item.tahun}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-3 min-h-[4.15rem] text-[13.5px] font-extrabold leading-relaxed text-ink transition group-hover:text-primary-700">
          {item.judul}
        </h3>

        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/75 p-3">
          <Avatar name={authorName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-extrabold text-ink">
              {authorName}
            </p>
            <p className="mt-0.5 text-[9.5px] font-semibold text-slate-400">
              NIM {item.nim}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            size="sm"
            icon={<Eye />}
            onClick={onOpen}
            className="h-9 min-w-0 flex-1 whitespace-nowrap px-2.5 text-[10px]"
          >
            Detail &amp; Abstrak
          </Button>

          {item.fileUrl ? (
            <SkripsiPdfButton
              id={item.id}
              title={item.judul}
              variant="secondary"
              size="sm"
              label="Unduh PDF"
              className="h-9 shrink-0 whitespace-nowrap px-2.5 text-[10px]"
            />
          ) : (
            <button
              type="button"
              disabled
              title="Berkas PDF belum tersedia"
              className="inline-flex h-9 shrink-0 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2.5 text-[10px] font-semibold text-slate-300"
            >
              <FileText className="size-3.5" />
              Unduh PDF
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
