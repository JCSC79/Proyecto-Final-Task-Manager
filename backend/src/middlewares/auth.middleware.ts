import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    // REFINEMENT: Check both Authorization header and HttpOnly cookies
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies['auth_token'];

    const token = cookieToken || headerToken;

    if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET as string) as { id: string; role: string; email: string };
        (req as AuthRequest).user = decoded;
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};