import { Router } from "express";
import {
    createSkripsi,
    getSkripsi,
    getSkripsiById,
    getPublicSkripsi,
    getPublicSkripsiById,
    updateSkripsi,
    deleteSkripsi,
    submitSkripsi,
} from "../controllers/skripsiControllers.js";
import { uploadSkripsi } from "../middlewares/uploadSkripsi.js";
import { uploadFileSkripsi } from "../controllers/skripsiControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";


const router = Router();

// Katalog publik: hanya skripsi dengan status "disetujui".
router.get("/public", getPublicSkripsi);
router.get("/public/:id", getPublicSkripsiById);

router.post("/", authMiddleware,createSkripsi);
router.post(
    "/:id/upload",
    authMiddleware,
    uploadSkripsi,
    uploadFileSkripsi
);
router.get("/", authMiddleware, getSkripsi);
router.get("/:id", authMiddleware,getSkripsiById);
router.put("/:id", authMiddleware, updateSkripsi);
router.delete("/:id", authMiddleware, deleteSkripsi);
router.patch("/:id/submit", authMiddleware, submitSkripsi);

export default router;