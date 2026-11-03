const MAX_COVER_DIMENSION = 800;
const TARGET_MAX_BYTES = 150 * 1024;
const QUALITY_STEPS = [0.75, 0.65, 0.55, 0.45, 0.35];

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

function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl.length;
  const base64 = dataUrl.slice(comma + 1);
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Mengubah gambar menjadi data URL kompresi untuk cache sementara.
 * Sisi terpanjang maksimal 800 px, WebP/JPEG kualitas ~0,75, dan hasil
 * diupayakan <= 150 KB. Blob URL tidak pernah disimpan karena akan mati
 * saat halaman berganti.
 */
export async function compressCoverToDataUrl(file: File): Promise<string> {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const longestSide = Math.max(image.width, image.height);

  if (!Number.isFinite(longestSide) || longestSide <= 0) {
    throw new Error("Dimensi gambar tidak valid.");
  }

  const scale = Math.min(1, MAX_COVER_DIMENSION / longestSide);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia di browser ini.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  let best = "";
  let bestBytes = Number.POSITIVE_INFINITY;

  for (const type of ["image/webp", "image/jpeg"] as const) {
    for (const quality of QUALITY_STEPS) {
      const dataUrl = canvas.toDataURL(type, quality);
      if (!dataUrl.startsWith(`data:${type}`)) continue;

      const bytes = estimateDataUrlBytes(dataUrl);
      if (bytes < bestBytes) {
        best = dataUrl;
        bestBytes = bytes;
      }

      if (bytes <= TARGET_MAX_BYTES) return dataUrl;
    }
  }

  if (!best) throw new Error("Gambar tidak dapat dikompresi.");
  return best;
}
