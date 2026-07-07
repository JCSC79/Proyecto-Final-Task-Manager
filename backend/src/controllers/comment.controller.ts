import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { commentDAO } from '../daos/comment.dao.ts';
import { socketService } from '../services/socket.service.ts';

interface AuthRequest extends Request {
    user?: { id: string; role: string; email: string };
}

class CommentController {
    /**
     * GET /api/tasks/:id/comments
     * Returns all comments for a task (oldest first).
     */
    async getByTask(req: Request, res: Response): Promise<Response | void> {
        const taskId = String(req.params['id']);
        const comments = await commentDAO.getByTask(taskId);
        return res.json(comments);
    }

    /**
     * POST /api/tasks/:id/comments
     * Creates a new comment and broadcasts it via Socket.IO.
     * Body: { body: string }
     */
    async create(req: Request, res: Response): Promise<Response | void> {
        const taskId = String(req.params['id']);
        const userId = (req as AuthRequest).user?.id;
        const { body } = req.body as { body?: string };

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
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

        // Broadcast to all clients subscribed to this task's room
        socketService.broadcastComment(taskId, comment);

        return res.status(201).json(comment);
    }
}

export const commentController = new CommentController();
