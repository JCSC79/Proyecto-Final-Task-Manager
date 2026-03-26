import type { Request, Response } from 'express';
import { adminService } from '../services/admin.service.ts';

/**
 * Admin controller for user/task administration endpoints.
 * All endpoints are protected with authenticate + isAdmin.
 */
class AdminController {
  async listUsers(_req: Request, res: Response): Promise<void> {
    const result = await adminService.getAllUsers();
    res.json(result.getValue());
  }

  async updateUserRole(req: Request, res: Response): Promise<Response | void> {
    const id = String(req.params.id || '');
    const role = String(req.body.role || '');

    if (!['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await adminService.updateUserRole(id, role as 'ADMIN' | 'USER');
    if (result.isFailure) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.getValue());
  }

  async deleteUser(req: Request, res: Response): Promise<Response | void> {
    const id = String(req.params.id || '');
    const result = await adminService.deleteUser(id);
    if (result.isFailure) {
      return res.status(404).json({ error: result.error });
    }
    res.status(204).send();
  }

  async listTasks(req: Request, res: Response): Promise<void> {
    const userId = req.query.userId as string | undefined;
    const result = await adminService.getTasks(userId);
    res.json(result.getValue());
  }

  async deleteTask(req: Request, res: Response): Promise<Response | void> {
    const id = String(req.params.id || '');
    const result = await adminService.deleteTask(id);
    if (result.isFailure) {
      return res.status(404).json({ error: result.error });
    }
    res.status(204).send();
  }
}

export const adminController = new AdminController();