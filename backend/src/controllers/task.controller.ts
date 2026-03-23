import type { Request, Response } from 'express';
import { taskService } from '../services/task.service.ts';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema.ts';
import type { ITask } from '../models/task.model.ts';

interface YupError {
  message: string;
}

class TaskController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    const userId = (req as Request & { user: { id: string } }).user.id;
    const result = await taskService.getAllTasks(userId);
    res.json(result.getValue());
  }

  /**
   * Protected retrieval by ID.
   * Validates that 'id' is a single string to avoid TS(2345).
   */
  async getById(req: Request, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const userId = (req as Request & { user: { id: string } }).user.id;

    // FIX: Ensure id is a valid string before passing it to the service
    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    const result = await taskService.getTaskById(id, userId);
    if (result.isFailure) {
      const status = result.error?.includes('denied') ? 403 : 404;
      return res.status(status).json({ error: result.error });
    }
    res.json(result.getValue());
  }

  async create(req: Request, res: Response): Promise<Response | void> {
    try {
      const validatedData = await createTaskSchema.validate(req.body, { abortEarly: false });
      const userId = (req as Request & { user: { id: string } }).user.id;
      
      const result = await taskService.createTask(validatedData.title, validatedData.description || '', userId);
      res.status(201).json(result.getValue());
    } catch (err) {
      return res.status(400).json({ error: (err as YupError).message });
    }
  }

  /**
   * Protected individual deletion.
   * Validates that 'id' is a single string to avoid TS(2345).
   */
  async delete(req: Request, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const userId = (req as Request & { user: { id: string } }).user.id;

    // FIX: Ensure id is a valid string before passing it to the service
    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const result = await taskService.deleteTask(id, userId);
    if (result.isFailure) {
      const status = result.error?.includes('denied') ? 403 : 404;
      return res.status(status).json({ error: result.error });
    }
    res.status(204).send();
  }

  /**
   * Protected mass deletion (Current user only).
   */
  async deleteAll(req: Request, res: Response): Promise<Response | void> {
    const userId = (req as Request & { user: { id: string } }).user.id;
    await taskService.deleteAllTasks(userId);
    res.status(204).send();
  }

  /**
   * Protected update.
   * Validates that 'id' is a single string to avoid TS(2345).
   */
  async update(req: Request, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const userId = (req as Request & { user: { id: string } }).user.id;

    // FIX: Ensure id is a valid string before passing it to the service
    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const validatedUpdates = await updateTaskSchema.validate(req.body, { stripUnknown: true });
      const result = await taskService.updateTask(id, validatedUpdates as Partial<ITask>, userId);
      
      if (result.isFailure) {
        const status = result.error?.includes('denied') ? 403 : 404;
        return res.status(status).json({ error: result.error });
      }
      res.json(result.getValue());
    } catch (err) {
      return res.status(400).json({ error: (err as YupError).message });
    }
  }
}

export const taskController = new TaskController();