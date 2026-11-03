import { Router } from "express";

import {
    approveRegistration,
    getRegistrations,
    rejectRegistration,
} from "../controllers/tendikRegistrationControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import {
    validateBody,
    validateParams,
    validateQuery,
} from "../validation/validate.js";
import {
    approveRegistrationSchema,
    idParamSchema,
    rejectRegistrationSchema,
    tendikRegistrationQuerySchema,
} from "../validation/schemas.js";

const router = Router();

router.use(authMiddleware, allowRoles("tendik"));

router.get(
    "/registrasi",
    validateQuery(tendikRegistrationQuerySchema),
    getRegistrations
);

router.post(
    "/registrasi/:id/setujui",
    validateParams(idParamSchema),
    validateBody(approveRegistrationSchema),
    approveRegistration
);

router.post(
    "/registrasi/:id/tolak",
    validateParams(idParamSchema),
    validateBody(rejectRegistrationSchema),
    rejectRegistration
);

export default router;
