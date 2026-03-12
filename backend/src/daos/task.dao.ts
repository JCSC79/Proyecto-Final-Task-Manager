import knex from 'knex';
import { createRequire } from 'module';
import type { ITask } from '../models/task.model.ts';

// Using createRequire to safely import CommonJS files (.cjs) in an ESM environment
const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');

// Initialize the database connection
const db = knex(config.development);

/**
 * Data Access Object.
 * Encapsulates all interactions with the PostgreSQL storage via Knex query builder.
 * Implements security best practices by using parameterized queries (OWASP).
 */
class TaskDAO {
    
    /**
     * Retrieves all records from the tasks table.
     * SQL equivalent: SELECT * FROM tasks
     */
    async getAll(): Promise<ITask[]> {
        return await db<ITask>('tasks').select('*');
    }

    /**
     * Fetches a single task by its unique identifier (UUID).
     * SQL equivalent: SELECT * FROM tasks WHERE id = ? LIMIT 1
     */
    async getById(id: string): Promise<ITask | undefined> {
        return await db<ITask>('tasks').where({ id }).first();
    }

    /**
     * Inserts a new task record into the database.
     * SQL equivalent: INSERT INTO tasks (id, title, description, status, createdAt) VALUES (...)
     */
    async create(task: ITask): Promise<ITask> {
        await db<ITask>('tasks').insert(task);
        return task;
    }

    /**
     * Updates an existing task record.
     * SQL equivalent: UPDATE tasks SET ... WHERE id = ?
     */
    async update(id: string, updates: Partial<ITask>): Promise<ITask | undefined> {
        const updatedRows = await db<ITask>('tasks')
            .where({ id })
            .update(updates);

        if (updatedRows === 0) return undefined;
        
        return await this.getById(id);
    }

    /**
     * Deletes a task record based on its ID.
     * SQL equivalent: DELETE FROM tasks WHERE id = ?
     */
    async delete(id: string): Promise<boolean> {
        const deletedRows = await db<ITask>('tasks')
            .where({ id })
            .del();
            
        return deletedRows > 0;
    }
}

export const taskDAO = new TaskDAO();