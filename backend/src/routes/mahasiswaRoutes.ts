
import { Router } from "express";
import { createMahasiswa } from "../controllers/mahasiswaControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getMahasiswa } from "../controllers/mahasiswaControllers.js";
import { getMahasiswaById } from "../controllers/mahasiswaControllers.js";
import { updateMahasiswa } from "../controllers/mahasiswaControllers.js";
import { deleteMahasiswa } from "../controllers/mahasiswaControllers.js";
const router = Router();

router.post("/", authMiddleware, createMahasiswa);
router.get("/", authMiddleware, getMahasiswa);
router.get("/:id", authMiddleware, getMahasiswaById);
router.put("/:id", authMiddleware, updateMahasiswa);
router.delete("/:id", authMiddleware, deleteMahasiswa);

export default router;
