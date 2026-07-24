import { TaskStatus } from '../models/task.model.ts';
import type { ITask } from '../models/task.model.ts'; 
import { taskDAO } from '../daos/task.dao.ts';
import { tagDAO } from '../daos/tag.dao.ts';
import { userDAO } from '../daos/user.dao.ts';
import { projectDAO } from '../daos/project.dao.ts';
import { messagingService } from './messaging.service.ts';
import { Result } from '../utils/result.ts';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema.ts';
import crypto from 'node:crypto';

/**
 * TaskService - Orchestrates business logic with strict user isolation.
 */
export class TaskService {
    private readonly dao: typeof taskDAO;
    private readonly messaging: typeof messagingService;
    private readonly userDao: typeof userDAO;
    
    constructor(
        dao: typeof taskDAO = taskDAO,
        messaging: typeof messagingService = messagingService,
        userDao: typeof userDAO = userDAO
    ) {
        this.dao = dao;
        this.messaging = messaging;
        this.userDao = userDao;
    }

    async getAllTasks(user: { id: string, role: string }): Promise<Result<ITask[]>> {
        const tasks = await this.dao.getAll(user.id);
        return Result.ok(tasks);
    }

    async getTaskById(id: string, userId: string): Promise<Result<ITask>> {
        const task = await this.dao.getById(id, userId);
        if (!task) {
            return Result.fail<ITask>("Task not found or access denied");
        }
        return Result.ok(task);
    }

    /**
     * Creates a task and optionally assigns tags to it in one operation.
     */
    async createTask(data: unknown, userId: string): Promise<Result<ITask>> {
        try {
            const validated = await createTaskSchema.validate(data, { abortEarly: false });
            
            const projectId = (data as { projectId?: string }).projectId;
            const categoryId = (data as { categoryId?: string }).categoryId;
            const tagIds = (data as { tagIds?: string[] }).tagIds;
            const priority = validated.priority ?? undefined;
            const dueDate = validated.dueDate ?? undefined;

            // Guard: if a projectId is supplied, the user must be a member of that project
            if (projectId) {
                const role = await projectDAO.getMemberRole(projectId, userId);
                if (role === null) {
                    return Result.fail<ITask>('notProjectMember');
                }
            }

            const newTask: ITask = {
                id: crypto.randomUUID(),
                title: validated.title,
                description: validated.description,
                status: TaskStatus.PENDING,
                userId,
                ...(projectId ? { projectId } : {}),
                ...(categoryId ? { categoryId } : {}),
                ...(priority ? { priority } : {}),
                ...(dueDate ? { dueDate } : {}),
                createdAt: new Date()
            };

            const createdTask = await this.dao.create(newTask);

            // Assign tags after the task exists (FK constraint requires task to exist first)
            if (tagIds && tagIds.length > 0) {
                for (const tagId of tagIds) {
                    await tagDAO.assignToTask(createdTask.id, tagId);
                }
                createdTask.tags = await tagDAO.getByTask(createdTask.id);
            }

            const { email, lang, name } = await getUserInfo(userId, this.userDao);
            await notifyProjectOrOwner(this.messaging, createdTask, 'TASK_CREATED', { email, lang, name });
            await this.messaging.sendAuditEvent({
                taskId: createdTask.id,
                userId,
                action: 'TASK_CREATED',
                oldValue: null,
                newValue: createdTask as unknown as Record<string, unknown>,
            });
            return Result.ok(createdTask);
        } catch (err: unknown) {
            const error = err as { errors?: string[]; message: string };
            return Result.fail<ITask>(error.errors?.join(', ') || error.message);
        }
    }

    async deleteTask(id: string, userId: string): Promise<Result<void>> {
        const existing = await this.dao.getById(id, userId);
        const success = await this.dao.delete(id, userId);
        if (!success) {
            return Result.fail<void>("Task not found or permission denied");
        }
        if (existing) {
            await this.messaging.sendAuditEvent({
                taskId: id,
                userId,
                action: 'TASK_DELETED',
                oldValue: existing as unknown as Record<string, unknown>,
                newValue: null,
            });
        }
        return Result.ok(undefined);
    }

    async deleteTasksByStatus(userId: string, status?: string): Promise<Result<void>> {
        if (status) {
            await this.dao.deleteByStatus(userId, status);
        } else {
            await this.dao.deleteAll(userId);
        }
        return Result.ok(undefined);
    }

    async updateTask(id: string, userId: string, data: unknown): Promise<Result<ITask>> {
        try {
            const validated = await updateTaskSchema.validate(data, { 
                stripUnknown: true, 
                abortEarly: false 
            });

            // Status-only payloads use the broader updateStatus path so that any project member can move a task along the board.
            // Content edits (title, description, categoryId) remain owner-only.
            const keys = Object.keys(validated);
            const isStatusOnly = keys.length === 1 && keys[0] === 'status';

            if (isStatusOnly) {
                const updatedTask = await this.dao.updateStatus(id, userId, validated.status as TaskStatus);
                if (!updatedTask) {
                    return Result.fail<ITask>('Task not found or you are not a member of this project');
                }
                // Fire email notification only when task reaches COMPLETED
                if (validated.status === TaskStatus.COMPLETED) {
                    const { email, lang, name } = await getUserInfo(userId, this.userDao);
                    await notifyProjectOrOwner(this.messaging, updatedTask, 'TASK_COMPLETED', { email, lang, name });
                }
                await this.messaging.sendAuditEvent({
                    taskId: id,
                    userId,
                    action: validated.status === TaskStatus.COMPLETED ? 'TASK_COMPLETED' : 'TASK_UPDATED',
                    oldValue: null,
                    newValue: { status: validated.status },
                });
                return Result.ok(updatedTask);
            }
            
            const updates: Partial<ITask> = { 
                ...(validated as Partial<ITask>), 
                updatedAt: new Date() 
            };
            
            const updatedTask = await this.dao.update(id, userId, updates);

            if (!updatedTask) {
                return Result.fail<ITask>("Unauthorized update attempt or task not found");
            }
            const { email, lang, name } = await getUserInfo(userId, this.userDao);
            await notifyProjectOrOwner(this.messaging, updatedTask, 'TASK_UPDATED', { email, lang, name });
            await this.messaging.sendAuditEvent({
                taskId: id,
                userId,
                action: 'TASK_UPDATED',
                oldValue: null,
                newValue: updates,
            });
            return Result.ok(updatedTask);
        } catch (err: unknown) {
            const error = err as { errors?: string[]; message: string };
            return Result.fail<ITask>(error.errors?.join(', ') || error.message);
        }
    }
}

export const taskService = new TaskService();

/** Resolves the email, preferred lang and display name for a userId. */
async function getUserInfo(userId: string, dao: typeof userDAO): Promise<{ email: string; lang: 'en' | 'es'; name: string }> {
    const user = await dao.getById(userId);
    return {
        email: user?.email ?? 'unknown@taskmanager.dev',
        lang:  user?.lang ?? 'en',
        name:  user?.name ?? user?.email ?? 'there',
    };
}

/**
 * If the task belongs to a project, emails every OTHER project member (the actor who triggered the event is always excluded — no one needs an email about their own action).
 * If the task has no project, there is nobody else to notify, so nothing is sent.
 */
async function notifyProjectOrOwner(
    messaging: typeof messagingService,
    task: ITask,
    eventType: 'TASK_CREATED' | 'TASK_COMPLETED' | 'TASK_UPDATED',
    actor: { email: string; lang: 'en' | 'es'; name: string },
): Promise<void> {
    if (!task.projectId) {
        return;
    }
    const members = await projectDAO.getMembersForNotification(task.projectId);
    const recipients = members.filter(m => m.email !== actor.email);
    for (const m of recipients) {
        await messaging.sendTaskNotification(task, m.email, eventType, m.lang, m.name);
    }
}