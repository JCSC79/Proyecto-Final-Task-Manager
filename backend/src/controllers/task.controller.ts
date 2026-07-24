import type { Request, Response } from 'express';
import { taskService } from '../services/task.service.ts';
import { auditDAO } from '../daos/audit.dao.ts';
import { taskDAO } from '../daos/task.dao.ts';
import { projectDAO } from '../daos/project.dao.ts';
import { userDAO } from '../daos/user.dao.ts';
import { messagingService } from '../services/messaging.service.ts';
import { generateTasksPdf } from '../services/pdf.service.ts';
import { socketService } from '../services/socket.service.ts';

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
    const newTask = result.getValue();
    socketService.broadcastTaskUpdate(newTask); // reuse task-updated — frontend handles both create and update
    res.status(201).json(newTask);
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
    socketService.broadcastTaskDeleted(id);
    res.status(204).send();
  }

  /**
   * DELETE /api/tasks (Optional ?status= filter)
   */
  async deleteAll(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const statusQuery = req.query['status'];
    const status = typeof statusQuery === 'string' ? statusQuery : undefined;
    
    const result = await taskService.deleteTasksByStatus(authReq.user!.id, status);
    if (result.isFailure) {
      return res.status(500).json({ error: result.error });
    }
    // Notify all clients that a bulk delete happened (affects admin stats)
    socketService.broadcastTaskDeleted('bulk');
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
    const updatedTask = result.getValue();
    // Broadcast to all connected clients so any open TaskBoard updates instantly
    socketService.broadcastTaskUpdate(updatedTask);
    res.json(updatedTask);
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

  /**
   * GET /api/tasks/export/pdf
   */
  async exportPdf(req: Request, res: Response): Promise<void> {
    const authReq = req as Request & { user?: { id: string; email?: string; name?: string } };
    const userId = authReq.user!.id;
    const tasks = await taskDAO.getAll(userId);
    const lang: 'en' | 'es' = req.query['lang'] === 'es' ? 'es' : 'en';
    const generatedBy = authReq.user?.name ?? authReq.user?.email ?? '';
    const pdfBuffer = await generateTasksPdf(tasks, lang, generatedBy);
    const filename = `tasks-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }

  /**
   * POST /api/tasks/:id/assignees/:userId
   * Assigns a user to a task. Only the project OWNER can assign tasks, the task must belong to a project, and the target user must be a member of that project.
   */
  async assignUser(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id: taskId, userId: targetUserId } = req.params;

    if (typeof taskId !== 'string' || typeof targetUserId !== 'string') {
      return res.status(400).json({ error: 'Invalid task or user ID' });
    }

    const task = await taskDAO.getById(taskId, authReq.user!.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }
    if (!task.projectId) {
      return res.status(400).json({ error: 'Tasks can only be assigned to members when they belong to a project' });
    }

    const role = await projectDAO.getMemberRole(task.projectId, authReq.user!.id);
    if (role !== 'OWNER') {
      return res.status(403).json({ error: 'Only the project owner can assign tasks' });
    }

    const members = await projectDAO.getMembers(task.projectId, authReq.user!.id);
    const targetIsMember = members?.some((m) => m.userId === targetUserId) ?? false;
    if (!targetIsMember) {
      return res.status(404).json({ error: 'User is not a member of this project' });
    }

    const assigned = await taskDAO.assignUser(taskId, targetUserId);
    if (!assigned) {
      return res.status(409).json({ error: 'User is already assigned to this task' });
    }

    const updatedTask = await taskDAO.getById(taskId, authReq.user!.id);
    if (updatedTask) {
      socketService.broadcastTaskUpdate(updatedTask);
      // Notify only the newly-assigned user — nobody else needs an email for this.
      const targetUser = await userDAO.getById(targetUserId);
      if (targetUser) {
        await messagingService.sendTaskNotification(
          updatedTask,
          targetUser.email,
          'TASK_ASSIGNED',
          targetUser.lang ?? 'en',
          targetUser.name ?? targetUser.email,
        );
      }
    }
    res.status(200).json({ message: 'User assigned successfully' });
  }

  /**
   * DELETE /api/tasks/:id/assignees/:userId
   * Removes a user's assignment from a task. Only the project OWNER can unassign.
   */
  async unassignUser(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id: taskId, userId: targetUserId } = req.params;

    if (typeof taskId !== 'string' || typeof targetUserId !== 'string') {
      return res.status(400).json({ error: 'Invalid task or user ID' });
    }

    const task = await taskDAO.getById(taskId, authReq.user!.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }
    if (!task.projectId) {
      return res.status(400).json({ error: 'Tasks can only be assigned to members when they belong to a project' });
    }

    const role = await projectDAO.getMemberRole(task.projectId, authReq.user!.id);
    if (role !== 'OWNER') {
      return res.status(403).json({ error: 'Only the project owner can unassign tasks' });
    }

    const removed = await taskDAO.unassignUser(taskId, targetUserId);
    if (!removed) {
      return res.status(404).json({ error: 'User was not assigned to this task' });
    }

    const updatedTask = await taskDAO.getById(taskId, authReq.user!.id);
    if (updatedTask) {
      socketService.broadcastTaskUpdate(updatedTask);
    }
    res.status(200).json({ message: 'User unassigned successfully' });
  }
}

export const taskController = new TaskController();