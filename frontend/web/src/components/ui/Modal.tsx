import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";

type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      focusable?.focus();
    }, 60);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-slate-950/40 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (!closeOnBackdrop) return;
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl animate-scale-in sm:rounded-3xl",
          SIZES[size],
          className,
        )}
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary-50/70 to-transparent" />
        <div className="relative flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          {icon ? (
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1 pt-0.5">
            {title ? (
              <h2 id={titleId} className="text-base font-bold text-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            aria-label="Tutup dialog"
          >
            <X className="size-4.5" />
          </button>
        </div>
        <div className="relative flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
