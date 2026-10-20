import { Router } from 'express';
import {
    register,
    login,
} from '../controllers/authControllers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

const router = Router()
router.post('/register',register);
router.post('/login',login);
router.get('/me', authMiddleware, (req, res) => {
    const authReq = req as AuthRequest;
    return res.status(200).json({
        message: 'Data pengguna berhasil diambil',
        user: authReq.user,
    });
});

export default router;
