import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.ts';

/**
 * Controller to handle Authentication and Identity HTTP requests.
 * Refactor: Implements strict Role-Based Access Control (RBAC).
 */
class AuthController {

    /**
     * Registers a new account.
     * HARDENED: Every new registration is forced to 'USER' role to prevent 
     * unauthorized administrative elevation.
     */
    async register(req: Request, res: Response): Promise<Response | void> {
        const { email, password, name } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // SHIELD: We ignore any 'role' field sent in the body.
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
     * Updates user profile details.
     * RBAC LOGIC: 
     * 1. Standard users can only update their name.
     * 2. Only users with 'ADMIN' role can update the 'role' field.
     */
    async updateProfile(req: Request, res: Response): Promise<Response | void> {
        const userId = (req as any).user?.id; 
        const requesterRole = (req as any).user?.role; // Role from the JWT token
        const { name, role } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Validate basic name requirements
        if (name && name.trim().length < 2) {
            return res.status(400).json({ error: "Name must be at least 2 characters long" });
        }

        /**
         * ROLE CHANGE PROTECTION
         * We only allow changing the role if the requester is an ADMIN.
         * This prevents "Self-Promotion" attacks.
         */
        let roleToUpdate = undefined;
        if (role) {
            if (requesterRole === 'ADMIN') {
                roleToUpdate = role;
            } else {
                return res.status(403).json({ 
                    error: "Forbidden: Only administrators can modify user roles." 
                });
            }
        }

        const result = await authService.updateProfile(userId, name, roleToUpdate);

        if (result.isFailure) {
            return res.status(400).json({ error: result.error });
        }

        return res.json(result.getValue());
    }

    /**
     * SECURITY ENDPOINT: Returns the current user data from JWT (server-verified).
     * This prevents role escalation attacks where a client manipulates localStorage.
     * The role in the response is extracted from the JWT token itself, 
     * so clients CANNOT forge or escalate privileges.
     */
    async getCurrentUser(req: Request, res: Response): Promise<Response | void> {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Return the verified user data from the JWT payload
        return res.json({
            id: user.id,
            email: user.email,
            role: user.role  // ✅ This role comes from the JWT, not the client
        });
    }
}

export const authController = new AuthController();