import type { Request, Response, NextFunction } from 'express';

/**
 * RBAC (Role-Based Access Control) Middleware.
 * Logic: Checks if the authenticated user has ADMIN privileges.
 * Prerequisite: Must be placed AFTER the 'authenticate' middleware.
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    // We access the user object injected by the 'authenticate' middleware
    const user = (req as any).user;

    if (user && user.role === 'ADMIN') {
        // Access granted: Proceed to the next handler
        return next();
    }

    // 403 Forbidden: Identity is known, but lacks permission
    return res.status(403).json({ 
        error: "Access denied. This resource requires Admin privileges." 
    });
};