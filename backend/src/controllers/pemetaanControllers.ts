
import type { Response } from "express";
import { count, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { mahasiswa } from "../db/mahasiswa.js";
import type { AuthRequest } from "../middlewares/authMiddleware.js";

export const getPemetaanPeminatan = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Autentikasi diperlukan",
      });
    }

    const data = await db
      .select({
        peminatan: mahasiswa.peminatan,
        totalMahasiswa: count(),
      })
      .from(mahasiswa)
      .groupBy(mahasiswa.peminatan);

    const totalMemilih = data
      .filter((item) => item.peminatan !== null)
      .reduce((total, item) => total + item.totalMahasiswa, 0);

    return res.status(200).json({
      message: "Pemetaan peminatan berhasil diambil",
      totalMemilih,
      data,
    });
  } catch (error) {
    console.error("Pemetaan peminatan error:", error);

    return res.status(500).json({
      message: "Gagal mengambil pemetaan peminatan",
    });
  }
};
