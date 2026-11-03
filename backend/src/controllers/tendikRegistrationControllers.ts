import type { NextFunction, Response } from "express";
import { and, count, desc, eq, like, or } from "drizzle-orm";

import { db } from "../db/index.js";
import { mahasiswa } from "../db/mahasiswa.js";
import { users, type UserAccountStatus } from "../db/users.js";
import { AppError } from "../errors/AppError.js";
import type { AuthRequest } from "../middlewares/authMiddleware.js";
import {
    getValidatedQuery,
} from "../validation/validate.js";
import type {
    ApproveRegistrationInput,
    RejectRegistrationInput,
    TendikRegistrationQuery,
} from "../validation/schemas.js";

const EMPTY_COUNTS: Record<UserAccountStatus, number> = {
    ACTIVE: 0,
    PENDING_VERIFICATION: 0,
    REJECTED: 0,
};

function isDuplicateEntry(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        (error as { code?: unknown }).code === "ER_DUP_ENTRY"
    );
}

function parseId(value: string | undefined): number {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(400, "ID pendaftar tidak valid");
    }

    return id;
}

async function getStatusCounts(): Promise<Record<UserAccountStatus, number>> {
    const rows = await db
        .select({
            status: users.status,
            total: count(),
        })
        .from(users)
        .where(eq(users.role, "mahasiswa"))
        .groupBy(users.status);

    const counts = { ...EMPTY_COUNTS };

    for (const row of rows) {
        if (row.status in counts) {
            counts[row.status] = Number(row.total);
        }
    }

    return counts;
}

export async function getRegistrations(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const query = getValidatedQuery<TendikRegistrationQuery>(res);
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const conditions = [eq(users.role, "mahasiswa")];

        if (query.status) {
            conditions.push(eq(users.status, query.status));
        }

        if (query.q?.trim()) {
            const keyword = `%${query.q.trim()}%`;
            const searchCondition = or(
                like(users.nama, keyword),
                like(users.email, keyword),
                like(users.claimNim, keyword)
            );

            if (searchCondition) {
                conditions.push(searchCondition);
            }
        }

        const where = and(...conditions);

        const [rows, totalRows, counts] = await Promise.all([
            db
                .select({
                    id: users.id,
                    nama: users.nama,
                    email: users.email,
                    nimClaim: users.claimNim,
                    programStudiClaim: users.claimProgramStudi,
                    createdAt: users.createdAt,
                    status: users.status,
                    verifiedAt: users.verifiedAt,
                    rejectReason: users.rejectReason,
                })
                .from(users)
                .where(where)
                .orderBy(desc(users.createdAt), desc(users.id))
                .limit(limit)
                .offset((page - 1) * limit),
            db
                .select({ total: count() })
                .from(users)
                .where(where),
            getStatusCounts(),
        ]);

        return res.status(200).json({
            message: "Daftar registrasi mahasiswa berhasil diambil",
            data: rows,
            total: Number(totalRows[0]?.total ?? 0),
            page,
            limit,
            counts,
        });
    } catch (error) {
        next(error);
    }
}

export async function approveRegistration(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const id = parseId(req.params.id);
        const actorId = req.user?.id;

        if (!actorId) {
            throw new AppError(401, "Autentikasi diperlukan");
        }

        const { nim, programStudi } =
            req.body as ApproveRegistrationInput;

        let approved: {
            id: number;
            nama: string;
            email: string;
            nim: string;
            programStudi: string;
        };

        try {
            approved = await db.transaction(async (tx) => {
                const [target] = await tx
                    .select({
                        id: users.id,
                        nama: users.nama,
                        email: users.email,
                        role: users.role,
                        status: users.status,
                    })
                    .from(users)
                    .where(eq(users.id, id))
                    .limit(1)
                    .for("update");

                if (!target || target.role !== "mahasiswa") {
                    throw new AppError(404, "Pendaftar tidak ditemukan");
                }

                if (target.status !== "PENDING_VERIFICATION") {
                    throw new AppError(
                        409,
                        "Pendaftaran ini sudah diproses sebelumnya"
                    );
                }

                const [nimOwner] = await tx
                    .select({ id: mahasiswa.id })
                    .from(mahasiswa)
                    .where(eq(mahasiswa.nim, nim))
                    .limit(1);

                if (nimOwner) {
                    throw new AppError(409, "NIM sudah terdaftar");
                }

                const [existingMahasiswa] = await tx
                    .select({ id: mahasiswa.id })
                    .from(mahasiswa)
                    .where(eq(mahasiswa.userId, id))
                    .limit(1);

                if (existingMahasiswa) {
                    throw new AppError(
                        409,
                        "Akun ini sudah memiliki data mahasiswa"
                    );
                }

                await tx.insert(mahasiswa).values({
                    userId: id,
                    nim,
                    programStudi,
                    peminatan: null,
                });

                await tx
                    .update(users)
                    .set({
                        status: "ACTIVE",
                        verifiedBy: actorId,
                        verifiedAt: new Date(),
                        rejectReason: null,
                        claimNim: nim,
                        claimProgramStudi: programStudi,
                    })
                    .where(eq(users.id, id));

                return {
                    id: target.id,
                    nama: target.nama,
                    email: target.email,
                    nim,
                    programStudi,
                };
            });
        } catch (error) {
            if (isDuplicateEntry(error)) {
                throw new AppError(409, "NIM sudah terdaftar");
            }

            throw error;
        }

        return res.status(200).json({
            message: "Pendaftaran mahasiswa disetujui",
            data: approved,
        });
    } catch (error) {
        next(error);
    }
}

export async function rejectRegistration(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const id = parseId(req.params.id);
        const actorId = req.user?.id;

        if (!actorId) {
            throw new AppError(401, "Autentikasi diperlukan");
        }

        const { alasan } = req.body as RejectRegistrationInput;

        await db.transaction(async (tx) => {
            const [target] = await tx
                .select({
                    id: users.id,
                    role: users.role,
                    status: users.status,
                })
                .from(users)
                .where(eq(users.id, id))
                .limit(1)
                .for("update");

            if (!target || target.role !== "mahasiswa") {
                throw new AppError(404, "Pendaftar tidak ditemukan");
            }

            if (target.status !== "PENDING_VERIFICATION") {
                throw new AppError(
                    409,
                    "Pendaftaran ini sudah diproses sebelumnya"
                );
            }

            await tx
                .update(users)
                .set({
                    status: "REJECTED",
                    rejectReason: alasan,
                    verifiedBy: actorId,
                    verifiedAt: new Date(),
                })
                .where(eq(users.id, id));
        });

        return res.status(200).json({
            message: "Pendaftaran mahasiswa ditolak",
        });
    } catch (error) {
        next(error);
    }
}
