import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import bcrypt from "bcrypt";
import type express from "express";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.JWT_EXPIRES_IN = "1h";
process.env.LOGIN_RATE_LIMIT_MAX = "1000";
process.env.REGISTER_RATE_LIMIT_MAX = "1000";
process.env.API_RATE_LIMIT_MAX = "10000";
process.env.DOWNLOAD_RATE_LIMIT_MAX = "1000";

interface InsertResult {
  insertId: number;
  affectedRows: number;
}

let app: express.Express;
let pool: {
  query: (sql: string, values?: unknown[]) => Promise<[unknown, unknown]>;
  end: () => Promise<void>;
};
let uploadDir = "";
let tempUploadDir = "";

let userId = 0;
let mahasiswaId = 0;
let approvedId = 0;
let missingFileId = 0;
let draftId = 0;

const approvedTitle = 'Judul <script> / "Aman" & PDF';
const approvedFileName = `download-test-${crypto.randomBytes(6).toString("hex")}.pdf`;

before(async () => {
  tempUploadDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "unira-download-test-"),
  );
  process.env.UPLOAD_DIR = tempUploadDir;

  app = (await import("../src/app.js")).default;
  const dbModule = await import("../src/db/index.js");
  pool = dbModule.pool as unknown as typeof pool;
  const uploads = await import("../src/utils/uploads.js");
  uploadDir = uploads.SKRIPSI_UPLOAD_DIR;

  const suffix = crypto.randomBytes(6).toString("hex");
  const passwordHash = await bcrypt.hash("DownloadTest123!", 4);

  const [userInsert] = (await pool.query(
    "INSERT INTO users (nama, email, password, role, status) VALUES (?, ?, ?, 'mahasiswa', 'ACTIVE')",
    [
      "Pemilik Unduhan",
      `download-owner-${suffix}@example.com`,
      passwordHash,
    ],
  )) as [InsertResult, unknown];
  userId = userInsert.insertId;

  const [mahasiswaInsert] = (await pool.query(
    "INSERT INTO mahasiswa (user_id, nim, program_studi, peminatan) VALUES (?, ?, ?, NULL)",
    [
      userId,
      `9${crypto.randomInt(100000000, 999999999)}`,
      "Informatika",
    ],
  )) as [InsertResult, unknown];
  mahasiswaId = mahasiswaInsert.insertId;

  const [approvedInsert] = (await pool.query(
    "INSERT INTO skripsi (mahasiswa_id, judul, tahun, status, file_url) VALUES (?, ?, ?, 'disetujui', ?)",
    [
      mahasiswaId,
      approvedTitle,
      new Date().getFullYear(),
      `/uploads/skripsi/${approvedFileName}`,
    ],
  )) as [InsertResult, unknown];
  approvedId = approvedInsert.insertId;

  const [missingInsert] = (await pool.query(
    "INSERT INTO skripsi (mahasiswa_id, judul, tahun, status, file_url) VALUES (?, ?, ?, 'disetujui', ?)",
    [
      mahasiswaId,
      "Skripsi dengan file hilang",
      new Date().getFullYear(),
      `/uploads/skripsi/hilang-${crypto.randomBytes(6).toString("hex")}.pdf`,
    ],
  )) as [InsertResult, unknown];
  missingFileId = missingInsert.insertId;

  const [draftInsert] = (await pool.query(
    "INSERT INTO skripsi (mahasiswa_id, judul, tahun, status, file_url) VALUES (?, ?, ?, 'draft', ?)",
    [
      mahasiswaId,
      "Skripsi masih draft",
      new Date().getFullYear(),
      `/uploads/skripsi/${approvedFileName}`,
    ],
  )) as [InsertResult, unknown];
  draftId = draftInsert.insertId;

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(
    path.join(uploadDir, approvedFileName),
    Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n"),
  );
});

after(async () => {
  try {
    if (pool && (approvedId > 0 || missingFileId > 0 || draftId > 0)) {
      await pool.query(
        "DELETE FROM skripsi WHERE id IN (?, ?, ?)",
        [approvedId, missingFileId, draftId],
      );
    }

    if (pool && mahasiswaId > 0) {
      await pool.query("DELETE FROM mahasiswa WHERE id = ?", [mahasiswaId]);
    }

    if (pool && userId > 0) {
      await pool.query("DELETE FROM users WHERE id = ?", [userId]);
    }
  } finally {
    if (pool) {
      await pool.end();
    }

    if (tempUploadDir) {
      fs.rmSync(tempUploadDir, { recursive: true, force: true });
    }
  }
});

test("unduhan publik mengirim PDF attachment dengan header aman", async () => {
  const res = await request(app).get(
    `/api/skripsi/${approvedId}/download`,
  );

  assert.equal(res.status, 200);
  assert.match(String(res.headers["content-type"]), /application\/pdf/);
  assert.equal(res.headers["x-content-type-options"], "nosniff");
  const disposition = String(res.headers["content-disposition"]);
  const parts =
    /^attachment; filename="([a-z0-9-]+-\d+\.pdf)"; filename\*=UTF-8''([^;\r\n]+)$/.exec(
      disposition,
    );

  assert.ok(parts, `Content-Disposition tidak aman: ${disposition}`);
  assert.doesNotMatch(parts[1], /[\\"\r\n]/);
  assert.doesNotMatch(decodeURIComponent(parts[2]), /[\\"\r\n]/);
  assert.match(res.body.toString("latin1"), /^%PDF-/);
});

test("parameter inline=1 mengubah disposition menjadi inline", async () => {
  const res = await request(app).get(
    `/api/skripsi/${approvedId}/download?inline=1`,
  );

  assert.equal(res.status, 200);
  assert.match(String(res.headers["content-disposition"]), /^inline;/);
});

test("status selain disetujui dan file hilang dijawab 404 tanpa membocorkan path", async () => {
  const draft = await request(app).get(
    `/api/skripsi/${draftId}/download`,
  );
  assert.equal(draft.status, 404);

  const missing = await request(app).get(
    `/api/skripsi/${missingFileId}/download`,
  );
  assert.equal(missing.status, 404);
  assert.match(String(missing.body.message), /tidak ditemukan/i);
  assert.doesNotMatch(String(missing.body.message), /uploads|skripsi[\\/]/i);
});

test("ID tidak numerik ditolak 400", async () => {
  const res = await request(app).get("/api/skripsi/abc/download");
  assert.equal(res.status, 400);
});

test("katalog publik tidak membocorkan path internal atau email", async () => {
  const list = await request(app).get("/api/skripsi/public");
  assert.equal(list.status, 200);

  const row = (
    list.body.data as Array<{ id: number; fileUrl: string | null }>
  ).find((item) => item.id === approvedId);

  assert.ok(row);
  assert.equal(row.fileUrl, `/api/skripsi/${approvedId}/download`);

  const serialized = JSON.stringify(list.body);
  assert.doesNotMatch(serialized, /uploads[\\/]skripsi/i);
  assert.doesNotMatch(serialized, /@example\.com/i);

  const detail = await request(app).get(
    `/api/skripsi/public/${approvedId}`,
  );
  assert.equal(detail.status, 200);
  assert.equal(
    detail.body.data.fileUrl,
    `/api/skripsi/${approvedId}/download`,
  );
  assert.doesNotMatch(JSON.stringify(detail.body), /uploads[\\/]skripsi/i);
});
