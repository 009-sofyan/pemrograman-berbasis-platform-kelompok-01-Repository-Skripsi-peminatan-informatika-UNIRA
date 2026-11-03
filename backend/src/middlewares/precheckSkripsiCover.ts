import type { NextFunction, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { mahasiswa } from "../db/mahasiswa.js";
import { skripsi } from "../db/skripsi.js";
import type { AuthRequest } from "./authMiddleware.js";

export interface SkripsiCoverContext {
    id: number;
    coverUrl: string | null;
}

/**
 * Dijalankan sebelum Multer agar cover tidak pernah ditulis ke disk untuk
 * pengguna yang tidak berhak atau skripsi yang tidak ditemukan.
 *
 * Mahasiswa hanya boleh mengubah cover miliknya sendiri. Kaprodi dan Tendik
 * boleh mengelola cover seluruh skripsi.
 */
export async function precheckSkripsiCover(
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

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID skripsi tidak valid",
            });
        }

        const [dataSkripsi] = await db
            .select({
                id: skripsi.id,
                mahasiswaId: skripsi.mahasiswaId,
                coverUrl: skripsi.coverUrl,
            })
            .from(skripsi)
            .where(eq(skripsi.id, id))
            .limit(1);

        if (!dataSkripsi) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        if (req.user.role === "mahasiswa") {
            const [dataMahasiswa] = await db
                .select({ id: mahasiswa.id })
                .from(mahasiswa)
                .where(eq(mahasiswa.userId, req.user.id))
                .limit(1);

            if (!dataMahasiswa) {
                return res.status(404).json({
                    message: "Data mahasiswa belum terdaftar",
                });
            }

            if (dataSkripsi.mahasiswaId !== dataMahasiswa.id) {
                return res.status(403).json({
                    message:
                        "Kamu hanya dapat mengubah cover skripsi milik sendiri",
                });
            }
        } else if (
            req.user.role !== "kaprodi" &&
            req.user.role !== "tendik"
        ) {
            return res.status(403).json({
                message: "Kamu tidak memiliki izin untuk mengubah cover skripsi",
            });
        }

        res.locals.skripsiCover = {
            id: dataSkripsi.id,
            coverUrl: dataSkripsi.coverUrl,
        } satisfies SkripsiCoverContext;

        next();
    } catch (error) {
        console.error("Gagal memeriksa akses cover skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}
