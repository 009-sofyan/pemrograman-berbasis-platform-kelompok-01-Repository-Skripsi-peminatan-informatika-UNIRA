import express from "express";
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import authRoutes from "./routes/authRoutes.js";
import skripsiRoutes from "./routes/skripsiRoutes.js";
import mahasiswaRoutes from "./routes/mahasiswaRoutes.js";
import persetujuanRoutes from "./routes/persetujuanRoutes.js";

const app = express();

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

app.listen(3000, () => {
  console.log('Server berjalan di http://localhost:3000');
});
