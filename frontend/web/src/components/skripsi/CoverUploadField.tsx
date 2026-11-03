import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { ImagePlus, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { cn } from "../../lib/cn";
import { resolveFileUrl } from "../../lib/files";

const MAX_COVER_SIZE = 2 * 1024 * 1024;
const MAX_COVER_DIMENSION = 1200;
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png"]);

function formatCoverSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 1,
    }).format(bytes / 1024)} KB`;
  }
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(bytes / (1024 * 1024))} MB`;
}

function validateCover(file: File): string | null {
  const hasMime = ALLOWED_MIME.has(file.type);
  const hasExtension = /\.(?:jpe?g|png)$/i.test(file.name);

  if (!hasMime || !hasExtension) {
    return "Format harus JPG atau PNG";
  }

  if (file.size > MAX_COVER_SIZE) {
    return `Ukuran maksimal 2 MB (file kamu ${formatCoverSize(file.size)})`;
  }

  if (file.size === 0) {
    return "File kosong tidak dapat diunggah";
  }

  return null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("File gambar tidak dapat dibaca."));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
  });
}

/**
 * Kompresi lokal sebelum dikirim: sisi terpanjang maksimal 1200 px dan
 * kualitas JPEG 0,8. Jika hasil canvas lebih besar dari aslinya, file asli
 * dipertahankan agar tidak menambah ukuran.
 */
async function optimizeCover(file: File): Promise<File> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const longestSide = Math.max(image.width, image.height);

  if (longestSide <= MAX_COVER_DIMENSION && file.size <= 700 * 1024) {
    return file;
  }

  const scale = Math.min(1, MAX_COVER_DIMENSION / Math.max(1, longestSide));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return file;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas);
  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "sampul";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export function CoverUploadField({
  file,
  onChange,
  existingUrl,
  disabled = false,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const existingPreview = existingUrl ? resolveFileUrl(existingUrl) : null;
  const shownPreview = previewUrl ?? existingPreview;
  const showingExisting = !previewUrl && Boolean(existingPreview);

  const pickFile = async (nextFile: File | null) => {
    setError(null);

    if (!nextFile) {
      setOptimized(false);
      onChange(null);
      return;
    }

    const validation = validateCover(nextFile);
    if (validation) {
      setError(validation);
      return;
    }

    setOptimizing(true);
    try {
      const prepared = await optimizeCover(nextFile);
      setOptimized(prepared !== nextFile);
      onChange(prepared);
    } catch {
      setOptimized(false);
      onChange(nextFile);
    } finally {
      setOptimizing(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) void pickFile(dropped);
  };

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs font-semibold text-slate-700">
          Sampul skripsi
          <span className="rounded-full bg-navy-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-navy-500">
            Opsional
          </span>
        </p>
        <p className="text-[10px] text-ink-faint">JPG/PNG · maks 2 MB · rasio 3:4</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null;
          event.target.value = "";
          void pickFile(nextFile);
        }}
      />

      {shownPreview ? (
        <div className="flex flex-col gap-4 rounded-card border border-navy-100 bg-navy-50/40 p-3 sm:flex-row sm:items-center">
          <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-input bg-navy-900 shadow-sm">
            <img
              src={shownPreview}
              alt={showingExisting ? "Sampul skripsi saat ini" : "Pratinjau sampul skripsi"}
              width={240}
              height={320}
              className="size-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-navy-950/70 px-1.5 py-1 text-center text-[8px] font-bold uppercase tracking-[0.12em] text-white/80">
              {showingExisting ? "Saat ini" : "Pratinjau"}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-ink">
              {file?.name ?? "Sampul tersimpan"}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-soft">
              {file
                ? `${formatCoverSize(file.size)} · ${
                    optimizing ? "Mengoptimalkan…" : optimized ? "Dioptimalkan otomatis" : "Siap diunggah"
                  }`
                : "Pilih file baru untuk mengganti sampul."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || optimizing}
                className="inline-flex h-9 items-center gap-1.5 rounded-input border border-navy-100 bg-white px-3 text-[11px] font-bold text-navy-800 shadow-sm transition hover:border-navy-200 hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <RefreshCw className={cn("size-3.5", optimizing && "animate-spin")} />
                Ganti
              </button>
              {file ? (
                <button
                  type="button"
                  onClick={() => void pickFile(null)}
                  disabled={disabled || optimizing}
                  className="inline-flex h-9 items-center gap-1.5 rounded-input border border-coral-100 bg-white px-3 text-[11px] font-bold text-coral-600 transition hover:border-coral-200 hover:bg-coral-50 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <Trash2 className="size-3.5" />
                  Hapus
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => {
            if (!disabled) inputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          className={cn(
            "cursor-pointer rounded-card border-2 border-dashed px-5 py-7 text-center transition",
            dragging
              ? "border-primary-300 bg-primary-50/70"
              : "border-navy-100 bg-canvas-soft/50 hover:border-primary-200 hover:bg-primary-50/30",
            disabled && "cursor-not-allowed opacity-60",
            error && "border-coral-300 bg-coral-50/40",
          )}
        >
          <span className="mx-auto grid size-11 place-items-center rounded-input bg-white text-primary-500 shadow-sm ring-1 ring-navy-100">
            {optimizing ? (
              <RefreshCw className="size-5 animate-spin" />
            ) : (
              <UploadCloud className="size-5" />
            )}
          </span>
          <p className="mt-3 text-xs font-bold text-ink">
            {optimizing ? "Mengoptimalkan gambar…" : "Tarik gambar ke sini atau klik untuk memilih"}
          </p>
          <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-ink-soft">
            <ImagePlus className="size-3" />
            Hanya JPG/PNG, maksimal 2 MB
          </p>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-coral-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
