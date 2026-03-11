import type { Request, Response } from 'express';
import { taskService } from '../services/task.service.ts';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema.ts';
import type { ITask } from '../models/task.model.ts';

/**
 * Handles incoming HTTP requests and orchestrates the service layer.
 * Implements the Result Pattern for consistent error handling and response formatting.
 */
class TaskController {
  /**
   * Retrieves all tasks from the database.
   */
  async getAll(_req: Request, res: Response) {
    const result = await taskService.getAllTasks();
    res.json(result.getValue());
  }

  /**
   * Handles single task retrieval by UUID.
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    const result = await taskService.getTaskById(id);
    if (result.isFailure) {
      return res.status(404).json({ error: result.error });
    }
    res.json(result.getValue());
  }

  /**
   * Validates input using Yup and creates a new task.
   */
  async create(req: Request, res: Response) {
    try {
      const validatedData = await createTaskSchema.validate(req.body);
      const result = await taskService.createTask(validatedData.title, validatedData.description);
      res.status(201).json(result.getValue());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  /**
   * Manages task deletion. 
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    const result = await taskService.deleteTask(id);
    if (result.isFailure) {
      return res.status(404).json({ error: result.error });
    }
    res.status(204).send();
  }

  /**
   * Updates an existing task partially.
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    try {
      const validatedUpdates = await updateTaskSchema.validate(req.body, { 
        stripUnknown: true 
      }) as Partial<ITask>;
      const result = await taskService.updateTask(id, validatedUpdates);
      if (result.isFailure) {
        return res.status(404).json({ error: result.error });
      }
      res.json(result.getValue());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}

export const taskController = new TaskController();