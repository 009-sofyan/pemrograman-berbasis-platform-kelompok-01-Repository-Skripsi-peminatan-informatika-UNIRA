import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { getJwtSecret } from "../config/env.js";
import { db } from "../db/index.js";
import { users } from "../db/users.js";
import { AppError } from "../errors/AppError.js";

export const USER_ROLES = ["mahasiswa", "kaprodi", "tendik"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface AuthUser {
    id: number;
    email: string;
    role: UserRole;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

function isUserRole(value: unknown): value is UserRole {
    return (
        typeof value === "string" &&
        (USER_ROLES as readonly string[]).includes(value)
    );
}

function tokenId(decoded: JwtPayload): number | null {
    const id = decoded.id;

    return typeof id === "number" &&
        Number.isSafeInteger(id) &&
        id > 0 &&
        id <= 2_147_483_647
        ? id
        : null;
}

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Token autentikasi tidak ditemukan",
            });
        }

        // Format yang diterima hanya "Bearer <token>" tanpa spasi tambahan
        // di dalam token.
        const match = /^Bearer\s+(\S+)$/i.exec(authHeader.trim());

        if (!match?.[1]) {
            return res.status(401).json({
                message: "Format token autentikasi tidak valid",
            });
        }

        let decoded: string | JwtPayload;

        try {
            decoded = jwt.verify(match[1], getJwtSecret(), {
                algorithms: ["HS256"],
            });
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(401).json({
                    message: "Token sudah kedaluwarsa. Silakan login kembali.",
                });
            }

            if (error instanceof jwt.NotBeforeError) {
                return res.status(401).json({
                    message: "Token belum berlaku",
                });
            }

            return res.status(401).json({
                message: "Token tidak valid",
            });
        }

        if (typeof decoded === "string") {
            return res.status(401).json({
                message: "Isi token tidak valid",
            });
        }

        const id = tokenId(decoded);

        if (id === null) {
            return res.status(401).json({
                message: "Isi token tidak valid",
            });
        }

        // Role diambil ulang dari database pada setiap request. Klaim role di
        // dalam token tidak pernah menjadi sumber otorisasi.
        const [currentUser] = await db
            .select({
                id: users.id,
                email: users.email,
                role: users.role,
            })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!currentUser) {
            return res.status(401).json({
                message: "Sesi tidak valid. Silakan login kembali.",
            });
        }

        if (!isUserRole(currentUser.role)) {
            next(new AppError(403, "Role pengguna tidak valid"));
            return;
        }

        req.user = {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
        };

        next();
    } catch (error) {
        next(error);
    }
}
