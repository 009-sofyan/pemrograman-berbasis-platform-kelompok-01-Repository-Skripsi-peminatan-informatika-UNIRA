import { Download, ExternalLink, LoaderCircle } from "lucide-react";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { useSkripsiPdfDownload } from "../../hooks/useSkripsiPdfDownload";
import { skripsiService } from "../../services/skripsiService";
import { Button, buttonClassName } from "../ui/Button";

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

/**
 * Tautan unduhan publik untuk katalog. Elemen tetap berupa <a> sehingga
 * pengguna bisa membuka tab baru lewat klik tengah/ctrl+klik, tetapi klik
 * biasa dicegat agar kegagalan 404 dapat ditampilkan sebagai toast tanpa
 * mengarahkan pengguna ke halaman login.
 */
export function PublicSkripsiPdfButton({
  id,
  title,
  mode = "open",
  label,
  icon,
  variant = "primary",
  size = "md",
  className,
}: SkripsiPdfButtonProps) {
  const pdf = useSkripsiPdfDownload();
  const loading = pdf.isLoading(id, mode);
  const actionLabel =
    label ?? (mode === "open" ? "Akses PDF" : "Unduh PDF");
  const href = skripsiService.publicPdfUrl(id, mode === "open");
  const ariaLabel =
    mode === "open" ? `Akses PDF: ${title}` : `Unduh PDF: ${title}`;

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }

    // Biarkan perilaku bawaan untuk klik tengah atau kombinasi tombol
    // pengubah agar tetap bisa membuka tab baru tanpa JavaScript.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    void (mode === "open" ? pdf.open(id, "public") : pdf.download(id, "public"));
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      onClick={onClick}
      className={buttonClassName({
        variant,
        size,
        className: loading ? `${className ?? ""} pointer-events-none opacity-60` : className,
      })}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <span
          className="grid place-items-center [&>svg]:size-4"
          aria-hidden="true"
        >
          {icon ?? (mode === "open" ? <ExternalLink /> : <Download />)}
        </span>
      )}
      {actionLabel}
    </a>
  );
}
