import type { Response } from "express";
import fs from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { skripsi } from "../db/skripsi.js";
import type { AuthRequest } from "../middlewares/authMiddleware.js";
import type { SkripsiCoverContext } from "../middlewares/precheckSkripsiCover.js";
import {
    deleteStoredCoverFile,
    deleteUploadedTempFile,
    toStoredCoverUrl,
} from "../utils/uploads.js";

const PNG_SIGNATURE = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

async function hasValidCoverMagicBytes(
    filePath: string,
    mimeType: string
): Promise<boolean> {
    const handle = await fs.promises.open(filePath, "r");

    try {
        const buffer = Buffer.alloc(PNG_SIGNATURE.length);
        const { bytesRead } = await handle.read(
            buffer,
            0,
            buffer.length,
            0
        );

        if (mimeType === "image/png") {
            return (
                bytesRead >= PNG_SIGNATURE.length &&
                buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
            );
        }

        if (mimeType === "image/jpeg") {
            return (
                bytesRead >= JPEG_SIGNATURE.length &&
                buffer
                    .subarray(0, JPEG_SIGNATURE.length)
                    .equals(JPEG_SIGNATURE)
            );
        }

        return false;
    } finally {
        await handle.close();
    }
}

export async function uploadCoverSkripsi(
    req: AuthRequest,
    res: Response
) {
    let databaseUpdated = false;

    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }

        const coverContext = res.locals
            .skripsiCover as SkripsiCoverContext | undefined;

        if (!coverContext) {
            return res.status(500).json({
                message: "Konteks cover skripsi tidak tersedia",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Cover wajib diunggah",
            });
        }

        if (
            !(await hasValidCoverMagicBytes(
                req.file.path,
                req.file.mimetype
            ))
        ) {
            await deleteUploadedTempFile(req.file.path);

            return res.status(400).json({
                message: "File cover bukan gambar JPG/PNG yang valid",
            });
        }

        const storedCoverUrl = toStoredCoverUrl(req.file.filename);

        const [result] = await db
            .update(skripsi)
            .set({ coverUrl: storedCoverUrl })
            .where(eq(skripsi.id, coverContext.id));

        if (result.affectedRows === 0) {
            await deleteUploadedTempFile(req.file.path);

            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        databaseUpdated = true;

        // Cover lama baru dihapus setelah database berhasil menunjuk ke cover
        // baru. Jika update gagal, cover lama tetap dipertahankan.
        await deleteStoredCoverFile(coverContext.coverUrl);

        return res.status(200).json({
            message: "Cover skripsi berhasil diunggah",
            coverUrl: storedCoverUrl,
        });
    } catch (error) {
        if (!databaseUpdated && req.file) {
            await deleteUploadedTempFile(req.file.path);
        }

        console.error("Gagal mengunggah cover skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}

export async function deleteCoverSkripsi(
    req: AuthRequest,
    res: Response
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Autentikasi diperlukan",
            });
        }

        const coverContext = res.locals
            .skripsiCover as SkripsiCoverContext | undefined;

        if (!coverContext) {
            return res.status(500).json({
                message: "Konteks cover skripsi tidak tersedia",
            });
        }

        if (!coverContext.coverUrl) {
            return res.status(404).json({
                message: "Cover skripsi tidak ditemukan",
            });
        }

        const [result] = await db
            .update(skripsi)
            .set({ coverUrl: null })
            .where(eq(skripsi.id, coverContext.id));

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Skripsi tidak ditemukan",
            });
        }

        await deleteStoredCoverFile(coverContext.coverUrl);

        return res.status(200).json({
            message: "Cover skripsi berhasil dihapus",
            coverUrl: null,
        });
    } catch (error) {
        console.error("Gagal menghapus cover skripsi:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
    }
}
