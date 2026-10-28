import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { getPemetaanPeminatan } from "../controllers/pemetaanControllers.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  allowRoles("mahasiswa", "kaprodi"),
  getPemetaanPeminatan
);

export default router;
