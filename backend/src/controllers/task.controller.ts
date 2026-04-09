import type { Request, Response } from 'express';
import { taskService } from '../services/task.service.ts';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema.ts';
import type { ITask } from '../models/task.model.ts';

/**
 * Custom interface to extend Express Request.
 * This allows us to access 'req.user' without using 'any', fulfilling strict ESLint rules.
 */
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

/**
 * Updated interface to capture detailed validation errors from Yup.
 * This allows the frontend to receive an array of keys for translation.
 */
interface YupError {
  errors?: string[]; // Array of translation keys like ['err_title_short']
  message: string;   // Fallback generic message
}

/**
 * TaskController - Manages the HTTP layer for task operations.
 * Strictly enforces user identity in every request.
 */
class TaskController {
  
  /**
   * Retrieves tasks. Admin gets global view, User gets private view.
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const result = await taskService.getAllTasks(authReq.user!);
      res.json(result.getValue());
    } catch {
      res.status(500).json({ error: 'Failed to retrieve tasks' });
    }
  }

  /**
   * Retrieves a specific task ensuring ownership.
   */
  async getById(req: Request, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const authReq = req as AuthRequest;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const result = await taskService.getTaskById(id, authReq.user!.id);
    if (result.isFailure) {
      return res.status(404).json({ error: result.error });
    }
    res.json(result.getValue());
  }

  /**
   * Creates a new task bound to the authenticated user's ID.
   */
  async create(req: Request, res: Response): Promise<Response | void> {
    try {
      // abortEarly: false ensures all validation errors are collected
      const validatedData = await createTaskSchema.validate(req.body, { abortEarly: false });
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "User identity not found in token" });
      }

      const result = await taskService.createTask(
        validatedData.title, 
        validatedData.description,
        userId
      );
      
      if (result.isFailure) {
        return res.status(500).json({ error: result.error });
      }

      res.status(201).json(result.getValue());
    } catch (err) {
      // Return the array of error keys for frontend translation
      const yupError = err as YupError;
      return res.status(400).json({ error: yupError.errors || yupError.message });
    }
  }

  /**
   * Deletes a specific task if it belongs to the authenticated user.
   */
  async delete(req: Request, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const authReq = req as AuthRequest;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const result = await taskService.deleteTask(id, authReq.user!.id);
    if (result.isFailure) {
      // 403 Forbidden because the task exists but doesn't belong to the user
      return res.status(403).json({ error: result.error });
    }
    res.status(204).send();
  }

  /**
   * Clears all tasks belonging to the requesting user.
   */
  async deleteAll(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const result = await taskService.deleteAllTasks(authReq.user!.id);
    
    if (result.isFailure) {
      return res.status(500).json({ error: result.error });
    }
    res.status(204).send();
  }

  /**
   * Partially updates a task after verifying ownership.
   */
  async update(req: Request, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const authReq = req as AuthRequest;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const validatedUpdates = await updateTaskSchema.validate(req.body, { 
        stripUnknown: true,
        abortEarly: false 
      });

      const result = await taskService.updateTask(id, authReq.user!.id, validatedUpdates as Partial<ITask>);
      
      if (result.isFailure) {
        return res.status(403).json({ error: result.error });
      }

      res.json(result.getValue());
    } catch (err) {
      // Consistently return array of errors for translation support
      const yupError = err as YupError;
      return res.status(400).json({ error: yupError.errors || yupError.message });
    }
  }
}

export const taskController = new TaskController();