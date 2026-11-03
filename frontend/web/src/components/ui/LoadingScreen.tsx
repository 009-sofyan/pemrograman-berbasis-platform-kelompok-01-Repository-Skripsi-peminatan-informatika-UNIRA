import { GraduationCap } from "lucide-react";

export function LoadingScreen({ label = "Menyiapkan halaman…" }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6">
      <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
        <div className="relative">
          <span className="absolute inset-0 animate-pulse-glow rounded-panel bg-violet-500/30 blur-xl" />
          <span className="node-badge relative grid size-16 place-items-center rounded-2xl text-cyan-100 shadow-elevated ring-1 ring-white/15">
            <GraduationCap className="size-8" strokeWidth={2} />
          </span>
        </div>
        <p className="mt-6 font-display text-sm font-bold text-ink">
          Repository Skripsi UNIRA
        </p>
        <p className="mt-1 text-xs text-ink-soft">{label}</p>
        <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-300" />
        </div>
      </div>
    </div>
  );
}
