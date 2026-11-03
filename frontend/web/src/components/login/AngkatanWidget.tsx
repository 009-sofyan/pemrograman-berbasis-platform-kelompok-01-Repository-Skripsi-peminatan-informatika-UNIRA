import { useMemo } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import type { PemetaanAngkatan } from "../../types";
import { formatNumber } from "../../lib/format";
import { cn } from "../../lib/cn";

function parseYear(value: string): number {
  const match = value.match(/\d{2,4}/);
  if (!match?.[0]) return 0;
  const year = Number(match[0]);
  if (!Number.isFinite(year)) return 0;
  return year < 100 ? 2000 + year : year;
}

function ChartBar({
  value,
  maxValue,
  tone,
  delay,
  label,
}: {
  value: number;
  maxValue: number;
  tone: "bi" | "sa";
  delay: number;
  label: string;
}) {
  const height = value > 0 ? Math.max(4, (value / maxValue) * 100) : 0;

  return (
    <div className="relative flex h-full w-1/2 max-w-[18px] items-end">
      <div
        style={{ height: `${height}%`, animationDelay: `${delay}ms` }}
        className={cn(
          "relative w-full origin-bottom rounded-t-[5px] motion-safe:animate-[bar-grow_500ms_cubic-bezier(0.22,1,0.36,1)_both]",
          tone === "bi"
            ? "bg-gradient-to-t from-bi-600 to-bi-400"
            : "bg-gradient-to-t from-sa-600 to-sa-400",
        )}
        title={`${label}: ${formatNumber(value)} mahasiswa`}
      >
        {value > 0 ? (
          <span className="absolute inset-x-0 -top-3.5 text-center text-[8px] font-bold tabular-nums text-white/70">
            {formatNumber(value)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Widget pemetaan angkatan memakai data publik GET /api/pemetaan.
 * Tidak pernah melempar error ke halaman login: kegagalan hanya tampil
 * sebagai baris kecil dengan tombol "Coba lagi".
 */
export function AngkatanWidget({
  data,
  loading,
  error,
  onRetry,
  maxYears = 5,
  className,
}: {
  data: PemetaanAngkatan[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  maxYears?: number;
  className?: string;
}) {
  const rows = useMemo(() => {
    return [...data]
      .filter((row) => parseYear(row.angkatan) > 0)
      .sort((a, b) => parseYear(a.angkatan) - parseYear(b.angkatan))
      .slice(-maxYears);
  }, [data, maxYears]);

  const maxValue = useMemo(
    () => Math.max(1, ...rows.flatMap((row) => [row.bi, row.sa])),
    [rows],
  );

  const latest = rows.at(-1);
  const latestTotal = latest ? latest.bi + latest.sa : 0;
  const biPercent = latestTotal > 0 ? Math.round((latest!.bi / latestTotal) * 100) : 0;
  const saPercent = latestTotal > 0 ? 100 - biPercent : 0;
  const summary = latest
    ? latestTotal > 0
      ? `BI ${biPercent}% · SA ${saPercent}% pada ${latest.angkatan}`
      : `Belum ada pemilihan pada ${latest.angkatan}`
    : "Data belum tersedia";
  const yearLabel =
    rows.length > 0 ? `${rows.length} tahun terakhir` : `${maxYears} tahun terakhir`;

  return (
    <section
      className={cn(
        "rounded-card border border-white/15 bg-white/[0.07] p-4 shadow-elevated backdrop-blur-xl [@media(max-height:760px)]:p-3.5",
        className,
      )}
      aria-label="Pemetaan angkatan mahasiswa"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gold-400/15 text-gold-300 ring-1 ring-gold-300/25">
            <BarChart3 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">Pemetaan Angkatan</p>
            <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">
              BI vs SA · {yearLabel}
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-white/50">
          <span className="size-1.5 rounded-full bg-sa-400" aria-hidden="true" />
          Data publik
        </span>
      </div>

      {loading ? (
        <div
          className="mt-3 flex h-24 items-end justify-center gap-1.5 pt-4"
          aria-label="Memuat data pemetaan angkatan"
          aria-busy="true"
        >
          {[54, 82, 66, 92, 72].slice(0, maxYears).map((height, index) => (
            <div key={index} className="flex max-w-[72px] flex-1 items-end justify-center gap-1">
              <div
                className="w-1/2 max-w-[18px] animate-pulse rounded-t-[5px] bg-white/10"
                style={{ height: `${height * 0.62}%` }}
              />
              <div
                className="w-1/2 max-w-[18px] animate-pulse rounded-t-[5px] bg-white/10"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-3 flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-3 text-center">
          <p className="text-[10px] leading-relaxed text-white/55">
            Grafik gagal dimuat. Login tetap bisa digunakan.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-gold-200 transition hover:bg-white/15 hover:text-gold-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            <RefreshCw className="size-3" />
            Coba lagi
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-3 flex h-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-3 text-center">
          <BarChart3 className="size-5 text-white/25" aria-hidden="true" />
          <p className="text-[11px] font-semibold text-white/70">Data belum tersedia</p>
          <p className="text-[9px] leading-relaxed text-white/40">
            Pemetaan tampil setelah data mahasiswa terisi.
          </p>
        </div>
      ) : (
        <>
          <div
            key={rows.map((row) => `${row.angkatan}:${row.bi}:${row.sa}`).join("|")}
            className="mt-3 flex h-24 items-end justify-center gap-1.5 pt-4"
            role="img"
            aria-label={`Grafik pemetaan angkatan. ${summary}.`}
          >
            {rows.map((row, index) => (
              <div key={row.angkatan} className="flex h-full min-w-0 max-w-[72px] flex-1 flex-col justify-end">
                <div className="flex h-full items-end justify-center gap-1">
                  <ChartBar
                    value={row.bi}
                    maxValue={maxValue}
                    tone="bi"
                    delay={index * 60}
                    label={`Business Intelligence ${row.angkatan}`}
                  />
                  <ChartBar
                    value={row.sa}
                    maxValue={maxValue}
                    tone="sa"
                    delay={index * 60 + 30}
                    label={`Smart Agriculture ${row.angkatan}`}
                  />
                </div>
                <span className="mt-1.5 text-center text-[9px] font-semibold tabular-nums text-white/50">
                  {row.angkatan}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-white/10 pt-2">
            <div className="flex items-center gap-3 text-[9px] font-semibold text-white/55">
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-bi-400" aria-hidden="true" />
                BI
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-sa-400" aria-hidden="true" />
                SA
              </span>
            </div>
            <p className="truncate text-[10px] font-semibold text-white/70">{summary}</p>
          </div>
        </>
      )}
    </section>
  );
}
