import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { commentDAO } from '../daos/comment.dao.ts';
import { taskDAO } from '../daos/task.dao.ts';
import { socketService } from '../services/socket.service.ts';

interface AuthRequest extends Request {
    user?: { id: string; role: string; email: string };
}

/**
 * Verifies that the requesting user has access to the task's comments.
 * Rules:
 *   - Task with a project → user must be a project member (or owner)
 *   - Task without a project → user must be the task owner
 * Reuses taskDAO.getById which enforces both rules in a single query.
 * Returns the task if allowed, or sends a 403/404 response and returns null.
 */
async function assertCommentAccess(
    taskId: string,
    userId: string,
    res: Response,
): Promise<boolean> {
    const task = await taskDAO.getById(taskId, userId);
    if (!task) {
        res.status(403).json({ error: 'Access denied. You are not a member of this task\'s project.' });
        return false;
    }
    return true;
}

class CommentController {
    /**
     * GET /api/tasks/:id/comments
     * Returns all comments for a task (oldest first).
     * Only accessible to task owner or project members.
     */
    async getByTask(req: Request, res: Response): Promise<Response | void> {
        const taskId = String(req.params['id']);
        const userId = (req as AuthRequest).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const allowed = await assertCommentAccess(taskId, userId, res);
        if (!allowed) {
            return;
        }

        const comments = await commentDAO.getByTask(taskId);
        return res.json(comments);
    }

    /**
     * POST /api/tasks/:id/comments
     * Creates a new comment and broadcasts it via Socket.IO.
     * Only accessible to task owner or project members.
     * Body: { body: string }
     */
    async create(req: Request, res: Response): Promise<Response | void> {
        const taskId = String(req.params['id']);
        const userId = (req as AuthRequest).user?.id;
        const { body } = req.body as { body?: string };

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const allowed = await assertCommentAccess(taskId, userId, res);
        if (!allowed) {
            return;
        }

        if (!body || body.trim().length === 0) {
            return res.status(400).json({ error: 'Comment body cannot be empty.' });
        }
        
        if (body.trim().length > 1000) {
            return res.status(400).json({ error: 'Comment cannot exceed 1000 characters.' });
        }

        const comment = await commentDAO.create({
            id: randomUUID(),
            taskId,
            userId,
            body: body.trim(),
        });

        socketService.broadcastComment(taskId, comment);

        return res.status(201).json(comment);
    }
}

export const commentController = new CommentController();
