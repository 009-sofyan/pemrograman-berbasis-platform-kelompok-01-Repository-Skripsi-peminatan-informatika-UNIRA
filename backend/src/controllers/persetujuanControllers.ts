import type { Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { skripsi } from "../db/skripsi.js";
import { mahasiswa } from "../db/mahasiswa.js";
import type { AuthRequest } from "../middlewares/authMiddleware";
import { users } from "../db/users.js";
import {
    storedSkripsiFileExists,
    toSkripsiDownloadUrl,
} from "../utils/uploads.js";

export async function getPengajuanSkripsi(
    req: AuthRequest,
    res: Response
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }

        if (req.user.role !== "kaprodi") {
            return res.status(403).json({
                message: "Hanya kaprodi yang dapat melihat pengajuan skripsi",
            });
        }

        const rows = await db
            .select({
                id: skripsi.id,
                judul: skripsi.judul,
                abstrak: skripsi.abstrak,
                tahun: skripsi.tahun,
                fileUrl: skripsi.fileUrl,
                status: skripsi.status,
                createdAt: skripsi.createdAt,
                mahasiswaId: mahasiswa.id,
                nim: mahasiswa.nim,
                programStudi: mahasiswa.programStudi,
                peminatan: mahasiswa.peminatan,
                namaMahasiswa: users.nama,
                emailMahasiswa: users.email,
            })
            .from(skripsi)
            .innerJoin(
                mahasiswa,
                eq(skripsi.mahasiswaId, mahasiswa.id)
            )
            .innerJoin(
                users,
                eq(mahasiswa.userId, users.id)
            )
            .where(eq(skripsi.status, "diajukan"))
            .orderBy(desc(skripsi.createdAt));

        const data = rows.map((item) => ({
            ...item,
            fileUrl: item.fileUrl
                ? toSkripsiDownloadUrl(item.id)
                : null,
        }));

        return res.status(200).json({
            message: "Daftar pengajuan skripsi berhasil diambil",
            total: data.length,
            data,
        });
    } catch (error) {
        console.error("Gagal mengambil pengajuan skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}


export const approveSkripsi = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (req.user?.role !== "kaprodi") {
      return res.status(403).json({
        message: "Hanya kaprodi yang dapat menyetujui skripsi",
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID skripsi tidak valid",
      });
    }

    const [data] = await db
      .select()
      .from(skripsi)
      .where(eq(skripsi.id, id))
      .limit(1);

    if (!data) {
      return res.status(404).json({
        message: "Skripsi tidak ditemukan",
      });
    }

    if (data.status !== "diajukan") {
      return res.status(400).json({
        message: "Hanya skripsi yang diajukan yang dapat disetujui",
      });
    }

    if (!data.fileUrl) {
      return res.status(400).json({
        message:
          "Skripsi belum memiliki file PDF dan tidak dapat disetujui",
      });
    }

    if (!(await storedSkripsiFileExists(data.fileUrl))) {
      return res.status(400).json({
        message:
          "File PDF skripsi tidak ditemukan dan tidak dapat disetujui",
      });
    }

    await db
      .update(skripsi)
      .set({ status: "disetujui" })
      .where(eq(skripsi.id, id));

    return res.status(200).json({
      message: "Skripsi berhasil disetujui",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menyetujui skripsi",
    });
  }
};

export const rejectSkripsi = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (req.user?.role !== "kaprodi") {
      return res.status(403).json({
        message: "Hanya kaprodi yang dapat menolak skripsi",
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID skripsi tidak valid",
      });
    }

    const [data] = await db
      .select()
      .from(skripsi)
      .where(eq(skripsi.id, id))
      .limit(1);

    if (!data) {
      return res.status(404).json({
        message: "Skripsi tidak ditemukan",
      });
    }

    if (data.status !== "diajukan") {
      return res.status(400).json({
        message: "Hanya skripsi yang diajukan yang dapat ditolak",
      });
    }

    await db
      .update(skripsi)
      .set({ status: "ditolak" })
      .where(eq(skripsi.id, id));

    return res.status(200).json({
      message: "Skripsi berhasil ditolak",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menolak skripsi",
    });
  }
};