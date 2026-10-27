import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { pilihPeminatan } from "../controllers/peminatanControllers.js";

const router = Router();

router.patch("/peminatan", authMiddleware, pilihPeminatan);

export default router;
