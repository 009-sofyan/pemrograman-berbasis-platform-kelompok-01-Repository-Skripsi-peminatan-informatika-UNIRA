import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
  getPeminatanSaya,
  pilihPeminatan,
} from "../controllers/peminatanControllers.js";
import { validateBody } from "../validation/validate.js";
import { pilihPeminatanSchema } from "../validation/schemas.js";

const router = Router();

router.get(
  "/saya",
  authMiddleware,
  allowRoles("mahasiswa"),
  getPeminatanSaya
);
router.patch(
  "/peminatan",
  authMiddleware,
  allowRoles("mahasiswa"),
  validateBody(pilihPeminatanSchema),
  pilihPeminatan
);

export default router;
