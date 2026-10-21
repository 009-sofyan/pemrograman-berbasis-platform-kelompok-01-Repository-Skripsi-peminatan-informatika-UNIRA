
import type { Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/users.js";
import type { AuthRequest } from "../middlewares/authMiddleware.js";

export async function getProfile(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Autentikasi diperlukan",
      });
    }

    const [user] = await db
      .select({
        id: users.id,
        nama: users.nama,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        message: "Pengguna tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Profil pengguna berhasil diambil",
      user,
    });
  } catch (error) {
    console.error("Gagal mengambil profil:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
}
