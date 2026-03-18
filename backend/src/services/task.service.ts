import { TaskStatus } from '../models/task.model.ts';
import type { ITask } from '../models/task.model.ts'; 
import { taskDAO } from '../daos/task.dao.ts';
import { messagingService } from './messaging.service.ts';
import { Result } from '../utils/result.ts';

/**
 * Orchestrates business logic and coordinates data access using the Result Pattern.
 * Ensures all operations return a standardized outcome to avoid exception-based flow control.
 */
export class TaskService {
    /**
     * Retrieves all tasks from the persistence layer.
     */
    async getAllTasks(): Promise<Result<ITask[]>> {
        const tasks = await taskDAO.getAll();
        return Result.ok(tasks);
    }

    /**
     * Finds a specific task by its unique identifier.
     */
    async getTaskById(id: string): Promise<Result<ITask>> {
        const task = await taskDAO.getById(id);
        if (!task) {
            return Result.fail<ITask>("Task not found");
        }
        return Result.ok(task);
    }

    /**
     * Logic for generating new tasks.
     */
    async createTask(title: string, description: string): Promise<Result<ITask>> {
        const newTask: ITask = {
            id: crypto.randomUUID(),
            title,
            description,
            status: TaskStatus.PENDING,
            createdAt: new Date()
        };

        const createdTask = await taskDAO.create(newTask);

        try {
            await messagingService.sendTaskNotification(createdTask);
        } catch (error) {
            console.error("[TaskService] Messaging notification failed:", error);
        }

        return Result.ok(createdTask);
    }

    /**
     * Removes a task from the system.
     */
    async deleteTask(id: string): Promise<Result<boolean>> {
        const success = await taskDAO.delete(id);
        if (!success) {
            return Result.fail<boolean>("Task not found or could not be deleted");
        }
        return Result.ok(true);
    }

    /**
     * Delegates partial update operations to the storage layer.
     * UPDATED: Automatically injects the updatedAt timestamp for KPI calculations.
     */
    async updateTask(id: string, updates: Partial<ITask>): Promise<Result<ITask>> {
        // We force the updatedAt field to the current server time on every update
        const updatesWithTimestamp = {
            ...updates,
            updatedAt: new Date()
        };

        const updatedTask = await taskDAO.update(id, updatesWithTimestamp);
        
        if (!updatedTask) {
            return Result.fail<ITask>("Task not found or update failed");
        }
        
        return Result.ok(updatedTask);
    }
}

export const taskService = new TaskService();