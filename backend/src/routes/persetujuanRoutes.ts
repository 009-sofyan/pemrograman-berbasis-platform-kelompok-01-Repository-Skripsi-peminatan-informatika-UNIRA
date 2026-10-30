import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  getPengajuanSkripsi,
  approveSkripsi,
  rejectSkripsi,
} from "../controllers/persetujuanControllers.js";
import { validateBody, validateParams } from "../validation/validate.js";
import {
  emptyBodySchema,
  idParamSchema,
} from "../validation/schemas.js";

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
  validateBody(emptyBodySchema),
  approveSkripsi
);
router.patch(
  "/:id/reject",
  authMiddleware,
  allowRoles("kaprodi"),
  validateParams(idParamSchema),
  validateBody(emptyBodySchema),
  rejectSkripsi
);

export default router;
