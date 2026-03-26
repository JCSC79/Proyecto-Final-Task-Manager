import { TaskStatus } from '../models/task.model.ts';
import type { ITask } from '../models/task.model.ts'; 
import { taskDAO } from '../daos/task.dao.ts';
import { messagingService } from './messaging.service.ts';
import { Result } from '../utils/result.ts';

/**
 * Orchestrates business logic and coordinates data access using the Result Pattern.
 */
export class TaskService {
    private readonly dao: typeof taskDAO;
    private readonly messaging: typeof messagingService;
    
    constructor(
        dao: typeof taskDAO = taskDAO,
        messaging: typeof messagingService = messagingService
    ) {
        this.dao = dao;
        this.messaging = messaging;
    }

    async getAllTasks(userId: string): Promise<Result<ITask[]>> {
        const tasks = await this.dao.getAll(userId);
        return Result.ok(tasks);
    }

    /**
     * Retrieves a task only if it belongs to the requester.
     */
    async getTaskById(id: string, userId: string): Promise<Result<ITask>> {
        const task = await this.dao.getById(id);
        if (!task) return Result.fail<ITask>("Task not found");
        
        if (task.userId !== userId) {
            return Result.fail<ITask>("Access denied. You do not own this task.");
        }
        return Result.ok(task);
    }

    async createTask(title: string, description: string, userId: string): Promise<Result<ITask>> {
        if (!title || title.trim() === '') {
            return Result.fail<ITask>("Title is required");
        }

        const newTask: ITask = {
            id: crypto.randomUUID(),
            title,
            description,
            status: TaskStatus.PENDING,
            createdAt: new Date(),
            userId
        };

        const createdTask = await this.dao.create(newTask);
        try {
            await this.messaging.sendTaskNotification(createdTask);
        } catch (error) {
            console.error("[TaskService] Messaging notification failed:", error);
        }
        return Result.ok(createdTask);
    }

    /**
     * Deletes a task only if the user is the owner.
     */
    async deleteTask(id: string, userId: string): Promise<Result<boolean>> {
        const task = await this.dao.getById(id);
        if (!task) {
            return Result.fail<boolean>("Task not found");
        }
        
        if (task.userId !== userId) {
            return Result.fail<boolean>("Access denied. Unauthorized deletion.");
        }

        const success = await this.dao.delete(id);
        return Result.ok(success);
    }

    /**
     * Phase 4: Clears only the requester's tasks.
     */
    async deleteAllTasks(userId: string): Promise<Result<boolean>> {
        await this.dao.deleteAll(userId);
        return Result.ok(true);
    }

    /**
     * Phase: Updates a task only if the user is the owner.
     */
    async updateTask(id: string, updates: Partial<ITask>, userId: string): Promise<Result<ITask>> {
        const task = await this.dao.getById(id);
        if (!task) {
            return Result.fail<ITask>("Task not found");
        }
        if (task.userId !== userId) {
            return Result.fail<ITask>("Access denied. Unauthorized update.");
        }

        const updatesWithTimestamp = {
            ...updates,
            updatedAt: new Date()
        };
        const updatedTask = await this.dao.update(id, updatesWithTimestamp);
        return Result.ok(updatedTask!);
    }
}

export const taskService = new TaskService();