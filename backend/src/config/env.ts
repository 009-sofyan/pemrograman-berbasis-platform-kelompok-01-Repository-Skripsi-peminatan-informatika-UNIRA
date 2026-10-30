import "dotenv/config";
import jwt, { type SignOptions } from "jsonwebtoken";

const NODE_ENV = process.env.NODE_ENV ?? "development";
export const isProduction = NODE_ENV === "production";

function readPositiveInt(name: string, fallback: number): number {
    const raw = process.env[name]?.trim();

    if (!raw) return fallback;

    const value = Number(raw);

    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} harus berupa bilangan bulat positif`);
    }

    return value;
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

/**
 * Batas login/register dapat diatur lewat environment. Nilai default dibuat
 * lebih longgar di development agar pengujian manual tidak cepat terblokir,
 * sedangkan production memakai batas yang lebih ketat.
 */
export const authRateLimitConfig = {
    login: {
        windowMs: readPositiveInt(
            "LOGIN_RATE_LIMIT_WINDOW_MS",
            FIFTEEN_MINUTES
        ),
        limit: readPositiveInt(
            "LOGIN_RATE_LIMIT_MAX",
            isProduction ? 10 : 50
        ),
    },
    register: {
        windowMs: readPositiveInt(
            "REGISTER_RATE_LIMIT_WINDOW_MS",
            ONE_HOUR
        ),
        limit: readPositiveInt(
            "REGISTER_RATE_LIMIT_MAX",
            isProduction ? 5 : 20
        ),
    },
} as const;

/**
 * API umum dan upload memakai kuota terpisah. Nilai default sengaja longgar
 * agar navigasi normal tidak terhambat, tetapi tetap membatasi penyalahgunaan.
 */
export const apiRateLimitConfig = {
    api: {
        windowMs: readPositiveInt(
            "API_RATE_LIMIT_WINDOW_MS",
            FIFTEEN_MINUTES
        ),
        limit: readPositiveInt(
            "API_RATE_LIMIT_MAX",
            isProduction ? 600 : 3000
        ),
    },
    upload: {
        windowMs: readPositiveInt(
            "UPLOAD_RATE_LIMIT_WINDOW_MS",
            ONE_HOUR
        ),
        limit: readPositiveInt(
            "UPLOAD_RATE_LIMIT_MAX",
            isProduction ? 20 : 100
        ),
    },
} as const;

export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret || !secret.trim()) {
        throw new Error("JWT_SECRET wajib diatur di environment");
    }

    return secret;
}

export function getJwtExpiresIn(): string {
    const value = process.env.JWT_EXPIRES_IN?.trim();
    return value || "1d";
}

/**
 * jsonwebtoken baru memvalidasi format expiresIn saat token dibuat. Dengan
 * menandatangani token dummy ketika startup, konfigurasi yang salah tidak
 * menunggu sampai request login pertama.
 */
function validateJwtExpiresIn(): void {
    try {
        jwt.sign({}, getJwtSecret(), {
            algorithm: "HS256",
            expiresIn: getJwtExpiresIn() as NonNullable<
                SignOptions["expiresIn"]
            >,
        });
    } catch {
        throw new Error(
            "JWT_EXPIRES_IN tidak valid. Gunakan format seperti 1d, 12h, atau 30m"
        );
    }
}

/**
 * Dipanggil sekali saat startup (index.ts). Request handler tetap memakai
 * getJwtSecret(), tetapi konfigurasi yang salah akan menghentikan aplikasi
 * lebih awal, bukan menunggu request pertama masuk.
 */
export function validateEnvironment(): void {
    const secret = getJwtSecret();

    if (isProduction && secret.length < 32) {
        throw new Error(
            "JWT_SECRET production minimal 32 karakter agar tidak mudah ditebak"
        );
    }

    if (isProduction && secret === "your_jwt_secret") {
        throw new Error(
            "JWT_SECRET masih memakai nilai contoh. Ganti sebelum production"
        );
    }

    validateJwtExpiresIn();

    // Memicu validasi konfigurasi rate limit saat startup.
    void authRateLimitConfig;
    void apiRateLimitConfig;
}

export function getTrustProxy(): boolean | number | string {
    const raw = process.env.TRUST_PROXY?.trim();

    if (!raw) return false;
    if (raw === "true") return true;
    if (raw === "false") return false;
    if (/^\d+$/.test(raw)) return Number(raw);

    return raw;
}
