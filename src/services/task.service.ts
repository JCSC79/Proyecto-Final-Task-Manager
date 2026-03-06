import { TaskStatus } from '../models/task.model.ts';
import type { ITask } from '../models/task.model.ts';
import { taskDAO } from '../daos/task.dao.ts';

/**
 * Orchestrates business logic and coordinates data access.
 */
export class TaskService {
    getAllTasks(): ITask[] {
        return taskDAO.getAll();
    }

    getTaskById(id: string): ITask | undefined {
        return taskDAO.getById(id);
    }

    /**
     * Logic for generating new tasks with metadata.
     */
    createTask(title: string, description: string): ITask {
        const newTask: ITask = {
            id: crypto.randomUUID(),
            title,
            description,
            status: TaskStatus.PENDING,
            createdAt: new Date()
        };

        return taskDAO.create(newTask);
    }

    deleteTask(id: string): boolean {
        return taskDAO.delete(id);
    }

    /**
     * Delegates update operations to the storage layer.
     * It receives the ID and the partial object with changes.
     */
    updateTask(id: string, updates: Partial<ITask>): ITask | undefined {
        // Here we just act as a bridge to the DAO
        return taskDAO.update(id, updates);
    }
}

export const taskService = new TaskService();