import type { Response } from "express";
import { count, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { mahasiswa } from "../db/mahasiswa.js";
import { skripsi } from "../db/skripsi.js";
import type { AuthRequest } from "../middlewares/authMiddleware";

export const getDashboard = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }

        const [totalMahasiswa] = await db
            .select({ total: count() })
            .from(mahasiswa);

        const [totalSkripsi] = await db
            .select({ total: count() })
            .from(skripsi);

        const statusskripsi = await db
            .select({
                status: skripsi.status,
                total: count(),
            })
            .from(skripsi)
            .groupBy(skripsi.status);

        const peminatanMahasiswa = await db
            .select({
                peminatan: mahasiswa.peminatan,
                total: count(),
            })
            .from(mahasiswa)
            .groupBy(mahasiswa.peminatan);

        return res.status(200).json({
            message: "Dashboard berhasil diambil",
            totalMahasiswa: totalMahasiswa?.total ?? 0,
            totalSkripsi: totalSkripsi?.total ?? 0,
            statusskripsi,
            peminatanMahasiswa,
        });
    } catch (error) {
        console.error("Dashboard error:", error);

        return res.status(500).json({
            message: "Gagal mengambil data dashboard",
        });
    }
}