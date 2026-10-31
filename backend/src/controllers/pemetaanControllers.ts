
import type { Request, Response } from "express";
import { count } from "drizzle-orm";
import { db } from "../db/index.js";
import { mahasiswa } from "../db/mahasiswa.js";

const BUSINESS_INTELLIGENCE = "Business Intelligence";
const SMART_AGRICULTURE = "Smart Agriculture";

interface AngkatanStat {
  angkatan: string;
  totalMahasiswa: number;
  bi: number;
  sa: number;
  belumMemilih: number;
  lainnya: number;
}

/**
 * Angkatan tidak disimpan sebagai kolom tersendiri. Nilai diturunkan dari NIM
 * dengan aturan yang sama seperti filter angkatan di halaman Data Mahasiswa.
 */
function getAngkatan(nim: string): string | null {
  const value = nim.trim();
  const fullYear = value.match(/^(20\d{2})/);
  if (fullYear?.[1]) return fullYear[1];

  const shortYear = value.match(/^(\d{2})/);
  if (shortYear?.[1]) return `20${shortYear[1]}`;

  return null;
}

export const getPemetaanPeminatan = async (
  _req: Request,
  res: Response
) => {
  try {
    const [data, mahasiswaRows] = await Promise.all([
      db
        .select({
          peminatan: mahasiswa.peminatan,
          totalMahasiswa: count(),
        })
        .from(mahasiswa)
        .groupBy(mahasiswa.peminatan),
      db
        .select({
          nim: mahasiswa.nim,
          peminatan: mahasiswa.peminatan,
        })
        .from(mahasiswa),
    ]);

    const totalMahasiswa = data.reduce(
      (total, item) => total + item.totalMahasiswa,
      0
    );
    const totalMemilih = data
      .filter((item) => item.peminatan !== null)
      .reduce((total, item) => total + item.totalMahasiswa, 0);

    const byAngkatanMap = new Map<string, AngkatanStat>();

    for (const row of mahasiswaRows) {
      const angkatan = getAngkatan(row.nim);
      if (!angkatan) continue;

      const current = byAngkatanMap.get(angkatan) ?? {
        angkatan,
        totalMahasiswa: 0,
        bi: 0,
        sa: 0,
        belumMemilih: 0,
        lainnya: 0,
      };

      current.totalMahasiswa += 1;

      if (row.peminatan === BUSINESS_INTELLIGENCE) {
        current.bi += 1;
      } else if (row.peminatan === SMART_AGRICULTURE) {
        current.sa += 1;
      } else if (!row.peminatan) {
        current.belumMemilih += 1;
      } else {
        current.lainnya += 1;
      }

      byAngkatanMap.set(angkatan, current);
    }

    const byAngkatan = Array.from(byAngkatanMap.values()).sort(
      (a, b) => Number(b.angkatan) - Number(a.angkatan)
    );

    return res.status(200).json({
      message: "Pemetaan peminatan berhasil diambil",
      totalMahasiswa,
      totalMemilih,
      data,
      byAngkatan,
    });
  } catch (error) {
    console.error("Pemetaan peminatan error:", error);

    return res.status(500).json({
      message: "Gagal mengambil pemetaan peminatan",
    });
  }
};
