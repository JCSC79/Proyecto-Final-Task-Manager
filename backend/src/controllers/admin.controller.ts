import type { Request, Response } from 'express';
import { userDAO } from '../daos/user.dao.ts';
import { taskDAO } from '../daos/task.dao.ts';
import type { ITask } from '../models/task.model.ts';

/**
 * AdminController — serves the admin panel endpoints.
 * All routes are protected by authenticateToken + requireAdmin.
 */
class AdminController {

  /**
   * GET /api/admin/users
   * Returns all users with their task statistics (counts by status).
   */
  async getUsers(req: Request, res: Response): Promise<Response | void> {
    const users = await userDAO.getAll();
    const allTasks: ITask[] = await taskDAO.adminGetAll();

    const usersWithStats = users.map(user => {
      const userTasks = allTasks.filter(t => t.userId === user.id);
      const pending    = userTasks.filter(t => t.status === 'PENDING').length;
      const inProgress = userTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const completed  = userTasks.filter(t => t.status === 'COMPLETED').length;
      const total      = userTasks.length;
      const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        ...user,
        stats: { total, pending, inProgress, completed, completionRate },
      };
    });

    return res.json(usersWithStats);
  }

  /**
   * PATCH /api/admin/users/:id/role
   * Promotes or demotes a user. Body: { role: 'ADMIN' | 'USER' }
   * An admin cannot change their own role to avoid accidental self-lockout.
   */
  async updateUserRole(req: Request, res: Response): Promise<Response | void> {
    const id = String(req.params['id']);
    const { role } = req.body as { role?: string };

    const requestingUser = (req as Request & { user?: { id: string } }).user;

    if (requestingUser?.id === id) {
      return res.status(400).json({ error: 'Admins cannot change their own role.' });
    }

    if (role !== 'ADMIN' && role !== 'USER') {
      return res.status(400).json({ error: 'Role must be ADMIN or USER.' });
    }

    const updated = await userDAO.updateRole(id, role);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ message: `User role updated to ${role}.`, user: updated });
  }
}

export const adminController = new AdminController();
