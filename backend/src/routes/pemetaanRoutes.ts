import { Router } from "express";
import { getPemetaanPeminatan } from "../controllers/pemetaanControllers.js";
import { validateQuery } from "../validation/validate.js";
import { emptyQuerySchema } from "../validation/schemas.js";

const router = Router();

// Statistik ini hanya berisi agregat jumlah mahasiswa per peminatan/angkatan
// dan dipakai widget hero di landing page publik. Tidak ada data pribadi yang
// dikembalikan, sehingga endpoint dapat diakses tanpa login.
router.get("/", validateQuery(emptyQuerySchema), getPemetaanPeminatan);

export default router;
