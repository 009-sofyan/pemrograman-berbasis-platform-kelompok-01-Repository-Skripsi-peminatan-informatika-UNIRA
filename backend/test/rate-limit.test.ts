import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import request from "supertest";
import type express from "express";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.JWT_EXPIRES_IN = "1h";
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = "60000";
process.env.LOGIN_RATE_LIMIT_MAX = "3";
process.env.REGISTER_RATE_LIMIT_MAX = "100";
process.env.API_RATE_LIMIT_WINDOW_MS = "60000";
process.env.API_RATE_LIMIT_MAX = "20";
process.env.UPLOAD_RATE_LIMIT_MAX = "100";

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

test("login mengembalikan 429 setelah batas percobaan terlampaui", async () => {
    const payload = {
        email: "rate-limit-user@example.com",
        password: "",
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const res = await request(app)
            .post("/api/auth/login")
            .send(payload);

        assert.equal(res.status, 400);
    }

    const limited = await request(app)
        .post("/api/auth/login")
        .send(payload);

    assert.equal(limited.status, 429);
    assert.match(limited.body.message, /terlalu banyak/i);
    assert.ok(limited.headers["retry-after"]);
});

test("API umum mengembalikan 429 setelah kuota habis", async () => {
    // Empat request login di atas sudah masuk ke kuota API umum (limit 20).
    let limitedResponse: request.Response | null = null;

    for (let index = 0; index < 17; index += 1) {
        const res = await request(app).get("/api/endpoint-tidak-ada");

        if (res.status === 429) {
            limitedResponse = res;
            break;
        }

        assert.equal(res.status, 404);
    }

    assert.ok(limitedResponse, "API umum seharusnya mengembalikan 429");
    assert.equal(limitedResponse.status, 429);
    assert.match(limitedResponse.body.message, /terlalu banyak/i);
});
