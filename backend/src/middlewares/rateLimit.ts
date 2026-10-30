import type { Request } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { authRateLimitConfig } from "../config/env.js";

function normalizedEmail(req: Request): string {
    const email = (req.body as { email?: unknown } | undefined)?.email;
    return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function clientIp(req: Request): string {
    return ipKeyGenerator(req.ip ?? "unknown");
}

function rateLimitHandler(message: string) {
    return (
        _req: Request,
        res: import("express").Response
    ): void => {
        const reset = res.getHeader("RateLimit-Reset");

        if (reset !== undefined) {
            res.setHeader("Retry-After", String(reset));
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
