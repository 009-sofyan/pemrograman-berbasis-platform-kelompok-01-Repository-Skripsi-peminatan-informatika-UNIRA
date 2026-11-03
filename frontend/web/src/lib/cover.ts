import type { Skripsi } from "../types";
import { getCoverTemp, setCoverTemp } from "./coverCache";
import { compressCoverToDataUrl } from "./coverImage";
import { resolveFileUrl } from "./files";

/**
 * Bentuk minimal data skripsi yang dibutuhkan untuk menentukan sumber cover.
 * `cover_url` ikut dibaca sebagai toleransi bila API mengirim snake_case.
 */
export type CoverSkripsi = Pick<Skripsi, "id"> & {
  coverUrl?: string | null;
  cover_url?: string | null;
};

/**
 * Urutan cover: cover permanen dari API -> cover sementara lokal -> null
 * (pemanggil menampilkan GeneratedCover).
 */
export function getCoverCandidates(skripsi: CoverSkripsi): string[] {
  const candidates: string[] = [];
  const apiCover =
    resolveFileUrl(skripsi.coverUrl) ?? resolveFileUrl(skripsi.cover_url);

  if (apiCover) candidates.push(apiCover);

  const tempCover = getCoverTemp(skripsi.id);
  if (tempCover && tempCover !== apiCover) candidates.push(tempCover);

  return candidates;
}

/**
 * `attempt` dipakai oleh komponen gambar untuk turun ke kandidat berikutnya
 * ketika gambar sebelumnya gagal dimuat (onError), bukan menampilkan gambar
 * rusak.
 */
export function resolveCover(skripsi: CoverSkripsi, attempt = 0): string | null {
  return getCoverCandidates(skripsi)[attempt] ?? null;
}

/**
 * Jembatan saat upload cover ke backend gagal: kompres file ke data URL
 * (bukan blob URL) lalu simpan di cache sementara.
 */
export async function cacheCoverFile(id: number, file: File): Promise<boolean> {
  try {
    const dataUrl = await compressCoverToDataUrl(file);
    return setCoverTemp(id, dataUrl);
  } catch {
    return false;
  }
}
