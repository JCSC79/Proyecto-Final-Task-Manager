import { TaskStatus } from '../models/task.model.ts';
import type { ITask } from '../models/task.model.ts';

export class TaskService {
    private tasks: ITask[] = [];

    getAllTasks(): ITask[] {
        return this.tasks;
    }

    /**
     * Finds a specific task by its unique ID
     */
    getTaskById(id: string): ITask | undefined {
        return this.tasks.find(task => task.id === id);
    }

    createTask(title: string, description: string): ITask {
        const newTask: ITask = {
            id: crypto.randomUUID(),
            title,
            description,
            status: TaskStatus.PENDING,
            createdAt: new Date()
        };

        this.tasks.push(newTask);
        return newTask;
    }

    /**
     * Updates an existing task's data
     */
    updateTask(id: string, updates: Partial<ITask>): ITask | undefined {
        const task = this.getTaskById(id);
        if (!task) {
            return undefined;
        }
        // We apply the updates to the found task
        Object.assign(task, updates);
        return task;
    }

    /**
     * Removes a task from the array
     */
    deleteTask(id: string): boolean {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);
        return this.tasks.length < initialLength;
    }
}

export const taskService = new TaskService();