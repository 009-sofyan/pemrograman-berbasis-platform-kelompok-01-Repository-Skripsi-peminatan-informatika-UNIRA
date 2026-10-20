import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET belum diatur di file .env");
    }
    return secret;
}

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: "mahasiswa" | "kaprodi" | "tendik";
    };
}

export function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Token autentinkasi tidak ditemukan",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token autentikasi tidak valid",
            });
        }

        const decoded = jwt.verify(token, getJwtSecret());
        
        if (
            typeof decoded === "string" ||
            typeof decoded.id !== "number" ||
            typeof decoded.email !== "string" ||
            !["mahasiswa", "kaprodi", "tendik"].includes(decoded.role as string)
        ) {
            return res.status(401).json({
                message: "Isi token tidak valid",
            });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role as "mahasiswa" | "kaprodi" | "tendik",
        };

        next();
    } catch {
        return res.status(401).json({
            message: "Token tidak valid atau sudah kedaluwarsa",
        });
    }
}