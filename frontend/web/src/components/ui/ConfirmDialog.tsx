import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

type ConfirmTone = "primary" | "danger" | "mint" | "amber";

const TONE = {
  primary: {
    icon: Info,
    iconClass: "bg-primary-50 text-primary-600 ring-primary-100",
    button: "primary" as const,
  },
  danger: {
    icon: AlertTriangle,
    iconClass: "bg-coral-50 text-coral-600 ring-coral-100",
    button: "danger" as const,
  },
  mint: {
    icon: CheckCircle2,
    iconClass: "bg-mint-50 text-mint-600 ring-mint-100",
    button: "mint" as const,
  },
  amber: {
    icon: AlertTriangle,
    iconClass: "bg-amber-50 text-amber-600 ring-amber-100",
    button: "secondary" as const,
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  tone = "primary",
  loading = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  children?: ReactNode;
}) {
  const config = TONE[tone];
  const Icon = config.icon;
  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      description={description}
      size="sm"
      closeOnBackdrop={!loading}
      icon={
        <span className={`grid size-11 place-items-center rounded-2xl ring-1 ${config.iconClass}`}>
          <Icon className="size-5" />
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={config.button} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? (
        <p className="text-sm leading-relaxed text-ink-soft">
          Tindakan ini akan langsung diproses oleh sistem.
        </p>
      )}
    </Modal>
  );
}
