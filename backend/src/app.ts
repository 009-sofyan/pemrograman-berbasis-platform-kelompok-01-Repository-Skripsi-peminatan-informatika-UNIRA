import express from "express";
import { sql } from "drizzle-orm";
import { db } from "./db/index.js";
import { getTrustProxy } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import skripsiRoutes from "./routes/skripsiRoutes.js";
import mahasiswaRoutes from "./routes/mahasiswaRoutes.js";
import persetujuanRoutes from "./routes/persetujuanRoutes.js";
import peminatanRoutes from "./routes/peminatanRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import pemetaanRoutes from "./routes/pemetaanRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", getTrustProxy());

app.get("/", (_req, res) => {
  res.json({
    message: "API Repository Skripsi FT UNIRA berhasil berjalan!",
  });
});

// Batas body JSON menjaga request biasa tetap ringan. Upload PDF ditangani
// Multer dengan batas tersendiri (10 MB).
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    return res.json({ status: "ok" });
  } catch (error) {
    console.error("Health check database gagal:", error);
    return res.status(500).json({ status: "error" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/skripsi", skripsiRoutes);
app.use("/api/mahasiswa", mahasiswaRoutes);
app.use("/api/persetujuan", persetujuanRoutes);
app.use("/api/peminatan", peminatanRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pemetaan", pemetaanRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
