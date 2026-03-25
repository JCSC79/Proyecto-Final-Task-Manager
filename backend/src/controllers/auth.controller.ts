import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.ts';

/**
 * Controller to handle Authentication HTTP requests.
 * Phase 5: Updated to support user profile updates.
 */
class AuthController {

    async register(req: Request, res: Response): Promise<Response | void> {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const result = await authService.register(email, password, name);
        if (result.isFailure) {
            return res.status(400).json({ error: result.error });
        }
        return res.status(201).json(result.getValue());
    }

    async login(req: Request, res: Response): Promise<Response | void> {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const result = await authService.login(email, password);
        if (result.isFailure) {
            return res.status(401).json({ error: result.error });
        }
        return res.json(result.getValue());
    }

    /**
     * Updates the authenticated user's profile.
     * Phase 5: Endpoint handler for profile changes.
     */
    async updateProfile(req: Request, res: Response): Promise<Response | void> {
        // The userId is injected by the authenticate middleware
        const userId = (req as any).user?.id; 
        const { name } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ error: "Name must be at least 2 characters long" });
        }

        const result = await authService.updateProfile(userId, name);

        if (result.isFailure) {
            return res.status(400).json({ error: result.error });
        }

        return res.json(result.getValue());
    }
}

export const authController = new AuthController();