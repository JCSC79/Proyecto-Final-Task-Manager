import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.ts';
import { userDAO } from '../daos/user.dao.ts';

/**
 * AuthController - Handles incoming authentication requests.
 * Orchestrates the flow between HTTP and Business Logic.
 */
class AuthController {
    /**
     * Handles the login process.
     * POST /api/auth/login
     */
    async login(req: Request, res: Response): Promise<Response | void> {
        const { email, password } = req.body;

        // Basic validation before hitting the service
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await authService.validateUser(email, password);

        if (result.isFailure) {
            // 401 Unauthorized for invalid credentials
            return res.status(401).json({ error: result.error });
        }

        // Successful authentication
        const { user, token } = result.getValue();

        return res.json({
            message: 'Login successful',
            token: token,
            user: user
        });
    }

    /**
     * Handles user self-registration.
     * POST /api/auth/register
     */
    async register(req: Request, res: Response): Promise<Response | void> {
        const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const result = await authService.registerUser(email, password, name);

        if (result.isFailure) {
            return res.status(409).json({ error: result.error });
        }

        const { user, token } = result.getValue();
        return res.status(201).json({ message: 'Registration successful', token, user });
    }

    /**
     * Updates the display name of the authenticated user.
     * PATCH /api/auth/me
     */
    async updateMe(req: Request, res: Response): Promise<Response | void> {
        const userId = (req as Request & { user?: { id: string } }).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { name } = req.body as { name?: string };
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const user = await userDAO.updateName(userId, name.trim());
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ user });
    }
}

export const authController = new AuthController();