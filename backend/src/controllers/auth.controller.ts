import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.ts';
import { userDAO } from '../daos/user.dao.ts';
import { registerSchema, loginSchema } from '../schemas/user.schema.ts'; // Validation schemas for auth routes

/**
 * Interface to define the structure of validation errors from Yup.
 * This prevents using 'any' in catch blocks and satisfies ESLint rules.
 */
interface ValidationError {
  errors?: string[];
  message: string;
}

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
        try {
            // Validate credentials using Yup schema before hitting the service
            const credentials = await loginSchema.validate(req.body, { abortEarly: false });
            
            const result = await authService.validateUser(credentials.email, credentials.password);

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
        } catch (err) {
            // Safely cast error to avoid 'any' and handle validation feedback
            const error = err as ValidationError;
            return res.status(400).json({ error: error.errors || error.message });
        }
    }

    /**
     * Handles user self-registration.
     * POST /api/auth/register
     */
    async register(req: Request, res: Response): Promise<Response | void> {
        try {
            // Validate registration data (email, password, name) using Yup schema
            const data = await registerSchema.validate(req.body, { abortEarly: false });

            const result = await authService.registerUser(data.email, data.password, data.name);

            if (result.isFailure) {
                // 409 Conflict if user already exists or other business logic failure
                return res.status(409).json({ error: result.error });
            }

            const { user, token } = result.getValue();
            return res.status(201).json({ message: 'Registration successful', token, user });
        } catch (err) {
            // Safely cast error to avoid 'any' and handle validation feedback
            const error = err as ValidationError;
            return res.status(400).json({ error: error.errors || error.message });
        }
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