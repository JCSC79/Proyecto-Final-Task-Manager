import { Router } from 'express';
import { authController } from '../controllers/auth.controller.ts';

const router = Router();

/**
 * Auth Routes Configuration
 * This router handles all identity-related endpoints.
 * Base path: /api/auth
 */
router.post('/login', (req, res) => authController.login(req, res));

export default router;