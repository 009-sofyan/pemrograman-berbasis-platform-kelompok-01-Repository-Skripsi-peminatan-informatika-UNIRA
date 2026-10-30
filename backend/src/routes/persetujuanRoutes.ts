import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  getPengajuanSkripsi,
  approveSkripsi,
  rejectSkripsi,
} from "../controllers/persetujuanControllers.js";
import { validateParams } from "../validation/validate.js";
import { idParamSchema } from "../validation/schemas.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  allowRoles("kaprodi"),
  getPengajuanSkripsi
);
router.patch(
  "/:id/approve",
  authMiddleware,
  allowRoles("kaprodi"),
  validateParams(idParamSchema),
  approveSkripsi
);
router.patch(
  "/:id/reject",
  authMiddleware,
  allowRoles("kaprodi"),
  validateParams(idParamSchema),
  rejectSkripsi
);

export default router;
