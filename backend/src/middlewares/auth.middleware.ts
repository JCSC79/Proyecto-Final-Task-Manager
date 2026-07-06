import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userDAO } from '../daos/user.dao.ts';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required but not set.');
}

interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        email: string;
    };
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check both Authorization header and HttpOnly cookies
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader?.split(' ')[1];
    const cookieToken = req.cookies['auth_token'];

    const token = cookieToken || headerToken;

    if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    let decoded: { id: string; role: string; email: string };
    try {
        decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; email: string };
    } catch (error) {
        console.error('JWT verification error:', error);
        res.status(403).json({ error: 'Invalid or expired token.' });
        return;
    }

    // Check if the user has been blocked since the token was issued
    const user = await userDAO.getById(decoded.id);
    if (!user) {
        res.status(401).json({ error: 'User not found.' });
        return;
    }
    if (user.is_blocked) {
        res.status(403).json({ error: 'Your account has been blocked. Contact an administrator.' });
        return;
    }

    (req as AuthRequest).user = decoded;
    next();
};