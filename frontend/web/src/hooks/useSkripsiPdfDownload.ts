import { useState } from "react";
import { useToast } from "../contexts/ToastContext";
import { getApiErrorMessage } from "../lib/errors";
import { downloadBlob } from "../lib/files";
import { skripsiService } from "../services/skripsiService";

type PdfAction = "download" | "open";
export type PdfSource = "internal" | "public";

interface ActiveAction {
  id: number;
  action: PdfAction;
}

export function useSkripsiPdfDownload() {
  const toast = useToast();
  const [active, setActive] = useState<ActiveAction | null>(null);

  const run = async (
    id: number,
    action: PdfAction,
    source: PdfSource = "internal",
  ) => {
    if (active) return;

    const popup =
      action === "open"
        ? window.open("", "_blank")
        : null;

    if (action === "open" && !popup) {
      toast.error(
        "Popup diblokir",
        "Izinkan popup di browser untuk membuka PDF di tab baru.",
      );
      return;
    }

    if (popup) {
      popup.opener = null;
    }

    setActive({ id, action });

    try {
      const blob =
        source === "public"
          ? await skripsiService.downloadPublicFile(id, action === "open")
          : await skripsiService.downloadFile(id);

      if (action === "open" && popup) {
        const objectUrl = URL.createObjectURL(blob);
        popup.location.href = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      } else {
        downloadBlob(blob, `skripsi-${id}.pdf`);
      }
    } catch (error) {
      popup?.close();
      toast.error(
        action === "open" ? "Gagal membuka PDF" : "Gagal mengunduh PDF",
        getApiErrorMessage(
          error,
          action === "open"
            ? "Berkas tidak dapat dibuka. Silakan coba lagi."
            : "Berkas tidak dapat diunduh. Silakan coba lagi.",
        ),
      );
    } finally {
      setActive(null);
    }
  };

  return {
    download: (id: number, source: PdfSource = "internal") =>
      run(id, "download", source),
    open: (id: number, source: PdfSource = "internal") =>
      run(id, "open", source),
    isLoading: (id: number, action: PdfAction) =>
      active?.id === id && active.action === action,
  };
}
