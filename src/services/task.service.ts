import { TaskStatus } from '../models/task.model.ts';
import type { ITask } from '../models/task.model.ts';
import { taskDAO } from '../daos/task.dao.ts';
import { messagingService } from './messaging.service.ts';

/**
 * Orchestrates business logic and coordinates data access.
 * Now fully asynchronous to handle database operations.
 */
export class TaskService {
    async getAllTasks(): Promise<ITask[]> {
        // We await the DAO promise
        return await taskDAO.getAll();
    }

    async getTaskById(id: string): Promise<ITask | undefined> {
        return await taskDAO.getById(id);
    }

    /**
     * Logic for generating new tasks and persisting them in PostgreSQL.
     */
    async createTask(title: string, description: string): Promise<ITask> {
        const newTask: ITask = {
            id: crypto.randomUUID(),
            title,
            description,
            status: TaskStatus.PENDING,
            createdAt: new Date()
        };

        // We must await the creation in the database
        const createdTask = await taskDAO.create(newTask);

        // Notify via RabbitMQ about the new task creation
        await messagingService.sendTaskNotification(createdTask);

        return createdTask;
    }

    async deleteTask(id: string): Promise<boolean> {
        return await taskDAO.delete(id);
    }

    /**
     * Delegates update operations to the storage layer.
     * Uses parameterized queries via Knex to prevent SQL Injection.
     * Partial<ITask> allows updating only specific fields.
     */
    async updateTask(id: string, updates: Partial<ITask>): Promise<ITask | undefined> {
        return await taskDAO.update(id, updates);
    }
}

export const taskService = new TaskService();