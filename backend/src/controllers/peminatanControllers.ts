
import type { NextFunction, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { mahasiswa } from "../db/mahasiswa.js";
import type { AuthRequest } from "../middlewares/authMiddleware.js";
import type { PilihPeminatanInput } from "../validation/schemas.js";

export async function getPeminatanSaya(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Autentikasi diperlukan",
      });
    }

    if (req.user.role !== "mahasiswa") {
      return res.status(403).json({
        message: "Hanya mahasiswa yang dapat melihat peminatan sendiri",
      });
    }

    const [dataMahasiswa] = await db
      .select({
        id: mahasiswa.id,
        nim: mahasiswa.nim,
        programStudi: mahasiswa.programStudi,
        peminatan: mahasiswa.peminatan,
      })
      .from(mahasiswa)
      .where(eq(mahasiswa.userId, req.user.id))
      .limit(1);

    if (!dataMahasiswa) {
      return res.status(404).json({
        message:
          "Data akademik belum tersedia. Hubungi Tendik untuk melengkapi NIM dan program studi.",
      });
    }

    return res.status(200).json({
      message: "Data peminatan berhasil diambil",
      data: dataMahasiswa,
    });
  } catch (error) {
    next(error);
  }
}

export async function pilihPeminatan(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Autentikasi diperlukan",
      });
    }

    if (req.user.role !== "mahasiswa") {
      return res.status(403).json({
        message: "Hanya mahasiswa yang dapat memilih peminatan",
      });
    }

    // Body sudah divalidasi dengan enumerasi peminatan resmi.
    const { peminatan } = req.body as PilihPeminatanInput;

    const [dataMahasiswa] = await db
      .select({
        id: mahasiswa.id,
        peminatan: mahasiswa.peminatan,
      })
      .from(mahasiswa)
      .where(eq(mahasiswa.userId, req.user.id))
      .limit(1);

    if (!dataMahasiswa) {
      return res.status(404).json({
        message: "Data mahasiswa tidak ditemukan",
      });
    }

    if (dataMahasiswa.peminatan) {
      return res.status(400).json({
        message: "Peminatan sudah dipilih dan tidak dapat diubah",
      });
    }

    await db
      .update(mahasiswa)
      .set({ peminatan })
      .where(eq(mahasiswa.id, dataMahasiswa.id));

    return res.status(200).json({
      message: "Peminatan berhasil dipilih",
      peminatan,
    });
  } catch (error) {
    next(error);
  }
}
