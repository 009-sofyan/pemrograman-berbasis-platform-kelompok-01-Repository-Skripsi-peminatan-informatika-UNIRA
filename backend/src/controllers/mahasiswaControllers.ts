
import type { NextFunction, Response } from "express";
import { db } from "../db/index.js";
import { users } from "../db/users.js";
import { mahasiswa } from "../db/mahasiswa.js";
import type { AuthRequest } from "../middlewares/authMiddleware.js";
import { desc, eq } from "drizzle-orm";
import type {
  CreateMahasiswaInput,
  UpdateMahasiswaInput,
} from "../validation/schemas.js";


export const createMahasiswa = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== "tendik") {
      return res.status(403).json({
        message: "Hanya tendik yang dapat menambahkan data mahasiswa",
      });
    }

    // Body sudah divalidasi dan dinormalisasi oleh createMahasiswaSchema.
    const { email, nim, programStudi } = req.body as CreateMahasiswaInput;

    const emailNormalized = email;
    const nimNormalized = nim;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNormalized))
      .limit(1);

    if (!existingUser) {
      return res.status(404).json({
        message: "Akun mahasiswa belum terdaftar. Mahasiswa harus register terlebih dahulu",
      });
    }

    if (existingUser.role !== "mahasiswa") {
      return res.status(400).json({
        message: "Email tersebut bukan akun mahasiswa",
      });
    }

    const [existingData] = await db
      .select()
      .from(mahasiswa)
      .where(eq(mahasiswa.userId, existingUser.id))
      .limit(1);

    if (existingData) {
      return res.status(409).json({
        message: "Akun ini sudah memiliki data mahasiswa",
      });
    }

    const [existingNim] = await db
      .select()
      .from(mahasiswa)
      .where(eq(mahasiswa.nim, nimNormalized))
      .limit(1);

    if (existingNim) {
      return res.status(409).json({
        message: "NIM sudah terdaftar",
      });
    }

    await db.insert(mahasiswa).values({
      userId: existingUser.id,
      nim: nimNormalized,
      programStudi,
      peminatan: null,
    });

    return res.status(201).json({
      message: "Data mahasiswa berhasil ditambahkan",
      data: {
        userId: existingUser.id,
        nama: existingUser.nama,
        email: existingUser.email,
        nim: nimNormalized,
        programStudi,
        peminatan: null,
      },
    });
  } catch (error) {
    next(error);
  }
};



export const getMahasiswa = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== "tendik") {
      return res.status(403).json({
        message: "Hanya tendik yang dapat melihat daftar mahasiswa",
      });
    }

    const data = await db
      .select({
        id: mahasiswa.id,
        userId: users.id,
        nama: users.nama,
        email: users.email,
        nim: mahasiswa.nim,
        programStudi: mahasiswa.programStudi,
        peminatan: mahasiswa.peminatan,
      })
      .from(mahasiswa)
      .innerJoin(users, eq(mahasiswa.userId, users.id))
      .orderBy(desc(mahasiswa.id));

    return res.status(200).json({
      message: "Daftar mahasiswa berhasil diambil",
      total: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};


export const getMahasiswaById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== "tendik") {
      return res.status(403).json({
        message: "Hanya tendik yang dapat melihat detail mahasiswa",
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID mahasiswa tidak valid",
      });
    }

    const [data] = await db
      .select({
        id: mahasiswa.id,
        userId: users.id,
        nama: users.nama,
        email: users.email,
        nim: mahasiswa.nim,
        programStudi: mahasiswa.programStudi,
        peminatan: mahasiswa.peminatan,
      })
      .from(mahasiswa)
      .innerJoin(users, eq(mahasiswa.userId, users.id))
      .where(eq(mahasiswa.id, id))
      .limit(1);

    if (!data) {
      return res.status(404).json({
        message: "Mahasiswa tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Detail mahasiswa berhasil diambil",
      data,
    });
  } catch (error) {
    next(error);
  }
};


export const updateMahasiswa = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== "tendik") {
      return res.status(403).json({
        message: "Hanya tendik yang dapat mengubah data mahasiswa",
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID mahasiswa tidak valid",
      });
    }

    const [data] = await db
      .select()
      .from(mahasiswa)
      .innerJoin(users, eq(mahasiswa.userId, users.id))
      .where(eq(mahasiswa.id, id))
      .limit(1);

    if (!data) {
      return res.status(404).json({
        message: "Mahasiswa tidak ditemukan",
      });
    }

    // Body sudah divalidasi oleh updateMahasiswaSchema.
    const { nama, email, nim, programStudi, peminatan } =
      req.body as UpdateMahasiswaInput;

    const emailNormalized = email;
    const nimNormalized = nim;

    const [existingEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNormalized))
      .limit(1);

    if (existingEmail && existingEmail.id !== data.users.id) {
      return res.status(409).json({
        message: "Email sudah digunakan",
      });
    }

    const [existingNim] = await db
      .select()
      .from(mahasiswa)
      .where(eq(mahasiswa.nim, nimNormalized))
      .limit(1);

    if (existingNim && existingNim.id !== id) {
      return res.status(409).json({
        message: "NIM sudah digunakan",
      });
    }

    await db
      .update(users)
      .set({
        nama,
        email: emailNormalized,
      })
      .where(eq(users.id, data.users.id));

    await db
      .update(mahasiswa)
      .set({
        nim: nimNormalized,
        programStudi,
        peminatan: peminatan ? peminatan : null,
      })
      .where(eq(mahasiswa.id, id));

    return res.status(200).json({
      message: "Data mahasiswa berhasil diperbarui",
    });
  } catch (error) {
    next(error);
  }
};


export const deleteMahasiswa = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== "tendik") {
      return res.status(403).json({
        message: "Hanya tendik yang dapat menghapus data mahasiswa",
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID mahasiswa tidak valid",
      });
    }

    const [data] = await db
      .select()
      .from(mahasiswa)
      .where(eq(mahasiswa.id, id))
      .limit(1);

    if (!data) {
      return res.status(404).json({
        message: "Mahasiswa tidak ditemukan",
      });
    }

    await db
      .delete(mahasiswa)
      .where(eq(mahasiswa.id, id));

    await db
      .delete(users)
      .where(eq(users.id, data.userId));

    return res.status(200).json({
      message: "Data mahasiswa berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};


