import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  GraduationCap,
  ImageIcon,
  Info,
  Sparkles,
} from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { BI, SA } from "../constants";
import { IMAGE_CREDITS } from "../lib/imagery";
import { formatNumber } from "../lib/format";
import { cn } from "../lib/cn";
import { Logo } from "../components/layout/Logo";
import { Badge } from "../components/ui/Badge";

const GROUPS = [
  {
    tone: "bi" as const,
    label: BI,
    short: "BI",
    description:
      "Visualisasi data, analitik, dan pengambilan keputusan yang mewakili peminatan Business Intelligence.",
    icon: ImageIcon,
    accent: "from-bi-500 to-violet-400",
  },
  {
    tone: "sa" as const,
    label: SA,
    short: "SA",
    description:
      "Pertanian presisi, irigasi, dan teknologi hijau yang mewakili peminatan Smart Agriculture.",
    icon: Sparkles,
    accent: "from-sa-500 to-teal-400",
  },
];

export default function ImageCreditsPage() {
  useDocumentTitle("Kredit Gambar");
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="rounded-input focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            aria-label="Kembali ke beranda Repository Skripsi UNIRA"
          >
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex h-11 items-center gap-2 rounded-input border border-navy-100 bg-white px-3.5 text-xs font-bold text-ink-soft shadow-soft transition hover:border-navy-200 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <ArrowLeft className="size-4" />
              Beranda
            </Link>
            <Link
              to="/login"
              className="hidden h-11 items-center gap-2 rounded-input bg-navy-800 px-4 text-xs font-bold text-white shadow-soft transition hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:inline-flex"
            >
              Masuk
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-hero-navy px-4 py-14 text-white sm:px-6 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-hero-glow opacity-80"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-dot-grid bg-[size:24px_24px] opacity-20"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold-400/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 left-1/4 size-72 rounded-full bg-sa-400/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto w-full max-w-[1280px]">
            <div className="max-w-3xl">
              <Badge
                tone="gold"
                size="sm"
                className="border border-white/10 bg-white/10 text-gold-200 ring-0 backdrop-blur"
              >
                <Camera className="size-3.5" />
                Transparansi aset visual
              </Badge>
              <h1 className="mt-5 font-display text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-[56px]">
                Kredit Gambar
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                Seluruh foto sampul katalog berasal dari Pexels dan sudah
                diverifikasi satu per satu. Tidak ada wajah, merek dagang, atau
                logo yang ditampilkan. Setiap berkas dikonversi menjadi WebP lokal
                berukuran 320, 480, dan 640 piksel dengan rasio 3:4.
              </p>
            </div>

            <dl className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {[
                {
                  label: "Foto terverifikasi",
                  value: formatNumber(IMAGE_CREDITS.length),
                  hint: "Empat untuk BI, empat untuk SA",
                },
                {
                  label: "Sumber",
                  value: "Pexels",
                  hint: "Lisensi Pexels gratis dipakai",
                },
                {
                  label: "Ukuran maksimal",
                  value: "≤ 80 KB",
                  hint: "WebP responsif 320/480/640 px",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-card border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                    {item.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-[28px] font-extrabold leading-none">
                    {item.value}
                  </dd>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-white/50">
                    {item.hint}
                  </p>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16">
          <div className="space-y-14">
            {GROUPS.map((group) => {
              const items = IMAGE_CREDITS.filter(
                (credit) => credit.tone === group.tone,
              );
              const Icon = group.icon;

              return (
                <section key={group.tone} aria-labelledby={`grup-${group.tone}`}>
                  <div className="flex flex-col gap-4 border-b border-navy-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "grid size-11 shrink-0 place-items-center rounded-input bg-gradient-to-br text-white shadow-soft",
                          group.accent,
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2
                            id={`grup-${group.tone}`}
                            className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-ink"
                          >
                            {group.label}
                          </h2>
                          <Badge tone={group.tone} size="xs">
                            {items.length} foto
                          </Badge>
                        </div>
                        <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-soft">
                          {group.description}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                      Kode {group.short}-01 — {group.short}-0{items.length}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {items.map((credit, index) => (
                      <motion.div
                        key={`${credit.tone}-${credit.variant}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.55,
                          delay: reduceMotion ? 0 : index * 0.06,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="h-full"
                      >
                        <article className="group flex h-full flex-col overflow-hidden rounded-card border border-navy-100/70 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
                          <div className="relative aspect-[3/4] overflow-hidden bg-navy-100">
                            <img
                              src={`/imagery/covers/${credit.tone}-${credit.variant}-320.webp`}
                              srcSet={`/imagery/covers/${credit.tone}-${credit.variant}-320.webp 320w, /imagery/covers/${credit.tone}-${credit.variant}-480.webp 480w, /imagery/covers/${credit.tone}-${credit.variant}-640.webp 640w`}
                              sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
                              alt={credit.description}
                              width={320}
                              height={427}
                              loading={index === 0 ? "eager" : "lazy"}
                              decoding="async"
                              className="size-full object-cover transition duration-700 group-hover:scale-[1.04]"
                            />
                            <div
                              className="absolute inset-0 bg-gradient-to-t from-navy-950/55 via-transparent to-transparent"
                              aria-hidden="true"
                            />
                            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-navy-800 shadow-soft backdrop-blur">
                              <Camera className="size-3" />
                              {group.short}-0{credit.variant}
                            </span>
                          </div>

                          <div className="flex flex-1 flex-col p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                              {group.short}-0{credit.variant}
                            </p>
                            <p className="mt-1.5 flex-1 text-xs font-semibold leading-relaxed text-ink">
                              {credit.description}
                            </p>
                            <p className="mt-3 text-[11px] text-ink-soft">
                              Foto oleh{" "}
                              <span className="font-bold text-ink">
                                {credit.photographer}
                              </span>
                            </p>
                            <a
                              href={credit.sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="mt-3 inline-flex h-11 items-center justify-between gap-2 rounded-input border border-navy-100 bg-canvas/70 px-3 text-[11px] font-bold text-ink-soft transition hover:border-bi-200 hover:bg-bi-50/60 hover:text-bi-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                            >
                              Lihat sumber di Pexels
                              <ArrowUpRight className="size-3.5" />
                            </a>
                          </div>
                        </article>
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-14 flex flex-col gap-3 rounded-panel border border-bi-100 bg-gradient-to-r from-bi-50/80 via-white to-sa-50/60 p-5 sm:flex-row sm:items-start sm:p-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-input bg-white text-bi-600 shadow-soft ring-1 ring-bi-100">
              <Info className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink">Catatan penggunaan</h2>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ink-soft">
                Foto digunakan sebagai sampul katalog dan telah diunduh,
                dikompresi, serta dipotong ke rasio 3:4 tanpa mengubah makna
                visualnya. Hak cipta tetap milik fotografer. Silakan kunjungi
                halaman sumber untuk informasi lisensi lengkap. Materi visual tidak
                menampilkan wajah, merek, atau logo pihak ketiga.
              </p>
              <a
                href="https://www.pexels.com/license/"
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-[11px] font-bold text-bi-700 transition hover:text-bi-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                Baca lisensi Pexels
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-navy-100/70 bg-white/70 py-8">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-3 px-4 text-[10px] text-ink-faint sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Repository Skripsi UNIRA. Hak cipta karya milik penulis.</p>
          <p className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5" />
            Fakultas Teknik · Program Studi Informatika
          </p>
        </div>
      </footer>
    </div>
  );
}
