import type { Request, Response } from 'express';
import { taskService } from '../services/task.service.ts';
import { auditDAO } from '../daos/audit.dao.ts';

/**
 * Interface to extend Express Request with user context.
 */
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

/**
 * TaskController - Manages the HTTP layer.
 * All business logic is delegated to TaskService.
 */
class TaskController {
  
  /**
   * GET /api/tasks
   */
  async getAll(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthRequest;
    const result = await taskService.getAllTasks(authReq.user!);
    res.json(result.getValue());
  }

  /**
   * GET /api/tasks/:id
   */
  async getById(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const result = await taskService.getTaskById(id, authReq.user!.id);
    
    if (result.isFailure) {
      return res.status(404).json({ error: result.error });
    }
    res.json(result.getValue());
  }

  /**
   * POST /api/tasks
   */
  async create(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const result = await taskService.createTask(req.body, authReq.user!.id);
    
    if (result.isFailure) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.getValue());
  }

  /**
   * DELETE /api/tasks/:id
   */
  async delete(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const result = await taskService.deleteTask(id, authReq.user!.id);
    
    if (result.isFailure) {
      return res.status(403).json({ error: result.error });
    }
    res.status(204).send();
  }

  /**
   * DELETE /api/tasks (Optional ?status= filter)
   */
  async deleteAll(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const statusQuery = req.query['status'];
    
    // FIX: Ensure status is a string or undefined, but never an array
    const status = typeof statusQuery === 'string' ? statusQuery : undefined;
    
    const result = await taskService.deleteTasksByStatus(authReq.user!.id, status);
    if (result.isFailure) {
      return res.status(500).json({ error: result.error });
    }
    res.status(204).send();
  }

  /**
   * PATCH /api/tasks/:id
   */
  async update(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const result = await taskService.updateTask(id, authReq.user!.id, req.body);
    
    if (result.isFailure) {
      return res.status(403).json({ error: result.error });
    }
    res.json(result.getValue());
  }

  /**
   * GET /api/tasks/:id/history
   */
  async getHistory(req: Request, res: Response): Promise<Response | void> {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const logs = await auditDAO.getByTaskId(id);
    res.json(logs);
  }
}

export const taskController = new TaskController();