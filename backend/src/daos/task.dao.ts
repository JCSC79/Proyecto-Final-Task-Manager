import knex from 'knex';
import { createRequire } from 'module';
import type { ITask } from '../models/task.model.ts';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');
const db = knex(config.development);

/**
 * Data Access Object.
 * Encapsulates all interactions with the PostgreSQL storage via Knex query builder.
 */
class TaskDAO {
    
    /**
     * Retrieves tasks filtered by the owner's ID.
     */
    async getAll(userId: string): Promise<ITask[]> {
        return await db<ITask>('tasks').select('*').where({ userId });
    }

    async getById(id: string): Promise<ITask | undefined> {
        return await db<ITask>('tasks').where({ id }).first();
    }

    async create(task: ITask): Promise<ITask> {
        await db<ITask>('tasks').insert(task);
        return task;
    }

    async update(id: string, updates: Partial<ITask>): Promise<ITask | undefined> {
        const updatedRows = await db<ITask>('tasks')
            .where({ id })
            .update(updates);

        if (updatedRows === 0) {
            return undefined;
        }
        return await this.getById(id);
    }

    async delete(id: string): Promise<boolean> {
        const deletedRows = await db<ITask>('tasks')
            .where({ id })
            .del();
            
        return deletedRows > 0;
    }

    /**
     * Phase 4: Removes all tasks ONLY for a specific user.
     * Prevents one user from clearing the entire database.
     */
    async deleteAll(userId: string): Promise<void> {
        await db('tasks').where({ userId }).del();
    }
}

export const taskDAO = new TaskDAO();