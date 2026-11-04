import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type express from "express";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.JWT_EXPIRES_IN = "1h";
process.env.LOGIN_RATE_LIMIT_MAX = "1000";
process.env.REGISTER_RATE_LIMIT_MAX = "1000";
process.env.API_RATE_LIMIT_MAX = "10000";
process.env.UPLOAD_RATE_LIMIT_MAX = "1000";

interface InsertResult {
    insertId: number;
    affectedRows: number;
}

interface UserDbRow {
    id: number;
    role: "mahasiswa" | "kaprodi" | "tendik";
    status: "ACTIVE" | "PENDING_VERIFICATION" | "REJECTED";
    password: string;
    claim_nim: string | null;
    claim_program_studi: string | null;
    verified_by: number | null;
    verified_at: Date | null;
    reject_reason: string | null;
}

interface MahasiswaDbRow {
    id: number;
    nim: string;
    program_studi: string;
}

let app: express.Express;
let pool: {
    query: (
        sql: string,
        values?: unknown[]
    ) => Promise<[unknown, unknown]>;
    end: () => Promise<void>;
};

const suffix = crypto.randomBytes(6).toString("hex");
const password = "Registration123!";
const tendikEmail = `reg-tendik-${suffix}@example.com`;
const holderEmail = `reg-holder-${suffix}@example.com`;
const candidateEmail = `reg-candidate-${suffix}@example.com`;
const rejectedEmail = `reg-rejected-${suffix}@example.com`;

const holderNim = `8${crypto.randomInt(100000000, 999999999)}`;
const claimedNim = `7${crypto.randomInt(100000000, 999999999)}`;
const approvedNim = `5${crypto.randomInt(100000000, 999999999)}`;
const rejectedNim = `6${crypto.randomInt(100000000, 999999999)}`;

let tendikId = 0;
let holderId = 0;
let candidateId = 0;
let rejectedId = 0;

function authHeader(user: {
    id: number;
    email: string;
    role: "mahasiswa" | "kaprodi" | "tendik";
}): string {
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

async function findUser(email: string): Promise<UserDbRow | null> {
    const [rows] = await pool.query(
        `SELECT id, role, status, password, claim_nim, claim_program_studi,
                verified_by, verified_at, reject_reason
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
    );

    return (rows as unknown as UserDbRow[])[0] ?? null;
}

async function findMahasiswaByUserId(
    userId: number
): Promise<MahasiswaDbRow | null> {
    const [rows] = await pool.query(
        "SELECT id, nim, program_studi FROM mahasiswa WHERE user_id = ? LIMIT 1",
        [userId]
    );

    return (rows as unknown as MahasiswaDbRow[])[0] ?? null;
}

function registerPayload(email: string, nim?: string) {
    return {
        nama: "Calon Mahasiswa",
        email,
        password,
        ...(nim ? { nim } : {}),
        programStudi: "Informatika",
    };
}

before(async () => {
    app = (await import("../src/app.js")).default;
    const dbModule = await import("../src/db/index.js");
    pool = dbModule.pool as unknown as typeof pool;

    const passwordHash = await bcrypt.hash(password, 4);

    const [tendikInsert] = (await pool.query(
        "INSERT INTO users (nama, email, password, role, status) VALUES (?, ?, ?, 'tendik', 'ACTIVE')",
        ["Tendik Registrasi", tendikEmail, passwordHash]
    )) as [InsertResult, unknown];
    tendikId = tendikInsert.insertId;

    const [holderInsert] = (await pool.query(
        "INSERT INTO users (nama, email, password, role, status) VALUES (?, ?, ?, 'mahasiswa', 'ACTIVE')",
        ["Pemilik NIM", holderEmail, passwordHash]
    )) as [InsertResult, unknown];
    holderId = holderInsert.insertId;

    await pool.query(
        "INSERT INTO mahasiswa (user_id, nim, program_studi, peminatan) VALUES (?, ?, ?, NULL)",
        [holderId, holderNim, "Informatika"]
    );
});

after(async () => {
    try {
        if (pool) {
            const emails = [
                tendikEmail,
                holderEmail,
                candidateEmail,
                rejectedEmail,
            ];

            await pool.query(
                "DELETE FROM mahasiswa WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?, ?, ?))",
                emails
            );
            await pool.query(
                "DELETE FROM users WHERE email IN (?, ?, ?, ?)",
                emails
            );
        }
    } finally {
        if (pool) {
            await pool.end();
        }
    }
});

test("registrasi menolak format email, password, dan NIM yang tidak valid", async () => {
    const res = await request(app).post("/api/auth/register").send({
        nama: "A",
        email: "bukan-email",
        password: "pendek",
        nim: "abc",
        programStudi: "",
    });

    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
});

test("registrasi publik membuat akun mahasiswa PENDING dan mengabaikan role/status body", async () => {
    const res = await request(app)
        .post("/api/auth/register")
        .send({
            ...registerPayload(candidateEmail, claimedNim),
            role: "tendik",
            status: "ACTIVE",
        });

    assert.equal(res.status, 201);
    assert.equal(
        res.body.message,
        "Pendaftaran diterima, menunggu verifikasi Tendik"
    );
    assert.equal(res.body.token, undefined);

    const user = await findUser(candidateEmail);
    assert.ok(user);
    candidateId = user.id;

    assert.equal(user.role, "mahasiswa");
    assert.equal(user.status, "PENDING_VERIFICATION");
    assert.equal(user.claim_nim, claimedNim);
    assert.equal(user.claim_program_studi, "Informatika");
    assert.equal(user.verified_by, null);
    assert.equal(user.verified_at, null);
    assert.equal(user.reject_reason, null);
    assert.notEqual(user.password, password);
    assert.match(user.password, /^\$2[aby]\$/);

    const mahasiswaRow = await findMahasiswaByUserId(candidateId);
    assert.equal(mahasiswaRow, null);
});

test("registrasi dengan email yang sudah terdaftar ditolak 409", async () => {
    const res = await request(app)
        .post("/api/auth/register")
        .send(registerPayload(candidateEmail, claimedNim));

    assert.equal(res.status, 409);
    assert.match(String(res.body.message), /email sudah terdaftar/i);
});

test("login akun PENDING ditolak 403, password salah tetap 401 generik", async () => {
    const pending = await request(app).post("/api/auth/login").send({
        email: candidateEmail,
        password,
        role: "mahasiswa",
    });

    assert.equal(pending.status, 403);
    assert.match(String(pending.body.message), /menunggu verifikasi Tendik/i);
    assert.equal(pending.body.token, undefined);

    const wrongPassword = await request(app).post("/api/auth/login").send({
        email: candidateEmail,
        password: "PasswordSalah123!",
    });

    assert.equal(wrongPassword.status, 401);
    assert.equal(wrongPassword.body.message, "Email atau password salah");
    assert.doesNotMatch(
        String(wrongPassword.body.message),
        /verifikasi|tendik/i
    );

    const unknownEmail = await request(app).post("/api/auth/login").send({
        email: `tidak-ada-${suffix}@example.com`,
        password,
    });

    assert.equal(unknownEmail.status, 401);
    assert.equal(unknownEmail.body.message, "Email atau password salah");
});

test("endpoint Tendik hanya dapat diakses tendik dan mendukung filter pencarian", async () => {
    const anonymous = await request(app).get("/api/tendik/registrasi");
    assert.equal(anonymous.status, 401);

    const asMahasiswa = await request(app)
        .get("/api/tendik/registrasi")
        .set(
            "Authorization",
            authHeader({
                id: holderId,
                email: holderEmail,
                role: "mahasiswa",
            })
        );
    assert.equal(asMahasiswa.status, 403);

    const tendikToken = authHeader({
        id: tendikId,
        email: tendikEmail,
        role: "tendik",
    });

    const list = await request(app)
        .get("/api/tendik/registrasi")
        .query({
            status: "PENDING_VERIFICATION",
            q: candidateEmail,
            page: 1,
            limit: 10,
        })
        .set("Authorization", tendikToken);

    assert.equal(list.status, 200);
    assert.equal(list.body.page, 1);
    assert.equal(list.body.limit, 10);
    assert.equal(typeof list.body.total, "number");
    assert.ok(list.body.counts.PENDING_VERIFICATION >= 1);

    const row = (
        list.body.data as Array<{
            id: number;
            email: string;
            nimClaim: string | null;
            programStudiClaim: string | null;
            password?: string;
        }>
    ).find((item) => item.id === candidateId);

    assert.ok(row);
    assert.equal(row.email, candidateEmail);
    assert.equal(row.nimClaim, claimedNim);
    assert.equal(row.programStudiClaim, "Informatika");
    assert.equal(row.password, undefined);

    const invalidFilter = await request(app)
        .get("/api/tendik/registrasi")
        .query({ status: "DISABLED" })
        .set("Authorization", tendikToken);
    assert.equal(invalidFilter.status, 400);
});

test("approve menolak NIM duplikat dan tidak meninggalkan data parsial", async () => {
    const tendikToken = authHeader({
        id: tendikId,
        email: tendikEmail,
        role: "tendik",
    });

    const res = await request(app)
        .post(`/api/tendik/registrasi/${candidateId}/setujui`)
        .set("Authorization", tendikToken)
        .send({ nim: holderNim, programStudi: "Informatika" });

    assert.equal(res.status, 409);
    assert.match(String(res.body.message), /NIM sudah terdaftar/i);

    const user = await findUser(candidateEmail);
    assert.equal(user?.status, "PENDING_VERIFICATION");
    assert.equal(await findMahasiswaByUserId(candidateId), null);
});

test("approve mengaktifkan akun, membuat data mahasiswa, dan tidak dapat diulang", async () => {
    const tendikToken = authHeader({
        id: tendikId,
        email: tendikEmail,
        role: "tendik",
    });

    const invalid = await request(app)
        .post(`/api/tendik/registrasi/${candidateId}/setujui`)
        .set("Authorization", tendikToken)
        .send({ nim: "abc", programStudi: "Informatika" });
    assert.equal(invalid.status, 400);

    const res = await request(app)
        .post(`/api/tendik/registrasi/${candidateId}/setujui`)
        .set("Authorization", tendikToken)
        .send({ nim: approvedNim, programStudi: "Sistem Informasi" });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, candidateId);
    assert.equal(res.body.data.nim, approvedNim);
    assert.equal(res.body.data.programStudi, "Sistem Informasi");

    const user = await findUser(candidateEmail);
    assert.ok(user);
    assert.equal(user.status, "ACTIVE");
    assert.equal(user.claim_nim, approvedNim);
    assert.equal(user.claim_program_studi, "Sistem Informasi");
    assert.equal(user.verified_by, tendikId);
    assert.ok(user.verified_at);
    assert.equal(user.reject_reason, null);

    const mahasiswaRow = await findMahasiswaByUserId(candidateId);
    assert.ok(mahasiswaRow);
    assert.equal(mahasiswaRow.nim, approvedNim);
    assert.equal(mahasiswaRow.program_studi, "Sistem Informasi");

    const login = await request(app).post("/api/auth/login").send({
        email: candidateEmail,
        password,
        role: "mahasiswa",
    });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);
    assert.equal(login.body.user.role, "mahasiswa");

    const wrongRole = await request(app).post("/api/auth/login").send({
        email: candidateEmail,
        password,
        role: "tendik",
    });
    assert.equal(wrongRole.status, 401);
    assert.match(String(wrongRole.body.message), /role tidak sesuai/i);

    const activeList = await request(app)
        .get("/api/tendik/registrasi")
        .query({ status: "ACTIVE", q: candidateEmail })
        .set("Authorization", tendikToken);
    assert.equal(activeList.status, 200);
    assert.equal(activeList.body.total, 1);

    const pendingList = await request(app)
        .get("/api/tendik/registrasi")
        .query({ status: "PENDING_VERIFICATION", q: candidateEmail })
        .set("Authorization", tendikToken);
    assert.equal(pendingList.status, 200);
    assert.equal(pendingList.body.total, 0);

    const repeated = await request(app)
        .post(`/api/tendik/registrasi/${candidateId}/setujui`)
        .set("Authorization", tendikToken)
        .send({ nim: approvedNim, programStudi: "Sistem Informasi" });

    assert.equal(repeated.status, 409);
    assert.match(
        String(repeated.body.message),
        /sudah diproses sebelumnya/i
    );
});

test("reject wajib beralasan, menolak login dengan alasan, dan tidak dapat diulang", async () => {
    const registration = await request(app)
        .post("/api/auth/register")
        .send(registerPayload(rejectedEmail, rejectedNim));
    assert.equal(registration.status, 201);

    const candidate = await findUser(rejectedEmail);
    assert.ok(candidate);
    rejectedId = candidate.id;

    const tendikToken = authHeader({
        id: tendikId,
        email: tendikEmail,
        role: "tendik",
    });

    const withoutReason = await request(app)
        .post(`/api/tendik/registrasi/${rejectedId}/tolak`)
        .set("Authorization", tendikToken)
        .send({});
    assert.equal(withoutReason.status, 400);

    const reason = "Data NIM tidak sesuai dengan arsip akademik";
    const rejected = await request(app)
        .post(`/api/tendik/registrasi/${rejectedId}/tolak`)
        .set("Authorization", tendikToken)
        .send({ alasan: reason });
    assert.equal(rejected.status, 200);

    const user = await findUser(rejectedEmail);
    assert.ok(user);
    assert.equal(user.status, "REJECTED");
    assert.equal(user.reject_reason, reason);
    assert.equal(user.verified_by, tendikId);
    assert.ok(user.verified_at);

    const login = await request(app).post("/api/auth/login").send({
        email: rejectedEmail,
        password,
        role: "mahasiswa",
    });
    assert.equal(login.status, 403);
    assert.match(String(login.body.message), /ditolak oleh Tendik/i);
    assert.match(String(login.body.message), new RegExp(reason));
    assert.equal(login.body.token, undefined);

    const repeated = await request(app)
        .post(`/api/tendik/registrasi/${rejectedId}/tolak`)
        .set("Authorization", tendikToken)
        .send({ alasan: "Alasan lain yang tetap valid" });
    assert.equal(repeated.status, 409);

    const approveRejected = await request(app)
        .post(`/api/tendik/registrasi/${rejectedId}/setujui`)
        .set("Authorization", tendikToken)
        .send({ nim: rejectedNim, programStudi: "Informatika" });
    assert.equal(approveRejected.status, 409);

    const rejectedList = await request(app)
        .get("/api/tendik/registrasi")
        .query({ status: "REJECTED", q: rejectedEmail })
        .set("Authorization", tendikToken);
    assert.equal(rejectedList.status, 200);
    assert.equal(rejectedList.body.total, 1);
});

test("token lama tidak berlaku setelah akun ditolak atau dikembalikan ke PENDING", async () => {
    const login = await request(app).post("/api/auth/login").send({
        email: holderEmail,
        password,
        role: "mahasiswa",
    });
    assert.equal(login.status, 200);
    const token = String(login.body.token);

    const before = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
    assert.equal(before.status, 200);

    await pool.query(
        "UPDATE users SET status = 'REJECTED', reject_reason = ? WHERE id = ?",
        ["Akun dinonaktifkan untuk pengujian", holderId]
    );

    const rejected = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
    assert.equal(rejected.status, 401);
    assert.match(String(rejected.body.message), /ditolak oleh Tendik/i);

    await pool.query(
        "UPDATE users SET status = 'PENDING_VERIFICATION', reject_reason = NULL WHERE id = ?",
        [holderId]
    );

    const pending = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
    assert.equal(pending.status, 401);
    assert.match(String(pending.body.message), /menunggu verifikasi Tendik/i);
});
