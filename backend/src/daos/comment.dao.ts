import knex from 'knex';
import { createRequire } from 'node:module';
import type { IComment } from '../models/comment.model.ts';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');
const db = knex(config.development);

class CommentDAO {
    /**
     * Returns all comments for a task, joined with the author's name and email.
     * Ordered oldest-first so the thread reads top-to-bottom.
     */
    async getByTask(taskId: string): Promise<IComment[]> {
        return await db('comments')
            .join('users', 'comments.userId', 'users.id')
            .where({ 'comments.taskId': taskId })
            .select(
                'comments.id',
                'comments.taskId',
                'comments.userId',
                'comments.body',
                'comments.createdAt',
                'users.name as authorName',
                'users.email as authorEmail',
            )
            .orderBy('comments.createdAt', 'asc') as IComment[];
    }

    async create(data: { id: string; taskId: string; userId: string; body: string }): Promise<IComment> {
        await db('comments').insert({
            id: data.id,
            taskId: data.taskId,
            userId: data.userId,
            body: data.body,
        });
        // Return with author info by fetching the just-inserted row
        const rows = await this.getByTask(data.taskId);
        return rows.find(c => c.id === data.id) as IComment;
    }
}

export const commentDAO = new CommentDAO();
