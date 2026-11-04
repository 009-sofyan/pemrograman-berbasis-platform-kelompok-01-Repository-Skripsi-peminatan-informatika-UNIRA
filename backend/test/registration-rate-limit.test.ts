import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import request from "supertest";
import type express from "express";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.JWT_EXPIRES_IN = "1h";
process.env.LOGIN_RATE_LIMIT_MAX = "1000";
process.env.REGISTER_RATE_LIMIT_WINDOW_MS = "3600000";
process.env.REGISTER_RATE_LIMIT_MAX = "5";
process.env.API_RATE_LIMIT_MAX = "10000";

let app: express.Express;
let pool: { end: () => Promise<void> };

before(async () => {
    app = (await import("../src/app.js")).default;
    const dbModule = await import("../src/db/index.js");
    pool = dbModule.pool as unknown as typeof pool;
});

after(async () => {
    await pool.end();
});

test("registrasi dibatasi lima permintaan per IP per jam", async () => {
    const payload = {
        nama: "A",
        email: "bukan-email",
        password: "pendek",
    };

    // Validasi body sengaja gagal, tetapi tetap dihitung oleh rate limiter
    // registrasi karena limiter dipasang sebelum validator.
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const res = await request(app)
            .post("/api/auth/register")
            .send(payload);

        assert.equal(res.status, 400);
    }

    const limited = await request(app)
        .post("/api/auth/register")
        .send(payload);

    assert.equal(limited.status, 429);
    assert.match(String(limited.body.message), /registrasi/i);
    assert.ok(limited.headers["retry-after"]);
});
