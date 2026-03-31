import { TaskStatus } from '../models/task.model.ts';
import type { ITask } from '../models/task.model.ts'; 
import { taskDAO } from '../daos/task.dao.ts';
import { messagingService } from './messaging.service.ts';
import { Result } from '../utils/result.ts';
import crypto from 'node:crypto';

/**
 * TaskService - Orchestrates business logic with strict user isolation.
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

    async getAllTasks(user: { id: string, role: string }): Promise<Result<ITask[]>> {
        const tasks = user.role === 'ADMIN' 
            ? await this.dao.adminGetAll() 
            : await this.dao.getAll(user.id);
        return Result.ok(tasks);
    }

    async getTaskById(id: string, userId: string): Promise<Result<ITask>> {
        const task = await this.dao.getById(id, userId);
        if (!task) {
            return Result.fail<ITask>("Task not found or access denied");
        }
        return Result.ok(task);
    }

    async createTask(title: string, description: string, userId: string): Promise<Result<ITask>> {
        if (!title?.trim()) {
            return Result.fail<ITask>("Title is required");
        }

        const newTask: ITask = {
            id: crypto.randomUUID(),
            title,
            description,
            status: TaskStatus.PENDING,
            userId,
            createdAt: new Date()
        };

        const createdTask = await this.dao.create(newTask);
        await this.messaging.sendTaskNotification(createdTask);
        return Result.ok(createdTask);
    }

    async deleteTask(id: string, userId: string): Promise<Result<boolean>> {
        const success = await this.dao.delete(id, userId);
        if (!success) {
            return Result.fail<boolean>("Task not found or permission denied");
        }
        return Result.ok(true);
    }

    /**
     * NEW/FIXED: Matches the controller's call to clear user-specific board.
     */
    async deleteAllTasks(userId: string): Promise<Result<boolean>> {
        await this.dao.deleteAll(userId);
        return Result.ok(true);
    }

    async updateTask(id: string, userId: string, updates: Partial<ITask>): Promise<Result<ITask>> {
        const updatedTask = await this.dao.update(id, userId, { ...updates, updatedAt: new Date() });
        if (!updatedTask) {
            return Result.fail<ITask>("Unauthorized update attempt");
        }
        return Result.ok(updatedTask);
    }
}

export const taskService = new TaskService();