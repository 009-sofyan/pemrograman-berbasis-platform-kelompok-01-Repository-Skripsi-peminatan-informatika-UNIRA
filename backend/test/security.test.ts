import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import {
    createSkripsiSchema,
    emptyBodySchema,
    idParamSchema,
    loginSchema,
    skripsiListQuerySchema,
} from "../src/validation/schemas.js";
import { validateBody } from "../src/validation/validate.js";
import { allowRoles } from "../src/middlewares/roleMiddleware.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.JWT_EXPIRES_IN = "1h";
process.env.LOGIN_RATE_LIMIT_MAX = "1000";
process.env.REGISTER_RATE_LIMIT_MAX = "1000";
process.env.API_RATE_LIMIT_MAX = "10000";
process.env.UPLOAD_RATE_LIMIT_MAX = "1000";

interface UserRow {
    id: number;
    email: string;
    role: "mahasiswa" | "kaprodi" | "tendik";
}

let app: express.Express;
let pool: {
    query: (
        sql: string,
        values?: unknown[]
    ) => Promise<[Record<string, unknown>[], unknown]>;
    end: () => Promise<void>;
};
let db: { select: (...args: unknown[]) => unknown };
let login: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => Promise<unknown>;
let canAccessSkripsi: (
    role: UserRow["role"],
    viewerMahasiswaId: number | null,
    skripsiMahasiswaId: number,
    status: "draft" | "diajukan" | "disetujui" | "ditolak"
) => boolean;
let errorHandler: express.ErrorRequestHandler;
let uploadDir: string;

let mahasiswaUser: UserRow;
let kaprodiUser: UserRow;
let mahasiswaId: number | null;

function authHeader(user: UserRow): string {
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET as string,
        {
            algorithm: "HS256",
            expiresIn: "10m",
        }
    );

    return `Bearer ${token}`;
}

before(async () => {
    app = (await import("../src/app.js")).default;
    const dbModule = await import("../src/db/index.js");
    pool = dbModule.pool as unknown as typeof pool;
    db = dbModule.db as unknown as typeof db;
    ({ login } = await import("../src/controllers/authControllers.js"));
    ({ canAccessSkripsi } = await import(
        "../src/controllers/skripsiControllers.js"
    ));
    ({ errorHandler } = await import("../src/middlewares/errorHandler.js"));
    ({ SKRIPSI_UPLOAD_DIR: uploadDir } = await import(
        "../src/utils/uploads.js"
    ));

    const [users] = await pool.query(
        "SELECT id, email, role FROM users WHERE role IN ('mahasiswa','kaprodi') ORDER BY id"
    );
    const rows = users as unknown as UserRow[];
    const mahasiswa = rows.find((user) => user.role === "mahasiswa");
    const kaprodi = rows.find((user) => user.role === "kaprodi");

    assert.ok(mahasiswa, "Butuh minimal satu akun mahasiswa di database");
    assert.ok(kaprodi, "Butuh minimal satu akun kaprodi di database");

    mahasiswaUser = mahasiswa;
    kaprodiUser = kaprodi;

    const [mahasiswaRows] = await pool.query(
        "SELECT id FROM mahasiswa WHERE user_id = ? LIMIT 1",
        [mahasiswa.id]
    );
    const mahasiswaRow = (mahasiswaRows as unknown as { id: number }[])[0];
    mahasiswaId = mahasiswaRow?.id ?? null;
});

after(async () => {
    await pool.end();
});

test("schema menolak input tidak valid dan properti tambahan", () => {
    assert.equal(
        loginSchema.safeParse({
            email: "user@example.com",
            password: "secret",
        }).success,
        true
    );

    assert.equal(
        loginSchema.safeParse({
            email: "user@example.com",
            password: "secret",
            role: "kaprodi",
        }).success,
        true
    );

    assert.equal(
        loginSchema.safeParse({
            email: "user@example.com",
            password: "secret",
            role: "admin",
        }).success,
        false
    );

    assert.equal(
        loginSchema.safeParse({
            email: "user@example.com",
            password: "secret",
            fieldTambahan: true,
        }).success,
        false
    );

    assert.equal(
        createSkripsiSchema.safeParse({
            judul: "Judul skripsi yang valid",
            tahun: 2026,
        }).success,
        true
    );

    assert.equal(
        createSkripsiSchema.safeParse({
            judul: "x",
            tahun: 1800,
            extra: true,
        }).success,
        false
    );

    assert.equal(
        skripsiListQuerySchema.safeParse({ tahun: "2026" }).success,
        true
    );
    assert.equal(
        skripsiListQuerySchema.safeParse({ tahun: "1800" }).success,
        false
    );
    assert.equal(
        skripsiListQuerySchema.safeParse({ unexpected: "x" }).success,
        false
    );

    assert.equal(idParamSchema.safeParse({ id: "1" }).success, true);
    assert.equal(idParamSchema.safeParse({ id: "0" }).success, false);
    assert.equal(idParamSchema.safeParse({ id: "abc" }).success, false);

    assert.equal(emptyBodySchema.safeParse(undefined).success, true);
    assert.equal(emptyBodySchema.safeParse({}).success, true);
    assert.equal(emptyBodySchema.safeParse({ extra: true }).success, false);
});

test("startup gagal jika JWT_SECRET kosong atau JWT_EXPIRES_IN tidak valid", async () => {
    const { validateEnvironment } = await import("../src/config/env.js");
    const originalSecret = process.env.JWT_SECRET;
    const originalExpires = process.env.JWT_EXPIRES_IN;

    try {
        delete process.env.JWT_SECRET;
        assert.throws(() => validateEnvironment(), /JWT_SECRET/);

        process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
        process.env.JWT_EXPIRES_IN = "bukan-format";
        assert.throws(() => validateEnvironment(), /JWT_EXPIRES_IN/);
    } finally {
        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }

        if (originalExpires === undefined) {
            delete process.env.JWT_EXPIRES_IN;
        } else {
            process.env.JWT_EXPIRES_IN = originalExpires;
        }
    }
});

test("login menerima kredensial benar dan menolak password salah", async () => {
    const password = "CorrectPassword123!";
    const passwordHash = await bcrypt.hash(password, 4);
    const fakeUser = {
        id: 987654,
        nama: "Login Test",
        email: "login-test@example.com",
        password: passwordHash,
        role: "mahasiswa",
        createdAt: new Date(),
    };

    const mutableDb = db as unknown as {
        select: (...args: unknown[]) => unknown;
    };
    const originalSelect = mutableDb.select;

    mutableDb.select = () => ({
        from: () => ({
            where: () => ({
                limit: async () => [fakeUser],
            }),
        }),
    });

    const miniApp = express();
    miniApp.use(express.json());
    miniApp.post("/login", login);
    miniApp.use(errorHandler);

    try {
        const success = await request(miniApp)
            .post("/login")
            .send({ email: fakeUser.email, password, role: "mahasiswa" });

        assert.equal(success.status, 200);
        assert.ok(success.body.token);
        assert.equal(success.body.user.role, "mahasiswa");
        assert.equal(success.body.user.password, undefined);

        const decoded = jwt.verify(
            success.body.token,
            process.env.JWT_SECRET as string,
            { algorithms: ["HS256"] }
        );

        assert.equal(typeof decoded, "object");
        assert.equal((decoded as jwt.JwtPayload).role, "mahasiswa");

        const failure = await request(miniApp)
            .post("/login")
            .send({ email: fakeUser.email, password: "wrong-password" });

        assert.equal(failure.status, 401);
        assert.equal(failure.body.token, undefined);

        const roleMismatch = await request(miniApp)
            .post("/login")
            .send({ email: fakeUser.email, password, role: "kaprodi" });

        assert.equal(roleMismatch.status, 401);
        assert.match(roleMismatch.body.message, /role tidak sesuai/i);
        assert.equal(roleMismatch.body.token, undefined);
    } finally {
        mutableDb.select = originalSelect;
    }
});

test("login dengan body tidak valid ditolak 400", async () => {
    const res = await request(app).post("/api/auth/login").send({
        email: "bukan-email",
        password: "",
        role: "kaprodi",
    });

    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
});

test("JWT tidak ada, rusak, kedaluwarsa, dan algoritma salah ditolak 401", async () => {
    const missing = await request(app).get("/api/auth/me");
    assert.equal(missing.status, 401);

    const malformed = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer bukan.token.valid");
    assert.equal(malformed.status, 401);

    const expired = jwt.sign(
        {
            id: mahasiswaUser.id,
            email: mahasiswaUser.email,
            role: mahasiswaUser.role,
        },
        process.env.JWT_SECRET as string,
        { algorithm: "HS256", expiresIn: -10 }
    );

    const expiredResponse = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expired}`);
    assert.equal(expiredResponse.status, 401);
    assert.match(expiredResponse.body.message, /kedaluwarsa/i);

    const wrongAlgorithm = jwt.sign(
        {
            id: mahasiswaUser.id,
            email: mahasiswaUser.email,
            role: mahasiswaUser.role,
        },
        process.env.JWT_SECRET as string,
        { algorithm: "HS512", expiresIn: "5m" }
    );

    const wrongAlgorithmResponse = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${wrongAlgorithm}`);
    assert.equal(wrongAlgorithmResponse.status, 401);
});

test("token valid mengambil role dari database dan tidak mengembalikan password", async () => {
    const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", authHeader(mahasiswaUser));

    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, "mahasiswa");
    assert.equal(res.body.user.password, undefined);
});

test("middleware role menolak user tanpa role yang sesuai", async () => {
    const denied = await request(app)
        .get("/api/persetujuan")
        .set("Authorization", authHeader(mahasiswaUser));
    assert.equal(denied.status, 403);

    const kaprodiDenied = await request(app)
        .get("/api/mahasiswa")
        .set("Authorization", authHeader(kaprodiUser));
    assert.equal(kaprodiDenied.status, 403);

    const anonymous = await request(app).get("/api/skripsi");
    assert.equal(anonymous.status, 401);
});

test("allowRoles mengembalikan 401/403 dan meneruskan role yang sah", () => {
    function invoke(
        roles: ("mahasiswa" | "kaprodi" | "tendik")[],
        user?: UserRow
    ) {
        const result: {
            status: number;
            body: { message?: string } | null;
            next: boolean;
        } = { status: 0, body: null, next: false };

        const req = { user } as unknown as express.Request;
        const res = {
            status(code: number) {
                result.status = code;
                return res;
            },
            json(body: { message?: string }) {
                result.body = body;
                return res;
            },
        } as unknown as express.Response;

        allowRoles(...roles)(req, res, () => {
            result.next = true;
        });

        return result;
    }

    assert.equal(invoke(["kaprodi"]).status, 401);
    assert.equal(
        invoke(["kaprodi"], {
            id: 1,
            email: "m@example.com",
            role: "mahasiswa",
        }).status,
        403
    );
    assert.equal(
        invoke(["kaprodi"], {
            id: 2,
            email: "k@example.com",
            role: "kaprodi",
        }).next,
        true
    );
});

test("aturan akses Tahap 1 menolak draft milik orang lain", () => {
    assert.equal(canAccessSkripsi("mahasiswa", 1, 2, "draft"), false);
    assert.equal(canAccessSkripsi("mahasiswa", 1, 2, "ditolak"), false);
    assert.equal(canAccessSkripsi("mahasiswa", 1, 1, "draft"), true);
    assert.equal(canAccessSkripsi("mahasiswa", 1, 2, "disetujui"), true);
    assert.equal(canAccessSkripsi("kaprodi", null, 2, "draft"), true);
    assert.equal(canAccessSkripsi("tendik", null, 2, "ditolak"), true);
});

test("daftar skripsi mahasiswa hanya berisi milik sendiri atau yang disetujui", async () => {
    const res = await request(app)
        .get("/api/skripsi")
        .set("Authorization", authHeader(mahasiswaUser));

    assert.equal(res.status, 200);

    for (const row of res.body.data as Array<{
        status: string;
        mahasiswaId: number;
    }>) {
        assert.ok(
            row.status === "disetujui" || row.mahasiswaId === mahasiswaId,
            `Skripsi ${row.mahasiswaId} berstatus ${row.status} tidak boleh terlihat`
        );
    }
});

test("detail draft milik mahasiswa lain menghasilkan 404", async (t) => {
    if (mahasiswaId === null) {
        t.skip("Akun mahasiswa tidak memiliki data akademik");
        return;
    }

    const [drafts] = await pool.query(
        "SELECT id FROM skripsi WHERE status IN ('draft','ditolak') AND mahasiswa_id <> ? LIMIT 1",
        [mahasiswaId]
    );
    const draft = (drafts as unknown as { id: number }[])[0];

    if (!draft) {
        t.skip("Tidak ada data draft/ditolak milik mahasiswa lain");
        return;
    }

    const res = await request(app)
        .get(`/api/skripsi/${draft.id}`)
        .set("Authorization", authHeader(mahasiswaUser));

    assert.equal(res.status, 404);
});

test("katalog publik hanya berisi skripsi disetujui", async () => {
    const res = await request(app).get("/api/skripsi/public");

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));

    for (const row of res.body.data as Array<{ status: string }>) {
        assert.equal(row.status, "disetujui");
    }
});

test("download PDF wajib autentikasi dan tetap berfungsi untuk data sah", async (t) => {
    const anonymous = await request(app).get(
        "/api/skripsi/1/download"
    );
    assert.equal(anonymous.status, 401);

    const [files] = await pool.query(
        "SELECT id FROM skripsi WHERE status = 'disetujui' AND file_url IS NOT NULL LIMIT 1"
    );
    const file = (files as unknown as { id: number }[])[0];

    if (!file) {
        t.skip("Tidak ada skripsi disetujui dengan file PDF");
        return;
    }

    const res = await request(app)
        .get(`/api/skripsi/${file.id}/download`)
        .set("Authorization", authHeader(mahasiswaUser));

    assert.equal(res.status, 200);
    assert.match(String(res.headers["content-type"]), /application\/pdf/);
});

test("upload ditolak untuk skripsi yang tidak berstatus draft/ditolak", async (t) => {
    if (mahasiswaId === null) {
        t.skip("Akun mahasiswa tidak memiliki data akademik");
        return;
    }

    const [rows] = await pool.query(
        "SELECT id FROM skripsi WHERE mahasiswa_id = ? AND status NOT IN ('draft','ditolak') LIMIT 1",
        [mahasiswaId]
    );
    const skripsiRow = (rows as unknown as { id: number }[])[0];

    if (!skripsiRow) {
        t.skip("Tidak ada skripsi berstatus final milik akun mahasiswa");
        return;
    }

    const beforeFiles = fs.readdirSync(uploadDir).length;
    const res = await request(app)
        .post(`/api/skripsi/${skripsiRow.id}/upload`)
        .set("Authorization", authHeader(mahasiswaUser))
        .attach("file", Buffer.from("%PDF-1.4\n%%EOF\n"), "test.pdf");
    const afterFiles = fs.readdirSync(uploadDir).length;

    assert.equal(res.status, 409);
    assert.equal(afterFiles, beforeFiles);
});

test("ID tidak valid, body tambahan, dan query tambahan ditolak 400", async () => {
    const invalidId = await request(app)
        .get("/api/skripsi/abc")
        .set("Authorization", authHeader(mahasiswaUser));
    assert.equal(invalidId.status, 400);

    const invalidCreate = await request(app)
        .post("/api/skripsi")
        .set("Authorization", authHeader(mahasiswaUser))
        .send({
            judul: "x",
            tahun: 1800,
            fieldTambahan: true,
        });
    assert.equal(invalidCreate.status, 400);

    const invalidSubmit = await request(app)
        .patch("/api/skripsi/1/submit")
        .set("Authorization", authHeader(mahasiswaUser))
        .send({ fieldTambahan: true });
    assert.equal(invalidSubmit.status, 400);

    const invalidApprove = await request(app)
        .patch("/api/persetujuan/1/approve")
        .set("Authorization", authHeader(kaprodiUser))
        .send({ fieldTambahan: true });
    assert.equal(invalidApprove.status, 400);

    const invalidPemetaan = await request(app)
        .get("/api/pemetaan?tahun=2026")
        .set("Authorization", authHeader(mahasiswaUser));
    assert.equal(invalidPemetaan.status, 400);

    const invalidDashboard = await request(app)
        .get("/api/dashboard?takDikenal=1")
        .set("Authorization", authHeader(mahasiswaUser));
    assert.equal(invalidDashboard.status, 400);
});

test("pemetaan publik mengembalikan agregat per angkatan", async () => {
    const res = await request(app).get("/api/pemetaan");

    assert.equal(res.status, 200);
    assert.equal(typeof res.body.totalMahasiswa, "number");
    assert.equal(typeof res.body.totalMemilih, "number");
    assert.ok(Array.isArray(res.body.data));
    assert.ok(Array.isArray(res.body.byAngkatan));

    for (const item of res.body.byAngkatan as {
        angkatan: string;
        totalMahasiswa: number;
        bi: number;
        sa: number;
        belumMemilih: number;
        lainnya: number;
    }[]) {
        assert.match(item.angkatan, /^\d{4}$/);
        assert.equal(typeof item.totalMahasiswa, "number");
        assert.equal(typeof item.bi, "number");
        assert.equal(typeof item.sa, "number");
        assert.equal(typeof item.belumMemilih, "number");
        assert.equal(typeof item.lainnya, "number");
    }
});

test("route tidak dikenal menghasilkan 404 dan JSON rusak menghasilkan 400", async () => {
    const notFound = await request(app)
        .get("/api/route-tidak-ada")
        .set("Authorization", authHeader(mahasiswaUser));
    assert.equal(notFound.status, 404);

    const malformed = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send("{");
    assert.equal(malformed.status, 400);
    assert.match(malformed.body.message, /json/i);
});

test("error handler tidak membocorkan stack trace atau pesan internal", async () => {
    const miniApp = express();
    miniApp.get("/boom", () => {
        throw new Error("internal-secret-database-password");
    });
    miniApp.post(
        "/zod",
        express.json(),
        validateBody(createSkripsiSchema),
        (_req, res) => {
            res.json({ ok: true });
        }
    );
    miniApp.use(errorHandler);

    const originalConsoleError = console.error;
    console.error = () => undefined;

    try {
        const internal = await request(miniApp).get("/boom");
        assert.equal(internal.status, 500);
        assert.equal(
            internal.body.message,
            "Terjadi kesalahan pada server"
        );
        assert.equal(internal.body.stack, undefined);
        assert.doesNotMatch(
            JSON.stringify(internal.body),
            /internal-secret/
        );

        const validation = await request(miniApp)
            .post("/zod")
            .send({ judul: "x", tahun: 1800 });
        assert.equal(validation.status, 400);
        assert.ok(Array.isArray(validation.body.errors));
    } finally {
        console.error = originalConsoleError;
    }
});
