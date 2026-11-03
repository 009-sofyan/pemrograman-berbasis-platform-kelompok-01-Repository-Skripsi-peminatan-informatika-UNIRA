import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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

interface UserRow {
    id: number;
    email: string;
    role: "mahasiswa" | "kaprodi" | "tendik";
}

interface InsertResult {
    insertId: number;
    affectedRows: number;
}

const PNG_SIGNATURE = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const VALID_PNG = Buffer.concat([
    PNG_SIGNATURE,
    Buffer.from("cover-test-image"),
]);
const TOO_LARGE_PNG = Buffer.alloc(2 * 1024 * 1024 + 1);
PNG_SIGNATURE.copy(TOO_LARGE_PNG);

let app: express.Express;
let pool: {
    query: (
        sql: string,
        values?: unknown[]
    ) => Promise<[unknown, unknown]>;
    end: () => Promise<void>;
};
let coverDir: string;
let tempUploadDir: string;

let ownerUser: UserRow;
let otherUser: UserRow;
let ownerUserId = 0;
let otherUserId = 0;
let ownerMahasiswaId = 0;
let otherMahasiswaId = 0;
let skripsiId = 0;
let extraSkripsiId = 0;
let coverUrl: string | null = null;

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
    tempUploadDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "unira-cover-test-")
    );
    process.env.UPLOAD_DIR = tempUploadDir;

    app = (await import("../src/app.js")).default;
    const dbModule = await import("../src/db/index.js");
    pool = dbModule.pool as unknown as typeof pool;
    const uploads = await import("../src/utils/uploads.js");
    coverDir = uploads.COVER_UPLOAD_DIR;

    const suffix = crypto.randomBytes(6).toString("hex");
    const passwordHash = await bcrypt.hash("CoverTest123!", 4);

    const ownerEmail = `cover-owner-${suffix}@example.com`;
    const otherEmail = `cover-other-${suffix}@example.com`;

    const [ownerInsert] = (await pool.query(
        "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, 'mahasiswa')",
        ["Cover Owner", ownerEmail, passwordHash]
    )) as [InsertResult, unknown];
    ownerUserId = ownerInsert.insertId;
    ownerUser = {
        id: ownerUserId,
        email: ownerEmail,
        role: "mahasiswa",
    };

    const [otherInsert] = (await pool.query(
        "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, 'mahasiswa')",
        ["Cover Other", otherEmail, passwordHash]
    )) as [InsertResult, unknown];
    otherUserId = otherInsert.insertId;
    otherUser = {
        id: otherUserId,
        email: otherEmail,
        role: "mahasiswa",
    };

    const [ownerMahasiswa] = (await pool.query(
        "INSERT INTO mahasiswa (user_id, nim, program_studi, peminatan) VALUES (?, ?, ?, NULL)",
        [
            ownerUserId,
            `9${crypto.randomInt(100000000, 999999999)}`,
            "Teknik Informatika",
        ]
    )) as [InsertResult, unknown];
    ownerMahasiswaId = ownerMahasiswa.insertId;

    const [otherMahasiswa] = (await pool.query(
        "INSERT INTO mahasiswa (user_id, nim, program_studi, peminatan) VALUES (?, ?, ?, NULL)",
        [
            otherUserId,
            `9${crypto.randomInt(100000000, 999999999)}`,
            "Teknik Informatika",
        ]
    )) as [InsertResult, unknown];
    otherMahasiswaId = otherMahasiswa.insertId;

    const [skripsiInsert] = (await pool.query(
        "INSERT INTO skripsi (mahasiswa_id, judul, tahun, status) VALUES (?, ?, ?, 'draft')",
        [
            ownerMahasiswaId,
            "Skripsi Uji Cover",
            new Date().getFullYear(),
        ]
    )) as [InsertResult, unknown];
    skripsiId = skripsiInsert.insertId;
});

after(async () => {
    try {
        if (pool && (skripsiId > 0 || extraSkripsiId > 0)) {
            await pool.query(
                "DELETE FROM skripsi WHERE id IN (?, ?)",
                [skripsiId, extraSkripsiId]
            );
        }

        if (pool && (ownerMahasiswaId > 0 || otherMahasiswaId > 0)) {
            await pool.query(
                "DELETE FROM mahasiswa WHERE id IN (?, ?)",
                [ownerMahasiswaId, otherMahasiswaId]
            );
        }

        if (pool && (ownerUserId > 0 || otherUserId > 0)) {
            await pool.query(
                "DELETE FROM users WHERE id IN (?, ?)",
                [ownerUserId, otherUserId]
            );
        }
    } finally {
        if (pool) {
            await pool.end();
        }

        if (tempUploadDir) {
            fs.rmSync(tempUploadDir, {
                recursive: true,
                force: true,
            });
        }
    }
});

test("upload cover sukses dan file dapat diakses publik", async () => {
    const res = await request(app)
        .post(`/api/skripsi/${skripsiId}/cover`)
        .set("Authorization", authHeader(ownerUser))
        .attach("cover", VALID_PNG, {
            filename: "cover.png",
            contentType: "image/png",
        });

    assert.equal(res.status, 200);
    assert.match(
        String(res.body.coverUrl),
        /^\/uploads\/covers\/[0-9a-f-]+\.png$/i
    );

    coverUrl = String(res.body.coverUrl);
    const filePath = path.join(coverDir, path.basename(coverUrl));
    assert.equal(fs.existsSync(filePath), true);

    const [rows] = await pool.query(
        "SELECT cover_url FROM skripsi WHERE id = ?",
        [skripsiId]
    );
    const row = (rows as { cover_url: string | null }[])[0];
    assert.equal(row?.cover_url, coverUrl);

    const publicFile = await request(app).get(coverUrl);
    assert.equal(publicFile.status, 200);
    assert.match(
        String(publicFile.headers["content-type"]),
        /image\/png/
    );
    assert.match(
        String(publicFile.headers["cache-control"]),
        /public/
    );
    assert.match(
        String(publicFile.headers["cache-control"]),
        /immutable/
    );
});

test("response create, update, list, detail, dan publik menyertakan coverUrl", async () => {
    const created = await request(app)
        .post("/api/skripsi")
        .set("Authorization", authHeader(ownerUser))
        .send({
            judul: "Skripsi Baru Uji Cover",
            tahun: new Date().getFullYear(),
        });

    assert.equal(created.status, 201);
    assert.equal(created.body.coverUrl, null);
    extraSkripsiId = Number(created.body.id);

    const detail = await request(app)
        .get(`/api/skripsi/${skripsiId}`)
        .set("Authorization", authHeader(ownerUser));
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.coverUrl, coverUrl);

    const list = await request(app)
        .get("/api/skripsi")
        .set("Authorization", authHeader(ownerUser));
    assert.equal(list.status, 200);
    const listRow = (list.body.data as { id: number; coverUrl: string | null }[])
        .find((item) => item.id === skripsiId);
    assert.equal(listRow?.coverUrl, coverUrl);

    const updated = await request(app)
        .put(`/api/skripsi/${skripsiId}`)
        .set("Authorization", authHeader(ownerUser))
        .send({ judul: "Skripsi Uji Cover Revisi" });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.coverUrl, coverUrl);

    await pool.query(
        "UPDATE skripsi SET status = 'disetujui' WHERE id = ?",
        [skripsiId]
    );

    const publicDetail = await request(app).get(
        `/api/skripsi/public/${skripsiId}`
    );
    assert.equal(publicDetail.status, 200);
    assert.equal(publicDetail.body.data.coverUrl, coverUrl);

    const publicList = await request(app).get("/api/skripsi/public");
    assert.equal(publicList.status, 200);
    const publicRow = (
        publicList.body.data as { id: number; coverUrl: string | null }[]
    ).find((item) => item.id === skripsiId);
    assert.equal(publicRow?.coverUrl, coverUrl);

    await pool.query(
        "UPDATE skripsi SET status = 'draft' WHERE id = ?",
        [skripsiId]
    );
});

test("menolak MIME salah dan magic bytes yang tidak cocok", async () => {
    const beforeCount = fs.readdirSync(coverDir).length;

    const wrongMime = await request(app)
        .post(`/api/skripsi/${skripsiId}/cover`)
        .set("Authorization", authHeader(ownerUser))
        .attach("cover", Buffer.from("bukan gambar"), {
            filename: "cover.png",
            contentType: "text/plain",
        });

    assert.equal(wrongMime.status, 400);
    assert.match(String(wrongMime.body.message), /JPG atau PNG/);

    const fakePng = await request(app)
        .post(`/api/skripsi/${skripsiId}/cover`)
        .set("Authorization", authHeader(ownerUser))
        .attach("cover", Buffer.from("bukan magic png"), {
            filename: "cover.png",
            contentType: "image/png",
        });

    assert.equal(fakePng.status, 400);
    assert.match(
        String(fakePng.body.message),
        /bukan gambar JPG\/PNG/i
    );
    assert.equal(fs.readdirSync(coverDir).length, beforeCount);
});

test("menolak cover yang melebihi 2 MB", async () => {
    const beforeCount = fs.readdirSync(coverDir).length;

    const res = await request(app)
        .post(`/api/skripsi/${skripsiId}/cover`)
        .set("Authorization", authHeader(ownerUser))
        .attach("cover", TOO_LARGE_PNG, {
            filename: "cover.png",
            contentType: "image/png",
        });

    assert.equal(res.status, 413);
    assert.match(String(res.body.message), /2 MB/);
    assert.equal(fs.readdirSync(coverDir).length, beforeCount);
});

test("menolak mahasiswa yang bukan pemilik skripsi", async () => {
    const beforeCount = fs.readdirSync(coverDir).length;

    const res = await request(app)
        .post(`/api/skripsi/${skripsiId}/cover`)
        .set("Authorization", authHeader(otherUser))
        .attach("cover", VALID_PNG, {
            filename: "cover.png",
            contentType: "image/png",
        });

    assert.equal(res.status, 403);
    assert.match(String(res.body.message), /milik sendiri/);
    assert.equal(fs.readdirSync(coverDir).length, beforeCount);
});

test("hapus cover menghapus file dan mengosongkan cover_url", async () => {
    assert.ok(coverUrl, "Cover harus berhasil diunggah lebih dulu");

    const filePath = path.join(coverDir, path.basename(coverUrl));
    const res = await request(app)
        .delete(`/api/skripsi/${skripsiId}/cover`)
        .set("Authorization", authHeader(ownerUser));

    assert.equal(res.status, 200);
    assert.equal(res.body.coverUrl, null);
    assert.equal(fs.existsSync(filePath), false);

    const [rows] = await pool.query(
        "SELECT cover_url FROM skripsi WHERE id = ?",
        [skripsiId]
    );
    const row = (rows as { cover_url: string | null }[])[0];
    assert.equal(row?.cover_url, null);
});
