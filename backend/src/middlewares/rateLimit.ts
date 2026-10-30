import type { Request } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import {
    apiRateLimitConfig,
    authRateLimitConfig,
} from "../config/env.js";
import type { AuthRequest } from "./authMiddleware.js";

function normalizedEmail(req: Request): string {
    const email = (req.body as { email?: unknown } | undefined)?.email;
    return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function clientIp(req: Request): string {
    return ipKeyGenerator(req.ip ?? "unknown");
}

function rateLimitHandler(message: string) {
    return (
        req: Request,
        res: import("express").Response
    ): void => {
        const rateLimitInfo = (
            req as Request & {
                rateLimit?: { resetTime?: Date };
            }
        ).rateLimit;
        const resetTime = rateLimitInfo?.resetTime;
        const fallbackReset = res.getHeader("RateLimit-Reset");

        if (resetTime) {
            const retryAfter = Math.max(
                1,
                Math.ceil((resetTime.getTime() - Date.now()) / 1000)
            );

            res.setHeader("Retry-After", String(retryAfter));
        } else if (fallbackReset !== undefined) {
            res.setHeader("Retry-After", String(fallbackReset));
        }

        res.status(429).json({ message });
    };
}

/**
 * Login dibatasi per kombinasi IP + email dan hanya menghitung percobaan yang
 * gagal. Pengguna yang berhasil login tidak menghabiskan kuota.
 */
export const loginRateLimiter = rateLimit({
    windowMs: authRateLimitConfig.login.windowMs,
    limit: authRateLimitConfig.login.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        const email = normalizedEmail(req);
        const ip = clientIp(req);

        return email ? `${ip}:${email}` : ip;
    },
    handler: rateLimitHandler(
        "Terlalu banyak percobaan login. Silakan coba lagi nanti."
    ),
});

/**
 * Register dibatasi per IP karena tujuan utamanya mencegah pembuatan akun
 * massal, bukan membatasi email tertentu.
 */
export const registerRateLimiter = rateLimit({
    windowMs: authRateLimitConfig.register.windowMs,
    limit: authRateLimitConfig.register.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: rateLimitHandler(
        "Terlalu banyak permintaan registrasi. Silakan coba lagi nanti."
    ),
});

/**
 * Pagar umum untuk seluruh API. Batasnya jauh lebih longgar daripada login
 * agar pemakaian normal (dashboard, daftar skripsi, polling UI) tidak
 * terhambat.
 */
export const apiRateLimiter = rateLimit({
    windowMs: apiRateLimitConfig.api.windowMs,
    limit: apiRateLimitConfig.api.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: clientIp,
    handler: rateLimitHandler(
        "Terlalu banyak permintaan. Silakan coba lagi nanti."
    ),
});

/**
 * Upload memakai kuota per IP + akun terautentikasi. Middleware ini dipasang
 * setelah authMiddleware sehingga identitas pengguna sudah terverifikasi.
 */
export const uploadRateLimiter = rateLimit({
    windowMs: apiRateLimitConfig.upload.windowMs,
    limit: apiRateLimitConfig.upload.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => {
        const user = (req as AuthRequest).user;

        return `${clientIp(req)}:${user?.id ?? "anonymous"}`;
    },
    handler: rateLimitHandler(
        "Terlalu banyak unggahan file. Silakan coba lagi nanti."
    ),
});
