import type { ErrorRequestHandler, RequestHandler } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

interface ErrorRecord {
    [key: string]: unknown;
}

function asErrorRecord(error: unknown): ErrorRecord | null {
    return typeof error === "object" && error !== null
        ? (error as ErrorRecord)
        : null;
}

function zodErrorBody(error: ZodError) {
    const errors = error.issues.map((issue) => {
        const message =
            issue.code === "unrecognized_keys"
                ? `Field tidak diizinkan: ${issue.keys.join(", ")}`
                : issue.message;

        return {
            field:
                issue.path.length > 0
                    ? issue.path.map(String).join(".")
                    : "body",
            message,
        };
    });

    return {
        message: errors[0]?.message ?? "Data permintaan tidak valid",
        errors,
    };
}

function duplicateEntryMessage(sqlMessage: string | undefined): string {
    const text = (sqlMessage ?? "").toLowerCase();

    if (text.includes("email")) {
        return "Email sudah terdaftar";
    }

    if (text.includes("nim")) {
        return "NIM sudah terdaftar";
    }

    return "Data sudah terdaftar";
}

/**
 * Handler 404 dipasang setelah seluruh route. Respons tetap JSON agar klien
 * tidak menerima halaman HTML default Express.
 */
export const notFoundHandler: RequestHandler = (_req, res) => {
    res.status(404).json({
        message: "Endpoint tidak ditemukan",
    });
};

/**
 * Semua error yang diteruskan ke next(error) berakhir di sini. Detail internal
 * hanya dicatat di log server dan tidak pernah dikirim ke klien.
 */
export const errorHandler: ErrorRequestHandler = (
    error,
    req,
    res,
    next
) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error instanceof ZodError) {
        res.status(400).json(zodErrorBody(error));
        return;
    }

    if (error instanceof MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            res.status(413).json({
                message: "Ukuran file melebihi batas maksimal 10 MB",
            });
            return;
        }

        res.status(400).json({
            message: "File yang diunggah tidak valid",
        });
        return;
    }

    const record = asErrorRecord(error);

    if (record?.type === "entity.parse.failed") {
        res.status(400).json({
            message: "Format JSON tidak valid",
        });
        return;
    }

    if (record?.type === "entity.too.large" || record?.status === 413) {
        res.status(413).json({
            message: "Ukuran request terlalu besar",
        });
        return;
    }

    if (record?.code === "ER_DUP_ENTRY") {
        res.status(409).json({
            message: duplicateEntryMessage(
                typeof record.sqlMessage === "string"
                    ? record.sqlMessage
                    : typeof record.message === "string"
                      ? record.message
                      : undefined
            ),
        });
        return;
    }

    if (error instanceof AppError) {
        if (error.statusCode >= 500) {
            console.error(
                `[${req.method} ${req.originalUrl}]`,
                error
            );

            res.status(error.statusCode).json({
                message: "Terjadi kesalahan pada server",
            });
            return;
        }

        res.status(error.statusCode).json({
            message: error.message,
        });
        return;
    }

    // Error database MySQL lain (koneksi putus, akses ditolak, query gagal)
    // sengaja tidak diteruskan detailnya ke klien.
    if (
        typeof record?.code === "string" &&
        (record.code.startsWith("ER_") ||
            record.code === "ECONNREFUSED" ||
            record.code === "PROTOCOL_CONNECTION_LOST")
    ) {
        console.error(`[${req.method} ${req.originalUrl}]`, error);

        res.status(500).json({
            message: "Terjadi kesalahan pada server",
        });
        return;
    }

    console.error(`[${req.method} ${req.originalUrl}]`, error);

    res.status(500).json({
        message: "Terjadi kesalahan pada server",
    });
};
