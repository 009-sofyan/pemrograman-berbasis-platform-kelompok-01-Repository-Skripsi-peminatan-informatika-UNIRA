import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  getPeminatanSaya,
  pilihPeminatan,
} from "../controllers/peminatanControllers.js";

const router = Router();

router.get("/saya", authMiddleware, getPeminatanSaya);
router.patch("/peminatan", authMiddleware, pilihPeminatan);

export default router;
