import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { formatNumber } from "../../lib/format";

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  itemLabel = "data",
  className,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}) {
  if (total <= 0) return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (value) =>
      value === 1 ||
      value === pageCount ||
      Math.abs(value - current) <= 1,
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t border-navy-50 pt-4 sm:flex-row",
        className,
      )}
    >
      <p className="text-xs text-ink-soft">
        Menampilkan{" "}
        <span className="font-semibold text-ink">
          {formatNumber(start)}–{formatNumber(end)}
        </span>{" "}
        dari <span className="font-semibold text-ink">{formatNumber(total)}</span>{" "}
        {itemLabel}
      </p>
      <nav className="flex items-center gap-1" aria-label="Navigasi halaman">
        <button
          type="button"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          className="grid size-11 place-items-center rounded-input text-ink-soft transition hover:bg-navy-50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((value, index) => {
          const previous = pages[index - 1];
          const showEllipsis = previous !== undefined && value - previous > 1;
          return (
            <span key={value} className="flex items-center gap-1">
              {showEllipsis ? (
                <span className="px-1 text-xs text-ink-faint" aria-hidden="true">
                  …
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => onPageChange(value)}
                className={cn(
                  "grid size-11 place-items-center rounded-input text-xs font-semibold transition",
                  value === current
                    ? "bg-navy-800 text-white shadow-soft"
                    : "text-ink-soft hover:bg-navy-50 hover:text-ink",
                )}
                aria-current={value === current ? "page" : undefined}
                aria-label={`Halaman ${value}`}
              >
                {value}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= pageCount}
          className="grid size-11 place-items-center rounded-input text-ink-soft transition hover:bg-navy-50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}
