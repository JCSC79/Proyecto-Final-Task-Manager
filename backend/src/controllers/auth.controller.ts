import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.ts';

/**
 * Controller to handle Authentication HTTP requests.
 * Phase 4: Updated to handle user names during registration.
 */
class AuthController {

    /**
     * Handles user registration.
     * Expected body: { email, password, name? }
     */
    async register(req: Request, res: Response): Promise<Response | void> {
        // We now extract 'name' from the request body
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // We pass 'name' to the service
        const result = await authService.register(email, password, name);

        if (result.isFailure) {
            return res.status(400).json({ error: result.error });
        }

        return res.status(201).json(result.getValue());
    }

    /**
     * Handles user login and returns JWT + User Profile.
     */
    async login(req: Request, res: Response): Promise<Response | void> {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const result = await authService.login(email, password);

        if (result.isFailure) {
            return res.status(401).json({ error: result.error });
        }

        // Now returns { token, user: { email, name, avatar_url, role } }
        return res.json(result.getValue());
    }
}

export const authController = new AuthController();