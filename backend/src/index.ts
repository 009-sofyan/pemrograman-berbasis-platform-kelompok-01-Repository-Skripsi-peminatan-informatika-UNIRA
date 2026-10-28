import express from "express";
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import authRoutes from "./routes/authRoutes.js";
import skripsiRoutes from "./routes/skripsiRoutes.js";
import mahasiswaRoutes from "./routes/mahasiswaRoutes.js";
import persetujuanRoutes from "./routes/persetujuanRoutes.js";
import peminatanRoutes from "./routes/peminatanRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import pemetaanRoutes from "./routes/pemetaanRoutes.js";
import path from "node:path";

const app = express();

app.use(
  "/uploads",
  express.static(path.resolve("uploads"))
);

app.get("/", (_req, res) => {
  res.json({
    message: "API Repository Skripsi FT UNIRA berhasil berjalan!",
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.get('/health', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    return res.json({status: 'ok'});
  } catch {
    return res.status(500).json({ status: 'error' });
  }
});

app.use("/api/auth",authRoutes);
app.use("/api/skripsi", skripsiRoutes);
app.use("/api/mahasiswa", mahasiswaRoutes);
app.use("/api/persetujuan", persetujuanRoutes);
app.use("/api/peminatan", peminatanRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pemetaan", pemetaanRoutes);

app.listen(3000, () => {
  console.log('Server berjalan di http://localhost:3000');
});
