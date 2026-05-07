import type { Request, Response } from 'express';
import { projectDAO } from '../daos/project.dao.ts';

interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string; };
}

/**
 * ProjectController - Manages project workspaces.
 */
class ProjectController {
  /**
   * GET /api/projects
   * Returns all projects for the authenticated user.
   */
  async getAll(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthRequest;
    const projects = await projectDAO.getAllByUser(authReq.user!.id);
    res.json(projects);
  }
}

export const projectController = new ProjectController();