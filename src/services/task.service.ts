import { TaskStatus } from '../models/task.model.ts';
import type { ITask } from '../models/task.model.ts';

/**
 * TaskService handles the business logic for tasks.
 * For now, it manages tasks in an in-memory array.
 */
export class TaskService {
    // Private array to store tasks
    private tasks: ITask[] = [];

    /**
     * Returns all tasks
     */
    getAllTasks(): ITask[] {
        return this.tasks;
    }

    /**
     * Adds a new task to the list
     */
    createTask(title: string, description: string): ITask {
        const newTask: ITask = {
            id: crypto.randomUUID(), // Generates a unique ID
            title,
            description,
            status: TaskStatus.PENDING,
            createdAt: new Date()
        };

        this.tasks.push(newTask);
        return newTask;
    }
}

// Export a single instance (Singleton) to be used across the app
export const taskService = new TaskService();