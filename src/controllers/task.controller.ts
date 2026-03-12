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
   * Validates input using Yup schemas and creates a new task.
   * Replaced try-catch with a safe validation approach to maintain architecture consistency.
   */
  async create(req: Request, res: Response) {
    // 1. Safe validation without throwing exceptions
    const validatedData = await createTaskSchema.validate(req.body)
      .catch(err => ({ isError: true, message: err.message }));

    // 2. Check if Yup returned a validation error object
    if ('isError' in validatedData) {
      return res.status(400).json({ error: validatedData.message });
    }

    // 3. Delegate to service and handle the Result object
    const result = await taskService.createTask(validatedData.title, validatedData.description);
    
    if (result.isFailure) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json(result.getValue());
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
   * Refactored to avoid try-catch blocks in favor of functional error handling.
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // 1. Safe validation for partial updates
    const validatedUpdates = await updateTaskSchema.validate(req.body, { 
      stripUnknown: true 
    }).catch(err => ({ isError: true, message: err.message }));

    // 2. Handle Schema validation failure
    if ('isError' in validatedUpdates) {
      return res.status(400).json({ error: validatedUpdates.message });
    }

    // 3. Delegate to service and process Result
    const result = await taskService.updateTask(id, validatedUpdates as Partial<ITask>);
    
    if (result.isFailure) {
      // Differentiate between 404 (Not Found) and other errors
      const status = result.error?.includes('not found') ? 404 : 500;
      return res.status(status).json({ error: result.error });
    }

    res.json(result.getValue());
  }
}

export const taskController = new TaskController();