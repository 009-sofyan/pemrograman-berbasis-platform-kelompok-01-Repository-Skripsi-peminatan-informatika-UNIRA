import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/cn";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "description">> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: LucideIcon; iconClass: string; barClass: string; ringClass: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "bg-mint-50 text-mint-600",
    barClass: "bg-mint-500",
    ringClass: "ring-mint-100",
  },
  error: {
    icon: XCircle,
    iconClass: "bg-coral-50 text-coral-600",
    barClass: "bg-coral-500",
    ringClass: "ring-coral-100",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "bg-amber-50 text-amber-600",
    barClass: "bg-amber-500",
    ringClass: "ring-amber-100",
  },
  info: {
    icon: Info,
    iconClass: "bg-primary-50 text-primary-600",
    barClass: "bg-primary-500",
    ringClass: "ring-primary-100",
  },
};

let counter = 0;

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  counter += 1;
  return `toast-${Date.now()}-${counter}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = makeId();
      const item: ToastItem = {
        id,
        title: options.title,
        variant: options.variant ?? "info",
        duration: options.duration ?? 2800,
        ...(options.description ? { description: options.description } : {}),
      };
      setToasts((current) => [item, ...current].slice(0, 4));
      if (item.duration > 0) {
        window.setTimeout(() => dismiss(id), item.duration);
      }
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (title, description) =>
        toast({ title, variant: "success", ...(description ? { description } : {}) }),
      error: (title, description) =>
        toast({ title, variant: "error", ...(description ? { description } : {}) }),
      info: (title, description) =>
        toast({ title, variant: "info", ...(description ? { description } : {}) }),
      warning: (title, description) =>
        toast({ title, variant: "warning", ...(description ? { description } : {}) }),
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifikasi"
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:right-6 sm:top-6 sm:w-[390px]"
      >
        {toasts.map((item) => {
          const config = VARIANT_CONFIG[item.variant];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto w-full animate-toast-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-card ring-1 backdrop-blur-xl",
                config.ringClass,
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    config.iconClass,
                  )}
                >
                  <Icon className="size-5" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                  aria-label="Tutup notifikasi"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", config.barClass)}
                  style={{
                    animation: `toast-progress ${item.duration}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus dipakai di dalam ToastProvider");
  }
  return context;
}
