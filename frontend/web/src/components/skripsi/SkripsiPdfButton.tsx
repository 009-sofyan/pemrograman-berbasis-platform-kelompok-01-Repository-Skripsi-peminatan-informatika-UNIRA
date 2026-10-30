import { Download, ExternalLink } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useSkripsiPdfDownload } from "../../hooks/useSkripsiPdfDownload";
import { Button } from "../ui/Button";

type PdfAction = "download" | "open";

interface SkripsiPdfButtonProps {
  id: number;
  title: string;
  mode?: PdfAction;
  label?: ReactNode;
  icon?: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}

export function SkripsiPdfButton({
  id,
  title,
  mode = "download",
  label,
  icon,
  variant = "primary",
  size = "md",
  className,
}: SkripsiPdfButtonProps) {
  const pdf = useSkripsiPdfDownload();
  const loading = pdf.isLoading(id, mode);
  const actionLabel =
    label ?? (mode === "open" ? "Buka PDF" : "Unduh PDF");

  return (
    <Button
      variant={variant}
      size={size}
      loading={loading}
      icon={
        icon ??
        (mode === "open" ? <ExternalLink /> : <Download />)
      }
      className={className}
      aria-label={`${mode === "open" ? "Buka" : "Unduh"} PDF skripsi: ${title}`}
      onClick={() => {
        void (mode === "open" ? pdf.open(id) : pdf.download(id));
      }}
    >
      {actionLabel}
    </Button>
  );
}
