const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

export const API_BASE_URL = rawBase && rawBase.length > 0 ? rawBase : "/api";

function computeApiOrigin(): string {
  const configured = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (/^https?:\/\//i.test(API_BASE_URL)) {
    try {
      return new URL(API_BASE_URL).origin;
    } catch {
      return "";
    }
  }

  return "";
}

export const API_ORIGIN = computeApiOrigin();

export function resolveFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  const trimmed = fileUrl.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${path}`;
}

export function resolveBackendAsset(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}
