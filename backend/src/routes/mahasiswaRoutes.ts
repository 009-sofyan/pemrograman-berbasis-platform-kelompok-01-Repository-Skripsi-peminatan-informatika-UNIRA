import { Router } from "express";
import {
    createMahasiswa,
    getMahasiswa,
    getMahasiswaById,
    updateMahasiswa,
    deleteMahasiswa,
} from "../controllers/mahasiswaControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { validateBody, validateParams } from "../validation/validate.js";
import {
    createMahasiswaSchema,
    idParamSchema,
    updateMahasiswaSchema,
} from "../validation/schemas.js";

const router = Router();

router.post(
    "/",
    authMiddleware,
    allowRoles("tendik"),
    validateBody(createMahasiswaSchema),
    createMahasiswa
);
router.get("/", authMiddleware, allowRoles("tendik"), getMahasiswa);
router.get(
    "/:id",
    authMiddleware,
    allowRoles("tendik"),
    validateParams(idParamSchema),
    getMahasiswaById
);
router.put(
    "/:id",
    authMiddleware,
    allowRoles("tendik"),
    validateParams(idParamSchema),
    validateBody(updateMahasiswaSchema),
    updateMahasiswa
);
router.delete(
    "/:id",
    authMiddleware,
    allowRoles("tendik"),
    validateParams(idParamSchema),
    deleteMahasiswa
);

export default router;
