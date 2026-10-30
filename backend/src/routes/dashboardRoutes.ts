import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { getDashboard } from "../controllers/dashboardControllers.js";

const router = Router();

// Statistik dashboard memang dipakai oleh ketiga peran, tetapi aksesnya
// dibuat eksplisit agar tidak bergantung pada default "semua user login".
router.get(
  "/",
  authMiddleware,
  allowRoles("mahasiswa", "kaprodi", "tendik"),
  getDashboard
);

export default router;
