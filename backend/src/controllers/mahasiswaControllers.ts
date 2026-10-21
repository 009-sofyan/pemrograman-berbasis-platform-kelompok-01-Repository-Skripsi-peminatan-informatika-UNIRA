
import type { Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../db/index.js";
import { users } from "../db/users.js";
import { mahasiswa } from "../db/mahasiswa.js";
import type { AuthRequest } from "../middlewares/authMiddleware.js";
import { desc, eq } from "drizzle-orm";


export const createMahasiswa = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (req.user?.role !== "tendik") {
      return res.status(403).json({
        message: "Hanya tendik yang dapat menambahkan data mahasiswa",
      });
    }

    const { nama, email, password, nim, programStudi, peminatan } =
      req.body;

    if (!nama || !email || !password || !nim || !programStudi) {
      return res.status(400).json({
        message:
          "Nama, email, password, NIM, dan program studi wajib diisi",
      });
    }

    const emailNormalized = String(email).trim().toLowerCase();
    const nimNormalized = String(nim).trim();

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNormalized))
      .limit(1);

    if (existingUser) {
      return res.status(409).json({
        message: "Email sudah terdaftar",
      });
    }

    const [existingMahasiswa] = await db
      .select()
      .from(mahasiswa)
      .where(eq(mahasiswa.nim, nimNormalized))
      .limit(1);

    if (existingMahasiswa) {
      return res.status(409).json({
        message: "NIM sudah terdaftar",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const result = await db.insert(users).values({
      nama: String(nama).trim(),
      email: emailNormalized,
      password: hashedPassword,
      role: "mahasiswa",
    });

    const userId = Number(result[0].insertId);

    await db.insert(mahasiswa).values({
      userId,
      nim: nimNormalized,
      programStudi: String(programStudi).trim(),
      peminatan: peminatan ? String(peminatan).trim() : null,
    });

    return res.status(201).json({
      message: "Data mahasiswa berhasil ditambahkan",
      data: {
        userId,
        nama: String(nama).trim(),
        email: emailNormalized,
        nim: nimNormalized,
        programStudi: String(programStudi).trim(),
        peminatan: peminatan ? String(peminatan).trim() : null,
      },
    });
  } catch (error) {
    console.error("Create mahasiswa error:", error);

    return res.status(500).json({
      message: "Gagal menambahkan data mahasiswa",
    });
  }
};


export const getMahasiswa = async (
  req: AuthRequest,
  res: Response
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
    console.error("Get mahasiswa error:", error);

    return res.status(500).json({
      message: "Gagal mengambil daftar mahasiswa",
    });
  }
};


export const getMahasiswaById = async (
  req: AuthRequest,
  res: Response
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
    console.error("Get mahasiswa by ID error:", error);

    return res.status(500).json({
      message: "Gagal mengambil detail mahasiswa",
    });
  }
};


export const updateMahasiswa = async (
  req: AuthRequest,
  res: Response
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

    const { nama, email, nim, programStudi, peminatan } = req.body;

    if (!nama || !email || !nim || !programStudi) {
      return res.status(400).json({
        message: "Nama, email, NIM, dan program studi wajib diisi",
      });
    }

    const emailNormalized = String(email).trim().toLowerCase();
    const nimNormalized = String(nim).trim();

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
        nama: String(nama).trim(),
        email: emailNormalized,
      })
      .where(eq(users.id, data.users.id));

    await db
      .update(mahasiswa)
      .set({
        nim: nimNormalized,
        programStudi: String(programStudi).trim(),
        peminatan: peminatan ? String(peminatan).trim() : null,
      })
      .where(eq(mahasiswa.id, id));

    return res.status(200).json({
      message: "Data mahasiswa berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update mahasiswa error:", error);

    return res.status(500).json({
      message: "Gagal memperbarui data mahasiswa",
    });
  }
};


export const deleteMahasiswa = async (
  req: AuthRequest,
  res: Response
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
    console.error("Delete mahasiswa error:", error);

    return res.status(500).json({
      message: "Gagal menghapus data mahasiswa",
    });
  }
};


