import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getDashboard } from "../controllers/dashboardControllers.js";

const router = Router();

router.get("/", authMiddleware, getDashboard);

export default router