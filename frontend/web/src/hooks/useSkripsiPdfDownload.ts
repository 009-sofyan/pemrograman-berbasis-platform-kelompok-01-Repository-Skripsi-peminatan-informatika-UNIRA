import { useState } from "react";
import { useToast } from "../contexts/ToastContext";
import { getApiErrorMessage } from "../lib/errors";
import { downloadBlob } from "../lib/files";
import { skripsiService } from "../services/skripsiService";

type PdfAction = "download" | "open";

interface ActiveAction {
  id: number;
  action: PdfAction;
}

export function useSkripsiPdfDownload() {
  const toast = useToast();
  const [active, setActive] = useState<ActiveAction | null>(null);

  const run = async (id: number, action: PdfAction) => {
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
      const blob = await skripsiService.downloadFile(id);

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
        "Gagal mengunduh PDF",
        getApiErrorMessage(
          error,
          "Berkas tidak dapat diunduh. Silakan coba lagi.",
        ),
      );
    } finally {
      setActive(null);
    }
  };

  return {
    download: (id: number) => run(id, "download"),
    open: (id: number) => run(id, "open"),
    isLoading: (id: number, action: PdfAction) =>
      active?.id === id && active.action === action,
  };
}
