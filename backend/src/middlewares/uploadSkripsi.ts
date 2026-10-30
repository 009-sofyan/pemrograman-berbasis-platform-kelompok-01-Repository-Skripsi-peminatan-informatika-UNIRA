import crypto from "node:crypto";
import path from "node:path";
import type { RequestHandler } from "express";
import multer from "multer";
import {
    SKRIPSI_UPLOAD_DIR,
    deleteUploadedTempFile,
} from "../utils/uploads.js";

class UploadValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UploadValidationError";
    }
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, SKRIPSI_UPLOAD_DIR);
    },
    filename: (_req, _file, cb) => {
        cb(null, `${crypto.randomUUID()}.pdf`);
    },
});

const fileFilter: multer.Options["fileFilter"] = (
    _req,
    file,
    cb
) => {
    const hasPdfExtension =
        path.extname(file.originalname).toLowerCase() === ".pdf";
    const hasPdfMimeType = file.mimetype === "application/pdf";

    if (!hasPdfExtension) {
        return cb(
            new UploadValidationError(
                "File harus memiliki ekstensi .pdf"
            )
        );
    }

    if (!hasPdfMimeType) {
        return cb(
            new UploadValidationError(
                "MIME type file harus application/pdf"
            )
        );
    }

    cb(null, true);
};

const uploadSinglePdf = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
    },
}).single("file");

export const uploadSkripsi: RequestHandler = (req, res, next) => {
    uploadSinglePdf(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        void deleteUploadedTempFile(req.file?.path);

        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({
                    message: "Ukuran file melebihi batas maksimal 10 MB",
                });
            }

            if (
                error.code === "LIMIT_FILE_COUNT" ||
                error.code === "LIMIT_UNEXPECTED_FILE"
            ) {
                return res.status(400).json({
                    message:
                        "Hanya satu file PDF yang dapat diunggah pada field 'file'",
                });
            }

            return res.status(400).json({
                message: "File yang diunggah tidak valid",
            });
        }

        if (error instanceof UploadValidationError) {
            return res.status(400).json({
                message: error.message,
            });
        }

        console.error("Gagal memproses upload skripsi:", error);

        return res.status(400).json({
            message: "File PDF tidak dapat diproses",
        });
    });
};
