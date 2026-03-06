import type { ITask } from '../models/task.model.ts';

/**
 * Data Access Object.
 * Encapsulates all interactions with the in-memory storage.
 */
class TaskDAO {
    // Data storage now resides exclusively here
    private tasks: ITask[] = [];

    getAll(): ITask[] {
        return this.tasks;
    }

    getById(id: string): ITask | undefined {
        return this.tasks.find(task => task.id === id);
    }

    create(task: ITask): ITask {
        this.tasks.push(task);
        return task;
    }

    /**
     * Updates an existing record in the storage array.
     * Uses Object.assign to merge old data with new updates.
     */
    update(id: string, updates: Partial<ITask>): ITask | undefined {
        const task = this.getById(id);
        if (!task) return undefined;

        // Object.assign takes the 'task' and overwrites only the fields
        // present in 'updates' (like title or status).
        Object.assign(task, updates);
        return task;
    }

    /**
     * Removes a record based on ID and returns true if successful.
     */
    delete(id: string): boolean {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);
        return this.tasks.length < initialLength;
    }
}

export const taskDAO = new TaskDAO();