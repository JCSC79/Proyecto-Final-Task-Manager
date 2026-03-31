import type { Request, Response, NextFunction } from 'express';

/**
 * requireAdmin — authorization middleware that runs AFTER authenticateToken.
 * Rejects any request whose JWT payload does not carry role === 'ADMIN'.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as Request & { user?: { id: string; role: string; email: string } }).user;

  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admin access required.' });
    return;
  }

  next();
};
