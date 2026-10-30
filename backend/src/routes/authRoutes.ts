import { Router } from "express";
import { register, login } from "../controllers/authControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getProfile } from "../controllers/userControllers.js";
import {
    loginRateLimiter,
    registerRateLimiter,
} from "../middlewares/rateLimit.js";
import { validateBody } from "../validation/validate.js";
import { loginSchema, registerSchema } from "../validation/schemas.js";

const router = Router();

router.post(
    "/register",
    registerRateLimiter,
    validateBody(registerSchema),
    register
);
router.post(
    "/login",
    loginRateLimiter,
    validateBody(loginSchema),
    login
);
router.get("/me", authMiddleware, getProfile);

export default router;
