import knex from 'knex';
import { createRequire } from 'module';
import type { ITask } from '../models/task.model.ts';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');
const db = knex(config.development);

/**
 * TaskDAO - Data Access Object with strict User Isolation.
 * Every method ensures that a user can only interact with their own data.
 */
class TaskDAO {
    
    /**
     * Retrieves tasks belonging to a specific user.
     */
    async getAll(userId: string): Promise<ITask[]> {
        return await db<ITask>('tasks').where({ userId }).select('*');
    }

    /**
     * SPECIAL: Allows ADMIN role to see the entire global task board.
     */
    async adminGetAll(): Promise<ITask[]> {
        return await db<ITask>('tasks').select('*');
    }

    /**
     * Finds a task by ID ensuring it belongs to the requesting user.
     */
    async getById(id: string, userId: string): Promise<ITask | undefined> {
        return await db<ITask>('tasks').where({ id, userId }).first();
    }

    async create(task: ITask): Promise<ITask> {
        await db<ITask>('tasks').insert(task);
        return task;
    }

    /**
     * Updates a task only if the ownership (userId) matches.
     */
    async update(id: string, userId: string, updates: Partial<ITask>): Promise<ITask | undefined> {
        const updatedRows = await db<ITask>('tasks')
            .where({ id, userId })
            .update(updates);

        if (updatedRows === 0) {
            return undefined;
        }
        return await this.getById(id, userId);
    }

    /**
     * Deletes a record strictly filtered by ID and Owner.
     */
    async delete(id: string, userId: string): Promise<boolean> {
        const deletedRows = await db<ITask>('tasks')
            .where({ id, userId })
            .del();
            
        return deletedRows > 0;
    }

    /**
     * Bulk delete limited to the user's own tasks.
     */
    async deleteAll(userId: string): Promise<void> {
        await db('tasks').where({ userId }).del();
    }
}

export const taskDAO = new TaskDAO();