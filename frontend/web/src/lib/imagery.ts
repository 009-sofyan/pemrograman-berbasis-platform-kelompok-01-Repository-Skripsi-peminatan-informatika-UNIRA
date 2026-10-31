import { BI, SA } from "../constants";
import type { PeminatanValue } from "../types";

type CoverTone = "bi" | "sa";

export interface ImageryCredit {
  tone: CoverTone;
  variant: 1 | 2 | 3 | 4;
  photographer: string;
  sourceUrl: string;
  description: string;
}

/**
 * Foto Pexels yang sudah diverifikasi satu per satu: tidak menampilkan wajah,
 * merek dagang, atau logo. Semua berkas telah dikonversi menjadi WebP lokal
 * (320/480/640 px, rasio 3:4, maksimal 80 KB).
 */
export const IMAGE_CREDITS: ImageryCredit[] = [
  {
    tone: "bi",
    variant: 1,
    photographer: "Negative Space",
    sourceUrl: "https://www.pexels.com/photo/blue-and-green-pie-chart-97080/",
    description: "Grafik lingkaran biru dan hijau di atas permukaan terang.",
  },
  {
    tone: "bi",
    variant: 2,
    photographer: "Lukas Blazek",
    sourceUrl: "https://www.pexels.com/photo/notebook-and-charts-669613/",
    description: "Buku catatan, grafik, dan alat tulis untuk analisis data.",
  },
  {
    tone: "bi",
    variant: 3,
    photographer: "RDNE Stock project",
    sourceUrl:
      "https://www.pexels.com/photo/close-up-photo-of-a-piece-of-paper-with-a-pie-chart-7947703/",
    description: "Diagram lingkaran pada lembar kertas putih.",
  },
  {
    tone: "bi",
    variant: 4,
    photographer: "Rafael Minguet Delgado",
    sourceUrl:
      "https://www.pexels.com/photo/vibrant-financial-data-visualization-chart-38933571/",
    description: "Visualisasi data keuangan berwarna cerah.",
  },
  {
    tone: "sa",
    variant: 1,
    photographer: "Magda Ehlers",
    sourceUrl:
      "https://www.pexels.com/photo/agricultural-drone-spraying-a-green-field-34182313/",
    description: "Drone pertanian menyemprot lahan hijau.",
  },
  {
    tone: "sa",
    variant: 2,
    photographer: "Bulat843",
    sourceUrl:
      "https://www.pexels.com/photo/indoor-hydroponic-lettuce-farming-with-led-lights-37861011/",
    description: "Budidaya selada hidroponik dalam ruangan dengan lampu LED.",
  },
  {
    tone: "sa",
    variant: 3,
    photographer: "Quang Nguyen Vinh",
    sourceUrl: "https://www.pexels.com/photo/green-leafed-plants-2132171/",
    description: "Tanaman berdaun hijau di kebun.",
  },
  {
    tone: "sa",
    variant: 4,
    photographer: "Magda Ehlers",
    sourceUrl:
      "https://www.pexels.com/photo/efficient-irrigation-system-on-a-farm-field-34182297/",
    description: "Sistem irigasi efisien di lahan pertanian.",
  },
];

const BLUR_PLACEHOLDERS: Record<CoverTone, string[]> = {
  bi: [
    "data:image/webp;base64,UklGRjgAAABXRUJQVlA4ICwAAADwAQCdASoIAAoABABoJYgC7AEO/jZ1AAAA/vTUKETzcwOOptziiBCnVAAAAA==",
    "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACwAQCdASoIAAoABABoJQAAS4rJt+IQAP7KCUvavAWiwV7OTu8u73ITBhYVbAAA",
    "data:image/webp;base64,UklGRkYAAABXRUJQVlA4IDoAAAAwAgCdASoIAAoABABoJZAC7AEU+XzFgfxAAAD+6E8IGUlOkEjwx7y9pNDdaZZhnqXFXxueuBM+tNgA",
    "data:image/webp;base64,UklGRjQAAABXRUJQVlA4ICgAAACQAQCdASoIAAoABABoJQAAXM2zQAAA/vWVqn7e9rcKbUP3ROdm/AAA",
  ],
  sa: [
    "data:image/webp;base64,UklGRjQAAABXRUJQVlA4ICgAAACwAQCdASoIAAoABABoJZAC7ADzHKwAAP658gTJk/Z5PkAtguDgdAAA",
    "data:image/webp;base64,UklGRjgAAABXRUJQVlA4ICwAAACQAQCdASoIAAoABABoJQBWACHDISAA/s3ydLUjVFiHnBum5p2Y3iJtG0AAAA==",
    "data:image/webp;base64,UklGRjgAAABXRUJQVlA4ICwAAADQAQCdASoIAAoABABoJYgCdAEOr/QgAAD+j5cBSc8Q/0rENEJIlvnVQCYgAA==",
    "data:image/webp;base64,UklGRjAAAABXRUJQVlA4ICQAAABwAQCdASoIAAoABABoJQAAXNU4AAD+6Mq9CJmHBP3N2geAAAA=",
  ],
};

export interface GeneratedCover {
  tone: CoverTone;
  variant: 1 | 2 | 3 | 4;
  src: string;
  srcSet: string;
  width: number;
  height: number;
  blurDataUrl: string;
  credit: ImageryCredit;
}

/**
 * Pemilihan cover deterministik dari id: data yang sama selalu mendapat foto
 * yang sama, sedangkan coverUrl dari API tetap diprioritaskan komponen.
 */
export function getGeneratedCover(
  id: number,
  peminatan: PeminatanValue,
): GeneratedCover {
  const tone: CoverTone = peminatan === SA ? "sa" : peminatan === BI ? "bi" : id % 2 === 0 ? "sa" : "bi";
  const safeId = Number.isFinite(id) ? Math.abs(Math.trunc(id)) : 1;
  const variant = ((safeId - 1) % 4 + 4) % 4 + 1;
  const key = `${tone}-${variant}`;
  const base = `/imagery/covers/${key}`;
  const credit =
    IMAGE_CREDITS.find((item) => item.tone === tone && item.variant === variant) ??
    IMAGE_CREDITS[0];

  return {
    tone,
    variant: variant as 1 | 2 | 3 | 4,
    src: `${base}-640.webp`,
    srcSet: `${base}-320.webp 320w, ${base}-480.webp 480w, ${base}-640.webp 640w`,
    width: 640,
    height: 853,
    blurDataUrl: BLUR_PLACEHOLDERS[tone][variant - 1],
    credit,
  };
}

export function getCreditForCover(
  id: number,
  peminatan: PeminatanValue,
): ImageryCredit {
  return getGeneratedCover(id, peminatan).credit;
}
