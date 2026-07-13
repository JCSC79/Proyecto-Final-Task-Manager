import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.ts';
import { userDAO } from '../daos/user.dao.ts';
import { registerSchema, loginSchema } from '../schemas/user.schema.ts';
import { socketService } from '../services/socket.service.ts';

interface ValidationError {
  errors?: string[];
  message: string;
}

class AuthController {
    /**
     * POST /api/auth/login
     */
    async login(req: Request, res: Response): Promise<Response | void> {
        try {
            const credentials = await loginSchema.validate(req.body, { abortEarly: false });
            const result = await authService.validateUser(credentials.email, credentials.password);

            if (result.isFailure) {
                return res.status(401).json({ error: result.error });
            }

            const { user, token } = result.getValue();

            // SECURITY: Prevent blocked users from obtaining a new session
            if (user.is_blocked) {
                return res.status(403).json({ error: 'Your account has been blocked. Contact an administrator.' });
            }

            // SECURITY: Set HttpOnly cookie with the JWT token
            res.cookie('auth_token', token, {
                httpOnly: true, // Prevents JS access (XSS protection)
                secure: process.env.NODE_ENV === 'production', 
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 24h
            });

            return res.json({ message: 'Login successful', user });
        } catch (err) {
            const error = err as ValidationError;
            return res.status(400).json({ error: error.errors || error.message });
        }
    }

    /**
     * POST /api/auth/register
     */
    async register(req: Request, res: Response): Promise<Response | void> {
        try {
            const data = await registerSchema.validate(req.body, { abortEarly: false });
            const result = await authService.registerUser(data.email, data.password, data.name);

            if (result.isFailure) {
                return res.status(409).json({ error: result.error });
            }

            const { user, token } = result.getValue();

            // SECURITY: Attach token to HttpOnly cookie upon registration
            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000
            });

            socketService.broadcastUserRegistered();
            return res.status(201).json({ message: 'Registration successful', user });
        } catch (err) {
            const error = err as ValidationError;
            return res.status(400).json({ error: error.errors || error.message });
        }
    }

    /**
     * POST /api/auth/logout
     * NEW: Clears the secure cookie
     */
    async logout(_req: Request, res: Response): Promise<Response> {
        res.clearCookie('auth_token');
        return res.json({ message: 'Logged out successfully' });
    }

    async updateMe(req: Request, res: Response): Promise<Response | void> {
        const userId = (req as Request & { user?: { id: string } }).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { name, lang } = req.body as { name?: string; lang?: 'en' | 'es' };
        if (lang) {
            if (lang !== 'en' && lang !== 'es') {
                return res.status(400).json({ error: 'Invalid lang value. Must be "en" or "es".' });
            }
            await userDAO.updateLang(userId, lang);
        }
        if (name !== undefined && name.trim() !== '') {
            if (!await userDAO.updateName(userId, name.trim())) {
                return res.status(404).json({ error: 'User not found' });
            }
        }
        const user = await userDAO.getById(userId);
        return res.json({ user });
    }
}

export const authController = new AuthController();