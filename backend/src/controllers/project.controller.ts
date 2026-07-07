import type { Request, Response } from 'express';
import { projectDAO } from '../daos/project.dao.ts';
import { userDAO } from '../daos/user.dao.ts';
import type { IProject } from '../models/project.model.ts';
import crypto from 'node:crypto';
import { messagingService } from '../services/messaging.service.ts';
import { socketService } from '../services/socket.service.ts';

interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string; };
}

/**
 * ProjectController - HTTP handlers for project management.
 *
 * Visibility model: projects belong to the organisation, not to a single user.
 * Any authenticated user can see all projects and join any public one.
 * Only the OWNER can delete a project.
 */
class ProjectController {
  /**
   * GET /api/projects
   * Returns all projects visible to the authenticated user, enriched with
   * settings and the user's membership role (null = not a member).
   */
  async getAll(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthRequest;
    const projects = await projectDAO.getAll(authReq.user!.id);
    res.json(projects);
  }

  /**
   * POST /api/projects
   * Creates a new project. The creator is automatically added as OWNER.
   * Accepts optional body fields: color (hex string), description, isPublic.
   */
  async create(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { name, color, description, isPublic } = req.body as {
      name?: string;
      color?: string;
      description?: string;
      isPublic?: boolean;
    };

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Project name must be at least 2 characters' });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Project name cannot exceed 50 characters' });
    }

    if (color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return res.status(400).json({ error: 'Color must be a valid 6-digit hex value (e.g. #4c90f0)' });
    }

    const project: IProject = {
      id: crypto.randomUUID(),
      name: name.trim(),
      userId: authReq.user!.id,
      createdAt: new Date(),
    };

    const created = await projectDAO.create(project, {
      color: color ?? '#4c90f0',
      description: description ?? null,
      isPublic: isPublic ?? true,
    });

    socketService.broadcastProjectEvent('project-created', created);
    res.status(201).json(created);
  }

  /**
   * GET /api/projects/:id/summary
   * Returns the task count and member count for a project.
   * Only the OWNER can call this endpoint (used by the delete confirmation dialog).
   */
  async getSummary(req: Request, res: Response): Promise<Response | void> {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    const summary = await projectDAO.getSummary(id);
    res.json(summary);
  }

  /**
   * DELETE /api/projects/:id
   * Permanently deletes a project and all its tasks, tags, and memberships
   * (via DB CASCADE). Only the OWNER can perform this action.
   * Before deleting, notifies all members via RabbitMQ -> email.
   */
  async delete(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Fetch project name, members and task count BEFORE the CASCADE delete removes them
    const allProjects = await projectDAO.getAll(authReq.user!.id);
    const project = allProjects.find(p => p.id === id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found or you are not the owner' });
    }

    const [members, summary] = await Promise.all([
      projectDAO.getMembersForNotification(id),
      projectDAO.getSummary(id),
    ]);

    const success = await projectDAO.delete(id, authReq.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Project not found or you are not the owner' });
    }

    // Notify all members asynchronously via RabbitMQ
    if (members.length > 0) {
      void messagingService.sendProjectDeletedNotification(project.name, summary.taskCount, members);
    }

    socketService.broadcastProjectEvent('project-deleted', { id });
    res.status(204).send();
  }

  /**
   * POST /api/projects/:id/join
   * Adds the authenticated user as a MEMBER of the project.
   * Returns 403 if the project is private (must be invited by the owner).
   * Returns 409 if the user is already a member.
   */
  async join(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const result = await projectDAO.join(id, authReq.user!.id);
    if (result === 'private') {
      return res.status(403).json({ error: 'This project is private. Ask the owner to invite you.' });
    }

    if (result === 'already_member') {
      return res.status(409).json({ error: 'You are already a member of this project' });
    }

    // Notify the project OWNER that a new member has joined
    void (async () => {
      try {
        const [projectName, joiner, ownerInfo] = await Promise.all([
          projectDAO.getNameById(id),
          userDAO.getById(authReq.user!.id),
          projectDAO.getOwner(id),
        ]);
        if (ownerInfo && projectName) {
          await messagingService.sendMemberNotification(
            id,
            projectName,
            ownerInfo.email,
            ownerInfo.lang ?? 'en',
            joiner?.name ?? joiner?.email ?? 'Someone',
            'JOINED',
          );
        }
      } catch { /* non-critical — do not fail the request */ }
    })();

    res.status(200).json({ message: 'Joined project successfully' });
    socketService.broadcastProjectEvent('project-members-changed', { id });
  }

  /**
   * DELETE /api/projects/:id/leave
   * Removes the authenticated user from the project.
   * OWNERs cannot leave — they must delete the project instead.
   */
  async leave(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const result = await projectDAO.leave(id, authReq.user!.id);

    if (result === 'not_member') {
      return res.status(404).json({ error: 'You are not a member of this project' });
    }

    if (result === 'owner_cannot_leave') {
      return res.status(403).json({ error: 'Project owner cannot leave. Delete the project instead.' });
    }

    res.status(200).json({ message: 'Left project successfully' });
    socketService.broadcastProjectEvent('project-members-changed', { id });
  }

  /**
   * GET /api/projects/:id/members
   * Returns all members of a project with their roles and join dates.
   * Requires the project to be public OR the requester to be a member.
   */
  async getMembers(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const members = await projectDAO.getMembers(id, authReq.user!.id);
    if (members === null) {
      return res.status(403).json({ error: 'Project not found or access denied' });
    }
    res.json(members);
  }

  /**
   * PATCH /api/projects/:id/settings
   * Updates project settings (isPublic, color, description). Only the OWNER can do this.
   */
  async updateSettings(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const { isPublic, color, description } = req.body as {
      isPublic?: boolean;
      color?: string;
      description?: string | null;
    };

    if (color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return res.status(400).json({ error: 'Color must be a valid 6-digit hex value (e.g. #4c90f0)' });
    }

    const updates: { isPublic?: boolean; color?: string; description?: string | null } = {};
    if (isPublic !== undefined) {
      updates.isPublic = isPublic;
    }

    if (color !== undefined) {
      updates.color = color;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid settings fields provided' });
    }

    const success = await projectDAO.updateSettings(id, authReq.user!.id, updates);
    if (!success) {
      return res.status(403).json({ error: 'Project not found or you are not the owner' });
    }
    res.status(200).json({ message: 'Settings updated' });
  }

  /**
   * POST /api/projects/:id/members
   * Owner invites a user to the project by email.
   */
  async addMember(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id } = req.params;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const { email } = req.body as { email?: string };

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await projectDAO.addMember(id, email.toLowerCase().trim(), authReq.user!.id);
    switch (result) {
      case 'added': {
        // Fire-and-forget notification to the new member
        void (async () => {
          try {
            const [projectName, member] = await Promise.all([
              projectDAO.getNameById(id),
              userDAO.getByEmail(email.toLowerCase().trim()),
            ]);
            if (projectName && member) {
              await messagingService.sendMemberNotification(
                id,
                projectName,
                member.email,
                member.lang ?? 'en',
                member.name ?? undefined,
              );
            }
          } catch (notifyErr) {
            console.error('[-] Failed to queue member notification:', notifyErr);
          }
        })();
        socketService.broadcastProjectEvent('project-members-changed', { id });
        return res.status(200).json({ message: 'Member added successfully' });
      }
      case 'not_owner': return res.status(403).json({ error: 'Only the project owner can add members' });
      case 'user_not_found': return res.status(404).json({ error: 'No user found with that email' });
      case 'already_member': return res.status(409).json({ error: 'User is already a member of this project' });
    }
  }

  /**
   * DELETE /api/projects/:id/members/:userId
   * Owner removes a member from the project.
   */
  async removeMember(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id, userId: targetUserId } = req.params;

    if (typeof id !== 'string' || typeof targetUserId !== 'string') {
      return res.status(400).json({ error: 'Invalid project or user ID' });
    }

    const result = await projectDAO.removeMember(id, targetUserId, authReq.user!.id);
    switch (result) {
      case 'removed':
        socketService.broadcastProjectEvent('project-members-changed', { id });
        return res.status(200).json({ message: 'Member removed successfully' });
      case 'not_owner': return res.status(403).json({ error: 'Only the project owner can remove members' });
      case 'not_member': return res.status(404).json({ error: 'User is not a member of this project' });
      case 'cannot_remove_owner': return res.status(400).json({ error: 'The project owner cannot be removed' });
    }
  }

  /**
   * PATCH /api/projects/:id
   * Renames a project. Only the OWNER can rename.
   */
  async rename(req: Request, res: Response): Promise<Response | void> {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const { name } = req.body as { name?: string };

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Project name must be at least 2 characters' });
    }
    
    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Project name cannot exceed 50 characters' });
    }

    const updated = await projectDAO.rename(id, name.trim(), authReq.user!.id);
    if (!updated) {
      return res.status(403).json({ error: 'Project not found or you are not the owner' });
    }
    res.json(updated);
  }
}

export const projectController = new ProjectController();