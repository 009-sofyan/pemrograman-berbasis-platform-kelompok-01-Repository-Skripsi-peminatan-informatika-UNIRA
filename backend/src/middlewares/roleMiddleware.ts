
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./authMiddleware.js";

type UserRole = "mahasiswa" | "kaprodi" | "tendik";

export function allowRoles(...roles: UserRole[]) {
    return (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Silakan login terlebih dahulu",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Kamu tidak memiliki izin untuk mengakses fitur ini",
            });
        }

        next();
    };
}
