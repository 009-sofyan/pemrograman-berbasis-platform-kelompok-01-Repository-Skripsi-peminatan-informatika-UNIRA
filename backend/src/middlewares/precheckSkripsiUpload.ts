import type { NextFunction, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { mahasiswa } from "../db/mahasiswa.js";
import { skripsi } from "../db/skripsi.js";
import type { AuthRequest } from "./authMiddleware.js";

export type SkripsiStatus =
    | "draft"
    | "diajukan"
    | "disetujui"
    | "ditolak";

export interface SkripsiUploadContext {
    id: number;
    mahasiswaId: number;
    status: SkripsiStatus;
    fileUrl: string | null;
}

/**
 * Dijalankan sebelum Multer agar file tidak pernah ditulis ke disk untuk
 * pengguna yang tidak berhak atau skripsi yang statusnya tidak dapat diubah.
 */
export async function precheckSkripsiUpload(
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
                message: "Hanya mahasiswa yang dapat mengunggah file skripsi",
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID skripsi tidak valid",
            });
        }

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

        const [dataSkripsi] = await db
            .select({
                id: skripsi.id,
                mahasiswaId: skripsi.mahasiswaId,
                status: skripsi.status,
                fileUrl: skripsi.fileUrl,
            })
            .from(skripsi)
            .where(eq(skripsi.id, id))
            .limit(1);

        if (!dataSkripsi) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        if (dataSkripsi.mahasiswaId !== dataMahasiswa.id) {
            return res.status(403).json({
                message: "Kamu hanya dapat mengunggah file skripsi milik sendiri",
            });
        }

        if (
            dataSkripsi.status !== "draft" &&
            dataSkripsi.status !== "ditolak"
        ) {
            return res.status(409).json({
                message:
                    "File skripsi hanya dapat diunggah saat berstatus draft atau ditolak",
            });
        }

        res.locals.skripsiUpload = {
            id: dataSkripsi.id,
            mahasiswaId: dataSkripsi.mahasiswaId,
            status: dataSkripsi.status,
            fileUrl: dataSkripsi.fileUrl,
        } satisfies SkripsiUploadContext;

        next();
    } catch (error) {
        console.error("Gagal memeriksa akses upload skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}
