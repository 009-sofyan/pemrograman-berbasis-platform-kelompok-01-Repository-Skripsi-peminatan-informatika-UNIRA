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
    downloadSkripsi,
} from "../controllers/skripsiControllers.js";
import { uploadSkripsi } from "../middlewares/uploadSkripsi.js";
import { uploadFileSkripsi } from "../controllers/skripsiControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { precheckSkripsiUpload } from "../middlewares/precheckSkripsiUpload.js";
import {
    validateBody,
    validateParams,
    validateQuery,
} from "../validation/validate.js";
import {
    createSkripsiSchema,
    idParamSchema,
    skripsiListQuerySchema,
    updateSkripsiSchema,
} from "../validation/schemas.js";

const router = Router();

// Katalog publik: hanya skripsi dengan status "disetujui".
router.get("/public", validateQuery(skripsiListQuerySchema), getPublicSkripsi);
router.get(
    "/public/:id",
    validateParams(idParamSchema),
    getPublicSkripsiById
);

router.post(
    "/",
    authMiddleware,
    allowRoles("mahasiswa"),
    validateBody(createSkripsiSchema),
    createSkripsi
);
router.post(
    "/:id/upload",
    authMiddleware,
    allowRoles("mahasiswa"),
    validateParams(idParamSchema),
    precheckSkripsiUpload,
    uploadSkripsi,
    uploadFileSkripsi
);
router.get(
    "/",
    authMiddleware,
    allowRoles("mahasiswa", "kaprodi", "tendik"),
    validateQuery(skripsiListQuerySchema),
    getSkripsi
);
router.get(
    "/:id/download",
    authMiddleware,
    allowRoles("mahasiswa", "kaprodi", "tendik"),
    validateParams(idParamSchema),
    downloadSkripsi
);
router.get(
    "/:id",
    authMiddleware,
    allowRoles("mahasiswa", "kaprodi", "tendik"),
    validateParams(idParamSchema),
    getSkripsiById
);
router.put(
    "/:id",
    authMiddleware,
    allowRoles("mahasiswa"),
    validateParams(idParamSchema),
    validateBody(updateSkripsiSchema),
    updateSkripsi
);
router.delete(
    "/:id",
    authMiddleware,
    allowRoles("mahasiswa"),
    validateParams(idParamSchema),
    deleteSkripsi
);
router.patch(
    "/:id/submit",
    authMiddleware,
    allowRoles("mahasiswa"),
    validateParams(idParamSchema),
    submitSkripsi
);

export default router;
