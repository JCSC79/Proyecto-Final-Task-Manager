import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import type { IComment } from '../models/comment.model.ts';
import type { ITask } from '../models/task.model.ts';

const JWT_SECRET = process.env.JWT_SECRET ?? '';

/**
 * SocketService — wraps Socket.IO lifecycle.
 *
 *   1. server.ts calls socketService.init(httpServer) after creating the HTTP server.
 *   2. Clients connect sending their JWT in socket.handshake.auth.token.
 *   3. The auth middleware verifies the token — invalid tokens are rejected immediately.
 *   4. Clients emit 'join-task' / 'leave-task' to subscribe to a task room.
 *   5. When a comment is saved, commentController calls broadcastComment() which emits 'new-comment' only to sockets in that task's room.
 */
class SocketService {
    private io: Server | null = null;

    init(httpServer: HttpServer): void {
        this.io = new Server(httpServer, {
            cors: {
                origin: 'http://localhost:5173',
                credentials: true,
            },
        });

        // Auth middleware — runs before every connection
        // Reads the JWT from the same HttpOnly cookie used by the REST API
        this.io.use((socket, next) => {
            const cookieHeader = socket.handshake.headers['cookie'] ?? '';
            const match = /auth_token=([^;]+)/.exec(cookieHeader);
            const token = match ? match[1] : undefined;

            if (!token) {
                next(new Error('Authentication cookie required.'));
                return;
            }
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
                socket.data['userId'] = decoded.id;
                next();
            } catch {
                next(new Error('Invalid or expired token.'));
            }
        });

        this.io.on('connection', (socket) => {
            const userId: string = socket.data['userId'] as string;
            console.log(`[Socket] Connected: ${userId} (${socket.id})`);

            // Client joins the room for a specific task when TaskDetailsDialog opens
            socket.on('join-task', (taskId: string) => {
                void socket.join(`task:${taskId}`);
                console.log(`[Socket] ${userId} joined task:${taskId}`);
            });

            // Client leaves the room when TaskDetailsDialog closes
            socket.on('leave-task', (taskId: string) => {
                void socket.leave(`task:${taskId}`);
                console.log(`[Socket] ${userId} left task:${taskId}`);
            });

            socket.on('disconnect', () => {
                console.log(`[Socket] Disconnected: ${userId} (${socket.id})`);
            });
        });

        console.log('[OK] Socket.IO initialized.');
    }

    /**
     * Broadcasts a new comment to ALL connected clients.
     *
     * Two-channel approach:
     * - ALL clients receive the event so the unread badge can appear even if the dialog is not open (clients not in the room would miss it otherwise).
     * - Clients with the dialog open also happen to be in the room, but since we broadcast globally the room subscription is now only used for join/leave tracking.
     *
     * The frontend already skips marking own comments as unread and calls onRead for clients that have the dialog open, so no duplicate logic needed here.
     */
    broadcastComment(taskId: string, comment: IComment): void {
        if (!this.io) {
            return;
        }
        this.io.emit('new-comment', comment);
    }

    // Broadcasts a task update to ALL connected clients (not just the task room), so any open TaskBoard refreshes in real time without polling.
    broadcastTaskUpdate(task: ITask): void {
        if (!this.io) {
            return;
        }
        this.io.emit('task-updated', task);
    }

    // Notifies all clients that a task was deleted (by ID).
    broadcastTaskDeleted(taskId: string): void {
        if (!this.io) {
            return;
        }
        this.io.emit('task-deleted', { id: taskId });
    }

    /**
     * Broadcasts a project lifecycle event to all connected clients.
     * eventName: 'project-created' | 'project-deleted' | 'project-members-changed'
     * payload: the created project object, or { id } for deleted/changed events.
     */
    broadcastProjectEvent(eventName: string, payload: unknown): void {
        if (!this.io) {
            return;
        }
        this.io.emit(eventName, payload);
    }

    getIO(): Server | null {
        return this.io;
    }
}

// Singleton — imported by both server.ts (init) and comment.controller.ts (broadcast)
export const socketService = new SocketService();
