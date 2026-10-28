import { GraduationCap } from "lucide-react";

export function LoadingScreen({ label = "Menyiapkan workspace…" }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <span className="absolute inset-0 animate-pulse-glow rounded-3xl bg-primary-400/40 blur-xl" />
          <span className="relative grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-primary-500 to-violet-600 text-white shadow-glow">
            <GraduationCap className="size-8" strokeWidth={2} />
          </span>
        </div>
        <p className="mt-6 text-sm font-semibold text-ink">Repository Skripsi UNIRA</p>
        <p className="mt-1 text-xs text-ink-soft">{label}</p>
        <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-primary-500 to-violet-500" />
        </div>
      </div>
    </div>
  );
}
