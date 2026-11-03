import crypto from "node:crypto";
import type { RequestHandler } from "express";
import multer from "multer";
import {
    COVER_UPLOAD_DIR,
    deleteUploadedTempFile,
} from "../utils/uploads.js";

const COVER_MAX_SIZE = 2 * 1024 * 1024;

class CoverUploadValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CoverUploadValidationError";
    }
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, COVER_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const extension = file.mimetype === "image/png" ? ".png" : ".jpg";
        cb(null, `${crypto.randomUUID()}${extension}`);
    },
});

const fileFilter: multer.Options["fileFilter"] = (
    _req,
    file,
    cb
) => {
    if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
        return cb(
            new CoverUploadValidationError(
                "Format cover harus JPG atau PNG"
            )
        );
    }

    cb(null, true);
};

const uploadSingleCover = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: COVER_MAX_SIZE,
        files: 1,
    },
}).single("cover");

export const uploadSkripsiCover: RequestHandler = (req, res, next) => {
    uploadSingleCover(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        void deleteUploadedTempFile(req.file?.path);

        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({
                    message:
                        "Ukuran cover melebihi batas maksimal 2 MB",
                });
            }

            if (
                error.code === "LIMIT_FILE_COUNT" ||
                error.code === "LIMIT_UNEXPECTED_FILE"
            ) {
                return res.status(400).json({
                    message:
                        "Hanya satu cover yang dapat diunggah pada field 'cover'",
                });
            }

            return res.status(400).json({
                message: "Cover yang diunggah tidak valid",
            });
        }

        if (error instanceof CoverUploadValidationError) {
            return res.status(400).json({
                message: error.message,
            });
        }

        console.error("Gagal memproses upload cover skripsi:", error);

        return res.status(400).json({
            message: "Cover tidak dapat diproses",
        });
    });
};
