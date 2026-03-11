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
     * @returns {Promise<Result<ITask[]>>} A Result containing an array of tasks.
     */
    async getAllTasks(): Promise<Result<ITask[]>> {
        const tasks = await taskDAO.getAll();
        return Result.ok(tasks);
    }

    /**
     * Finds a specific task by its unique identifier.
     * @param {string} id - The UUID of the task.
     * @returns {Promise<Result<ITask>>} Success with task data or failure if not found.
     */
    async getTaskById(id: string): Promise<Result<ITask>> {
        const task = await taskDAO.getById(id);
        if (!task) {
            return Result.fail<ITask>("Task not found");
        }
        return Result.ok(task);
    }

    /**
     * Logic for generating new tasks, persisting them in PostgreSQL, 
     * and triggering asynchronous notifications via RabbitMQ.
     * @param {string} title - Task title.
     * @param {string} description - Detailed task description.
     * @returns {Promise<Result<ITask>>} The newly created task.
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
            // Notify via RabbitMQ message broker about the new task event
            await messagingService.sendTaskNotification(createdTask);
        } catch (error) {
            // We log the error but don't fail the operation since the task is already in DB
            console.error("[TaskService] Messaging notification failed:", error);
        }

        return Result.ok(createdTask);
    }

    /**
     * Removes a task from the system.
     * @param {string} id - The UUID of the task to delete.
     * @returns {Promise<Result<boolean>>} Success if deleted, failure if ID is missing.
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
     * @param {string} id - Task UUID.
     * @param {Partial<ITask>} updates - Object containing fields to be updated.
     * @returns {Promise<Result<ITask>>} The updated task record.
     */
    async updateTask(id: string, updates: Partial<ITask>): Promise<Result<ITask>> {
        const updatedTask = await taskDAO.update(id, updates);
        
        if (!updatedTask) {
            return Result.fail<ITask>("Task not found or update failed");
        }
        
        return Result.ok(updatedTask);
    }
}

export const taskService = new TaskService();