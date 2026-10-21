import { Router } from 'express';
import {
    register,
    login,
} from '../controllers/authControllers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { getProfile } from '../controllers/userControllers.js';

const router = Router()
router.post('/register',register);
router.post('/login',login);
router.get('/me', authMiddleware, getProfile);

export default router;
