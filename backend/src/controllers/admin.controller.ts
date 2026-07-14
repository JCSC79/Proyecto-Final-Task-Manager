import type { Request, Response } from 'express';
import { userDAO } from '../daos/user.dao.ts';
import { taskDAO } from '../daos/task.dao.ts';
import { auditDAO } from '../daos/audit.dao.ts';
import type { ITask } from '../models/task.model.ts';
import { generateAdminPdf } from '../services/pdf.service.ts';

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

  /**
   * PATCH /api/admin/users/:id/block
   * Blocks or unblocks a user. Body: { blocked: boolean }
   * An admin cannot block themselves.
   */
  async blockUser(req: Request, res: Response): Promise<Response | void> {
    const id = String(req.params['id']);
    const { blocked } = req.body as { blocked?: unknown };

    const requestingUser = (req as Request & { user?: { id: string } }).user;
    if (requestingUser?.id === id) {
      return res.status(400).json({ error: 'Admins cannot block themselves.' });
    }

    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ error: 'blocked must be a boolean.' });
    }

    const updated = await userDAO.setBlocked(id, blocked);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ message: `User ${blocked ? 'blocked' : 'unblocked'}.`, user: updated });
  }

  /**
   * DELETE /api/admin/users/:id
   * Permanently deletes a user and all their data (CASCADE in DB).
   * An admin cannot delete themselves.
   */
  async deleteUser(req: Request, res: Response): Promise<Response | void> {
    const id = String(req.params['id']);

    const requestingUser = (req as Request & { user?: { id: string } }).user;
    if (requestingUser?.id === id) {
      return res.status(400).json({ error: 'Admins cannot delete their own account.' });
    }

    const deleted = await userDAO.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(204).send();
  }

  /**
   * GET /api/admin/export/pdf
   */
  async exportPdf(req: Request, res: Response): Promise<void> {
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
        ...(user.name ? { name: user.name } : {}),
        email: user.email,
        stats: { total, pending, inProgress, completed, completionRate },
      };
    });

    const requestingUser = (req as Request & { user?: { id: string; email?: string; name?: string } }).user;
    const generatedBy = requestingUser?.email ?? 'Admin';
    const lang: 'en' | 'es' = req.query['lang'] === 'es' ? 'es' : 'en';
    const pdfBuffer = await generateAdminPdf(usersWithStats, lang, generatedBy);
    const filename = `admin-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }
  /**
   * GET /api/admin/analytics?range=7|30|90|all
   * Returns lead times by category and workload by user.
   */
  async getAnalytics(req: Request, res: Response): Promise<Response | void> {
    const rawRange = req.query['range'];
    const range = typeof rawRange === 'string' ? rawRange : 'all';
    let since: Date | undefined;
    if (range === '7')  {
      since = new Date(Date.now() - 7  * 86_400_000);
    }
    if (range === '30') {
      since = new Date(Date.now() - 30 * 86_400_000);
    }
    if (range === '90') {
      since = new Date(Date.now() - 90 * 86_400_000);
    }

    const [leadTimes, workload] = await Promise.all([
      auditDAO.getLeadTimesByCategory(since),
      auditDAO.getWorkloadByUser(),
    ]);

    return res.json({ leadTimes, workload });
  }
}

export const adminController = new AdminController();
