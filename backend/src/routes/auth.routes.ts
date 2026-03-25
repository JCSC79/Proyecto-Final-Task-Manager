import { Router } from 'express';
import { authController } from '../controllers/auth.controller.ts';
import { authenticate } from '../middlewares/auth.middleware.ts';

const router = Router();

// Public: No token needed
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

// Protected: Requires valid JWT
router.put('/profile', authenticate, (req, res) => authController.updateProfile(req, res));

/**
 * SECURITY ENDPOINT: Get the current user's verified role from JWT.
 * This prevents privilege escalation by trusting localStorage.
 * Frontend calls this to get the TRUE role, not localStorage's version.
 */
router.get('/me', authenticate, (req, res) => authController.getCurrentUser(req, res));

export default router;