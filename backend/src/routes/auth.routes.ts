import { Router } from 'express';
import { authController } from '../controllers/auth.controller.ts';
import { authenticateToken } from '../middlewares/auth.middleware.ts';

const router = Router();

router.post('/login', (req, res) => authController.login(req, res));
router.post('/register', (req, res) => authController.register(req, res));
router.patch('/me', authenticateToken, (req, res) => authController.updateMe(req, res));

export default router;