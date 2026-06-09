import type { Request, Response } from 'express';
import { tagDAO } from '../daos/tag.dao.ts';
import { projectDAO } from '../daos/project.dao.ts';
import { taskDAO } from '../daos/task.dao.ts';
import type { ITag } from '../models/tag.model.ts';
import crypto from 'node:crypto';

interface AuthRequest extends Request {
    user?: { id: string; role: string; email: string };
}

// Validates a 7-char hex color string.
const isValidHex = (color: string): boolean => /^#[0-9a-fA-F]{6}$/.test(color);

/*
 * TagController — HTTP handlers for project-scoped tags and task tag assignments.
 *
 * All write operations verify membership before acting:
 *   - Create tag: user must be OWNER or MEMBER of the project
 *   - Delete tag: user must be OWNER of the project
 *   - Assign tag: user must own the task AND be a project member
 *   - Unassign: same as assign
 */
class TagController {
    /*
     * GET /api/projects/:id/tags
     * Returns all tags for the project with per-tag task usage counts.
     */
    async getAllByProject(req: Request, res: Response): Promise<void | Response> {
        const { id: projectId } = req.params;
        if (typeof projectId !== 'string') {
            return res.status(400).json({ error: 'Invalid project ID' });
        }
        const tags = await tagDAO.getAllByProject(projectId);
        res.json(tags);
    }

    /*
     * POST /api/projects/:id/tags
     * Creates a new tag in the project.
     * Requires the requesting user to be a member (OWNER or MEMBER).
     */
    async create(req: Request, res: Response): Promise<Response | void> {
        const authReq = req as AuthRequest;
        const { id: projectId } = req.params;

        if (typeof projectId !== 'string') {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        const { name, color } = req.body as { name?: string; color?: string };

        if (!name || name.trim().length < 1) {
            return res.status(400).json({ error: 'Tag name is required' });
        }

        if (name.trim().length > 30) {
            return res.status(400).json({ error: 'Tag name cannot exceed 30 characters' });
        }

        if (color !== undefined && !isValidHex(color)) {
            return res.status(400).json({ error: 'Color must be a valid 6-digit hex value (e.g. #e03131)' });
        }

        // Verify the user is a member of this project
        const members = await projectDAO.getMembers(projectId, authReq.user!.id);
        const isMember = members?.some((m) => m.userId === authReq.user!.id) ?? false;

        if (!isMember) {
            return res.status(403).json({ error: 'You must be a project member to create tags' });
        }

        const tag: ITag = {
            id: crypto.randomUUID(),
            name: name.trim(),
            color: color ?? '#4c90f0',
            projectId,
            createdAt: new Date(),
        };

        const created = await tagDAO.create(tag);
        res.status(201).json(created);
    }

    /*
     * DELETE /api/projects/:id/tags/:tagId
     * Deletes a tag from the project (OWNER only).
     * All task_tags rows referencing this tag are removed automatically via CASCADE.
     */
    async delete(req: Request, res: Response): Promise<Response | void> {
        const authReq = req as AuthRequest;
        const { id: projectId, tagId } = req.params;

        if (typeof projectId !== 'string' || typeof tagId !== 'string') {
            return res.status(400).json({ error: 'Invalid project or tag ID' });
        }

        // Only the project OWNER can delete tags
        const members = await projectDAO.getMembers(projectId, authReq.user!.id);
        const member = members?.find((m) => m.userId === authReq.user!.id);

        if (member?.role !== 'OWNER') {
            return res.status(403).json({ error: 'Only the project owner can delete tags' });
        }

        const deleted = await tagDAO.delete(tagId, projectId);

        if (!deleted) {
            return res.status(404).json({ error: 'Tag not found in this project' });
        }
        res.status(204).send();
    }

    /*
     * POST /api/tasks/:id/tags/:tagId
     * Assigns a tag to a task.
     * Requirements:
     *   - The requesting user must own the task
     *   - The tag must belong to the same project as the task
     */
    async assignToTask(req: Request, res: Response): Promise<Response | void> {
        const authReq = req as AuthRequest;
        const { id: taskId, tagId } = req.params;

        if (typeof taskId !== 'string' || typeof tagId !== 'string') {
            return res.status(400).json({ error: 'Invalid task or tag ID' });
        }

        // Verify task ownership
        const task = await taskDAO.getById(taskId, authReq.user!.id);

        if (!task) {
            return res.status(404).json({ error: 'Task not found or access denied' });
        }

        // A tag can only be assigned to a task that belongs to the same project
        if (!task.projectId) {
            return res.status(400).json({ error: 'Tags can only be assigned to tasks that belong to a project' });
        }

        const tag = await tagDAO.getById(tagId, task.projectId);

        if (!tag) {
            return res.status(404).json({ error: 'Tag not found in the task\'s project' });
        }

        const assigned = await tagDAO.assignToTask(taskId, tagId);

        if (!assigned) {
            return res.status(409).json({ error: 'Tag is already assigned to this task' });
        }
        res.status(200).json({ message: 'Tag assigned successfully' });
    }

    /*
     * DELETE /api/tasks/:id/tags/:tagId
     * Removes a tag assignment from a task.
     * The requesting user must own the task.
     */
    async unassignFromTask(req: Request, res: Response): Promise<Response | void> {
        const authReq = req as AuthRequest;
        const { id: taskId, tagId } = req.params;

        if (typeof taskId !== 'string' || typeof tagId !== 'string') {
            return res.status(400).json({ error: 'Invalid task or tag ID' });
        }
        
        // Verify task ownership
        const task = await taskDAO.getById(taskId, authReq.user!.id);

        if (!task) {
            return res.status(404).json({ error: 'Task not found or access denied' });
        }

        const removed = await tagDAO.unassignFromTask(taskId, tagId);

        if (!removed) {
            return res.status(404).json({ error: 'Tag is not assigned to this task' });
        }
        res.status(200).json({ message: 'Tag removed successfully' });
    }
}

export const tagController = new TagController();
