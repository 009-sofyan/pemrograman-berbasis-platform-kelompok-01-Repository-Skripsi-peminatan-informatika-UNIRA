import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  Info,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  Sprout,
  Target,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useApiQuery } from "../hooks/useApiQuery";
import { peminatanService } from "../services/peminatanService";
import { pemetaanService } from "../services/dashboardService";
import { BI, CHART_COLORS, SA, getPeminatanMeta } from "../constants";
import type { PeminatanValue } from "../types";
import { getApiErrorMessage } from "../lib/errors";
import { formatNumber, percent } from "../lib/format";
import { cn } from "../lib/cn";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import {
  PeminatanDonut,
  PeminatanLegend,
  type DonutDatum,
} from "../components/charts/PeminatanDonut";

type PilihanPeminatan = "Business Intelligence" | "Smart Agriculture" | "";

export default function PeminatanPage() {
  useDocumentTitle("Peminatan Riset");
  const { user } = useAuth();
  const toast = useToast();

  const saya = useApiQuery(() => peminatanService.getSaya(), []);
  const pemetaan = useApiQuery(() => pemetaanService.get(), []);

  const [choice, setChoice] = useState<PilihanPeminatan>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const aggregation = useMemo(() => {
    let bi = 0;
    let sa = 0;
    let unset = 0;
    let other = 0;

    for (const row of pemetaan.data?.data ?? []) {
      const total = Number(row.totalMahasiswa);
      if (!row.peminatan) {
        unset += total;
      } else if (row.peminatan === BI) {
        bi += total;
      } else if (row.peminatan === SA) {
        sa += total;
      } else {
        other += total;
      }
    }

    const total = bi + sa + unset + other;
    return { bi, sa, unset, other, total, memilih: bi + sa + other };
  }, [pemetaan.data]);

  const donutData = useMemo<DonutDatum[]>(() => {
    const data: DonutDatum[] = [
      {
        name: "Business Intelligence",
        short: "BI",
        value: aggregation.bi,
        color: CHART_COLORS.sky,
      },
      {
        name: "Smart Agriculture",
        short: "SA",
        value: aggregation.sa,
        color: CHART_COLORS.mint,
      },
    ];

    if (aggregation.unset > 0) {
      data.push({
        name: "Belum memilih",
        short: "—",
        value: aggregation.unset,
        color: CHART_COLORS.slate,
      });
    }

    if (aggregation.other > 0) {
      data.push({
        name: "Peminatan lain (data lama)",
        short: "Lain",
        value: aggregation.other,
        color: CHART_COLORS.violet,
      });
    }

    return data;
  }, [aggregation]);

  if (!user) return null;

  const currentPeminatan = saya.data?.data.peminatan ?? null;
  const hasPeminatan = Boolean(currentPeminatan);
  const coverage = percent(aggregation.memilih, aggregation.total);

  const requestSave = () => {
    if (!choice) {
      setChoiceError("Pilih salah satu peminatan terlebih dahulu.");
      return;
    }
    setChoiceError(null);
    setConfirmOpen(true);
  };

  const saveChoice = async () => {
    if (!choice) return;

    setSaving(true);
    setChoiceError(null);

    try {
      const response = await peminatanService.pilih({ peminatan: choice });
      saya.setData((prev) =>
        prev
          ? {
              ...prev,
              data: { ...prev.data, peminatan: response.peminatan },
            }
          : prev,
      );
      setConfirmOpen(false);
      setChoice("");
      toast.success(
        "Peminatan berhasil dipilih",
        `${response.peminatan} kini tercatat sebagai peminatan risetmu.`,
      );
      pemetaan.refetch();
    } catch (err) {
      const message = getApiErrorMessage(err);
      setChoiceError(message);

      if (message.toLowerCase().includes("tidak dapat diubah")) {
        setLocked(true);
        toast.warning("Peminatan sudah final", message);
        saya.refetch();
      } else {
        toast.error("Gagal menyimpan peminatan", message);
      }

      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Peminatan riset"
        title="Pemilihan Peminatan"
        description="Tentukan arah risetmu pada Business Intelligence atau Smart Agriculture. Pilihan ini menjadi dasar pemetaan peminatan prodi Informatika."
        icon={<Target className="size-3" />}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<RefreshCw />}
              onClick={() => {
                saya.refetch();
                pemetaan.refetch();
              }}
              loading={saya.loading || pemetaan.loading}
            >
              Muat ulang
            </Button>
            <Link to="/repository">
              <Button variant="outline" iconRight={<ArrowRight />}>
                Lihat referensi
              </Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader
            title="Peminatan riset kamu"
            description="Pilihan peminatan bersifat final dan hanya dapat ditentukan satu kali."
            icon={<Sparkles className="size-5" />}
            action={
              saya.loading ? (
                <Skeleton className="h-5 w-20" />
              ) : hasPeminatan ? (
                <Badge tone="mint" size="xs" dot>
                  Sudah dipilih
                </Badge>
              ) : (
                <Badge tone="amber" size="xs" dot>
                  Belum dipilih
                </Badge>
              )
            }
          />

          {saya.loading ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : saya.error ? (
            <div className="mt-5">
              <EmptyState
                compact
                icon={<Info className="size-5" />}
                title="Data peminatan belum dapat dimuat"
                description={saya.error}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw />}
                    onClick={saya.refetch}
                  >
                    Coba lagi
                  </Button>
                }
              />
            </div>
          ) : hasPeminatan ? (
            <SelectedPeminatan
              value={currentPeminatan}
              nim={saya.data?.data.nim}
              programStudi={saya.data?.data.programStudi}
            />
          ) : locked ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <LockKeyhole className="size-4" />
                Peminatan sudah pernah dipilih
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-amber-800/80">
                Server menolak perubahan karena peminatan bersifat final. Hubungi
                Tendik atau Kaprodi jika terjadi kesalahan data.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">
                Pilih peminatan yang paling sesuai dengan topik risetmu. Setelah
                disimpan, pilihan{" "}
                <strong className="text-ink">tidak dapat diubah</strong> dari halaman
                ini.
              </p>

              <div className="mt-4 space-y-2.5">
                <ChoiceOption
                  active={choice === BI}
                  title="Business Intelligence"
                  short="BI"
                  description="Analitik data, machine learning, sistem pendukung keputusan, dan transformasi digital."
                  icon={<BrainCircuit className="size-5" />}
                  tone="sky"
                  onClick={() => {
                    setChoice(BI);
                    setChoiceError(null);
                  }}
                />
                <ChoiceOption
                  active={choice === SA}
                  title="Smart Agriculture"
                  short="SA"
                  description="Teknologi pertanian presisi, IoT, monitoring lingkungan, dan keberlanjutan pangan."
                  icon={<Sprout className="size-5" />}
                  tone="mint"
                  onClick={() => {
                    setChoice(SA);
                    setChoiceError(null);
                  }}
                />
              </div>

              {choiceError ? (
                <p className="mt-3 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2.5 text-[11px] text-coral-700">
                  {choiceError}
                </p>
              ) : null}

              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
                  <Info className="mt-0.5 size-3 shrink-0 text-amber-500" />
                  Data akademik (NIM &amp; prodi) harus sudah dilengkapi Tendik.
                </p>
                <Button
                  size="sm"
                  onClick={requestSave}
                  disabled={!choice}
                  icon={<CheckCircle2 />}
                >
                  Simpan peminatan
                </Button>
              </div>
            </>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Pemetaan peminatan prodi"
            description="Distribusi mahasiswa Informatika pada tiap kategori peminatan."
            icon={<Users className="size-5" />}
            action={
              <Badge tone="indigo" size="xs" dot>
                {formatNumber(aggregation.total)} mahasiswa
              </Badge>
            }
          />

          {pemetaan.loading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          ) : pemetaan.error ? (
            <div className="mt-4">
              <EmptyState
                compact
                icon={<Info className="size-5" />}
                title="Pemetaan belum dapat dimuat"
                description={pemetaan.error}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw />}
                    onClick={pemetaan.refetch}
                  >
                    Coba lagi
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <PeminatanDonut
                data={donutData}
                total={aggregation.total}
                height={200}
              />
              <PeminatanLegend data={donutData} />
              <div className="grid grid-cols-2 gap-2">
                <MiniStat
                  label="Business Intelligence"
                  short="BI"
                  value={aggregation.bi}
                  tone="sky"
                  icon={<BrainCircuit className="size-4" />}
                />
                <MiniStat
                  label="Smart Agriculture"
                  short="SA"
                  value={aggregation.sa}
                  tone="mint"
                  icon={<Sprout className="size-4" />}
                />
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400">
                {aggregation.total === 0
                  ? "Data pemetaan akan tampil setelah mahasiswa memiliki data akademik."
                  : `${coverage}% mahasiswa sudah menentukan peminatan. Data diperbarui otomatis saat halaman dimuat.`}
              </p>
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <PeminatanInfo
          title="Business Intelligence"
          short="BI"
          tone="sky"
          description="Fokus pada pengolahan data menjadi wawasan bisnis: analitik, machine learning, dan sistem pendukung keputusan."
          topics={["Data Analytics", "Machine Learning", "Decision Support", "Digital Transformation"]}
        />
        <PeminatanInfo
          title="Smart Agriculture"
          short="SA"
          tone="mint"
          description="Fokus pada penerapan teknologi untuk pertanian presisi, pemantauan lingkungan, dan keberlanjutan pangan."
          topics={["Precision Farming", "IoT Sensor", "Environmental Monitoring", "Sustainability"]}
        />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void saveChoice()}
        title="Simpan peminatan ini?"
        description={`Kamu memilih ${choice || "—"}.`}
        confirmLabel="Ya, simpan permanen"
        tone="amber"
        loading={saving}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11px] leading-relaxed text-amber-800">
            <Info className="mt-0.5 size-4 shrink-0" />
            Peminatan hanya dapat dipilih <strong>satu kali</strong>. Pastikan pilihan
            sudah sesuai dengan rencana topik skripsi sebelum melanjutkan.
          </div>
          <p className="text-xs leading-relaxed text-ink-soft">
            Setelah tersimpan, data pemetaan prodi akan diperbarui dan perubahan hanya
            dapat dilakukan melalui Tendik.
          </p>
        </div>
      </ConfirmDialog>
    </div>
  );
}

function SelectedPeminatan({
  value,
  nim,
  programStudi,
}: {
  value: PeminatanValue;
  nim?: string;
  programStudi?: string;
}) {
  const meta = getPeminatanMeta(value);
  const isSA = value === SA;

  return (
    <div
      className={cn(
        "mt-5 rounded-2xl border p-4",
        isSA
          ? "border-mint-200 bg-mint-50/60"
          : "border-sky-200 bg-sky-50/60",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1",
            isSA
              ? "text-mint-600 ring-mint-100"
              : "text-sky-600 ring-sky-100",
          )}
        >
          {isSA ? (
            <Sprout className="size-5" />
          ) : (
            <BrainCircuit className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.14em]",
              isSA ? "text-mint-600" : "text-sky-600",
            )}
          >
            {meta.short} · Peminatan kamu
          </p>
          <p className="mt-0.5 text-sm font-extrabold text-ink">{meta.label}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
            Pilihan ini sudah tercatat di server dan menjadi dasar pemetaan peminatan
            prodi.
          </p>
        </div>
        <CheckCircle2
          className={cn(
            "size-5 shrink-0",
            isSA ? "text-mint-500" : "text-sky-500",
          )}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-slate-100">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
            NIM
          </p>
          <p className="mt-0.5 text-xs font-bold text-ink">{nim ?? "—"}</p>
        </div>
        <div className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-slate-100">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Program studi
          </p>
          <p className="mt-0.5 text-xs font-bold text-ink">
            {programStudi ?? "—"}
          </p>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
        <LockKeyhole className="mt-0.5 size-3 shrink-0" />
        Perubahan hanya dapat dilakukan oleh Tendik melalui menu Data Mahasiswa.
      </p>
    </div>
  );
}

function ChoiceOption({
  active,
  title,
  short,
  description,
  icon,
  tone,
  onClick,
}: {
  active: boolean;
  title: string;
  short: string;
  description: string;
  icon: ReactNode;
  tone: "sky" | "mint";
  onClick: () => void;
}) {
  const tones = {
    sky: {
      active: "border-sky-300 bg-sky-50/70 ring-2 ring-sky-100",
      idle: "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/30",
      icon: "bg-sky-50 text-sky-600 ring-sky-100",
      check: "bg-sky-600 text-white",
    },
    mint: {
      active: "border-mint-300 bg-mint-50/70 ring-2 ring-mint-100",
      idle: "border-slate-200 bg-white hover:border-mint-200 hover:bg-mint-50/30",
      icon: "bg-mint-50 text-mint-600 ring-mint-100",
      check: "bg-mint-600 text-white",
    },
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition",
        active ? tones.active : tones.idle,
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl ring-1",
          tones.icon,
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-ink">{title}</span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
            {short}
          </span>
        </span>
        <span className="mt-1 block text-[10px] leading-relaxed text-ink-soft">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "mt-1 grid size-5 shrink-0 place-items-center rounded-full border transition",
          active
            ? cn("border-transparent", tones.check)
            : "border-slate-300 bg-white text-transparent",
        )}
      >
        <Check className="size-3" />
      </span>
    </button>
  );
}

function MiniStat({
  label,
  short,
  value,
  tone,
  icon,
}: {
  label: string;
  short: string;
  value: number;
  tone: "sky" | "mint";
  icon: ReactNode;
}) {
  const tones = {
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
    mint: "bg-mint-50 text-mint-600 ring-mint-100",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
      <div className="flex items-center gap-1.5">
        <span className={cn("grid size-6 place-items-center rounded-lg ring-1", tones)}>
          {icon}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {short}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-extrabold text-ink">{formatNumber(value)}</p>
      <p className="truncate text-[9px] text-slate-400" title={label}>
        {label}
      </p>
    </div>
  );
}

function PeminatanInfo({
  title,
  short,
  description,
  topics,
  tone,
}: {
  title: string;
  short: string;
  description: string;
  topics: string[];
  tone: "sky" | "mint";
}) {
  const tones = {
    sky: {
      card: "border-sky-100 bg-gradient-to-br from-sky-50 to-white",
      icon: "bg-sky-100 text-sky-600",
      label: "text-sky-600",
    },
    mint: {
      card: "border-mint-100 bg-gradient-to-br from-mint-50 to-white",
      icon: "bg-mint-100 text-mint-600",
      label: "text-mint-600",
    },
  }[tone];

  return (
    <div className={cn("rounded-2xl border p-5", tones.card)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            tones.icon,
          )}
        >
          {tone === "sky" ? (
            <BrainCircuit className="size-5" />
          ) : (
            <Sprout className="size-5" />
          )}
        </span>
        <div>
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.14em]",
              tones.label,
            )}
          >
            {short}
          </p>
          <h3 className="text-sm font-extrabold text-ink">{title}</h3>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">{description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {topics.map((topic) => (
          <span
            key={topic}
            className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/70"
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
}
