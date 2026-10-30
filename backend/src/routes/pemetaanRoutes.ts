import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { getPemetaanPeminatan } from "../controllers/pemetaanControllers.js";
import { validateQuery } from "../validation/validate.js";
import { emptyQuerySchema } from "../validation/schemas.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  allowRoles("mahasiswa", "kaprodi"),
  validateQuery(emptyQuerySchema),
  getPemetaanPeminatan
);

export default router;
