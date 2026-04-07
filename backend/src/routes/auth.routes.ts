import { Router } from 'express';
import { authController } from '../controllers/auth.controller.ts';
import { authenticateToken } from '../middlewares/auth.middleware.ts';

const router = Router();

/**
 * Authentication Routes
 * POST /register and /login are now validated via Yup schemas in the Controller.
 */
router.post('/login', (req, res) => authController.login(req, res));
router.post('/register', (req, res) => authController.register(req, res));

// Protected route: requires a valid JWT token
router.patch('/me', authenticateToken, (req, res) => authController.updateMe(req, res));

export default router;