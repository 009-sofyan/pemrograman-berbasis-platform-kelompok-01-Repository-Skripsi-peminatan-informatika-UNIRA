
import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  getPengajuanSkripsi,
  approveSkripsi,
  rejectSkripsi,
} from "../controllers/persetujuanControllers.js";

const router = Router();

router.get("/", authMiddleware, getPengajuanSkripsi);
router.patch("/:id/approve", authMiddleware, approveSkripsi);
router.patch("/:id/reject", authMiddleware, rejectSkripsi);

export default router;
