import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TaskService } from './task.service.ts';
import { TaskStatus } from '../models/task.model.ts';
import type { ITask } from '../models/task.model.ts';
import type { taskDAO } from '../daos/task.dao.ts';
import type { userDAO } from '../daos/user.dao.ts';
import type { messagingService } from './messaging.service.ts';
import { projectDAO } from '../daos/project.dao.ts';

/**
 * BACKEND UNIT TESTS: TaskService
 * Strictly typed to comply with "Zero Any" policy.
 */
describe('TaskService - Business Logic & Security', () => {

    // 1. TYPED MOCKS SETUP
    const mockDao = {
        getById: async (id: string, userId: string): Promise<ITask | undefined> => {
            if (id === 'valid-task' && userId === 'owner-1') {
                return { 
                    id, 
                    title: 'Test', 
                    description: 'Description', 
                    userId: 'owner-1', 
                    status: TaskStatus.PENDING,
                    createdAt: new Date() 
                };
            }
            return undefined;
        },
        create: async (task: ITask): Promise<ITask> => task,
        delete: async (id: string, userId: string): Promise<boolean> => {
            return id === 'valid-task' && userId === 'owner-1';
        },
        update: async (id: string, userId: string, updates: Partial<ITask>): Promise<ITask | undefined> => {
            if (id === 'valid-task' && userId === 'owner-1') {
                return { 
                    id, 
                    title: 'Updated', 
                    description: 'Desc', 
                    userId, 
                    status: TaskStatus.COMPLETED, 
                    createdAt: new Date(),
                    ...updates 
                };
            }
            return undefined;
        }
    } as unknown as typeof taskDAO;

    const mockMessaging = {
        sendTaskNotification: async (_task: ITask): Promise<void> => {},
        sendAuditEvent: async (): Promise<void> => {}
    } as unknown as typeof messagingService;

    const mockUserDao = {
        getById: async (_id: string) => ({ id: _id, email: 'owner@test.com', lang: 'en' as const, name: 'Owner', role: 'USER', createdAt: new Date() })
    } as unknown as typeof userDAO;

    const service = new TaskService(mockDao, mockMessaging, mockUserDao);

    // 2. VALIDATION TESTS
    test('should validate mandatory fields (Title required)', async () => {
        const result = await service.createTask({ title: '', description: 'Some description' }, 'user-id');

        assert.strictEqual(result.isFailure, true);
        // Empty string triggers both 'required' and 'min(3)' rules simultaneously
        assert.ok(result.error !== null, 'error should not be null');
        assert.match(result.error, /err_title_required/);
    });

    // 3. SECURITY & ISOLATION TESTS
    test('should allow owner to retrieve their own task', async () => {
        const result = await service.getTaskById('valid-task', 'owner-1');
        
        assert.strictEqual(result.isSuccess, true);
        assert.strictEqual(result.getValue().id, 'valid-task');
    });

    test('should block unauthorized users from reading a task', async () => {
        const result = await service.getTaskById('valid-task', 'intruding-user');

        assert.strictEqual(result.isFailure, true);
        assert.strictEqual(result.error, 'Task not found or access denied');
    });

    test('should block unauthorized users from deleting a task', async () => {
        const result = await service.deleteTask('valid-task', 'intruding-user');

        assert.strictEqual(result.isFailure, true);
        assert.strictEqual(result.error, 'Task not found or permission denied');
    });

    test('should block unauthorized users from updating a task', async () => {
        const result = await service.updateTask('valid-task', 'intruding-user', { title: 'Hacked' });

        assert.strictEqual(result.isFailure, true);
        assert.strictEqual(result.error, 'Unauthorized update attempt or task not found');
    });

    // 4. BUSINESS LOGIC TESTS (RabbitMQ Integration)
    test('should NOT send a notification when creating a task with no project (nobody else to notify)', async () => {
        let notificationSent = false;
        
        const spyMessaging = {
            sendTaskNotification: async (_task: ITask): Promise<void> => { 
                notificationSent = true; 
            },
            sendAuditEvent: async (): Promise<void> => {}
        } as unknown as typeof messagingService;
        
        const serviceWithSpy = new TaskService(mockDao, spyMessaging, mockUserDao);
        await serviceWithSpy.createTask({ title: 'New Task', description: 'A valid description' }, 'owner-1');

        assert.strictEqual(notificationSent, false);
    });

    test('should notify other project members but exclude the actor who created the task', async (t) => {
        const notifiedEmails: string[] = [];

        const spyMessaging = {
            sendTaskNotification: async (_task: ITask, email: string): Promise<void> => {
                notifiedEmails.push(email);
            },
            sendAuditEvent: async (): Promise<void> => {}
        } as unknown as typeof messagingService;

        // mockUserDao.getById resolves the actor's email to 'owner@test.com' — include it in the
        // member list to prove it gets filtered out, alongside a genuinely different teammate.
        t.mock.method(projectDAO, 'getMemberRole', async () => 'OWNER' as const);
        t.mock.method(projectDAO, 'getMembersForNotification', async () => [
            { email: 'owner@test.com', name: 'Owner', lang: 'en' as const },
            { email: 'teammate@test.com', name: 'Teammate', lang: 'en' as const },
        ]);

        const serviceWithSpy = new TaskService(mockDao, spyMessaging, mockUserDao);
        await serviceWithSpy.createTask({
            title: 'New Task',
            description: 'A valid description',
            projectId: '11111111-1111-1111-1111-111111111111',
        }, 'owner-1');

        assert.deepStrictEqual(notifiedEmails, ['teammate@test.com']);
    });

    test('should notify other project members (excluding the actor) when a task is content-edited', async (t) => {
        const notifiedEmails: string[] = [];

        const spyMessaging = {
            sendTaskNotification: async (_task: ITask, email: string): Promise<void> => {
                notifiedEmails.push(email);
            },
            sendAuditEvent: async (): Promise<void> => {}
        } as unknown as typeof messagingService;

        t.mock.method(projectDAO, 'getMembersForNotification', async () => [
            { email: 'owner@test.com', name: 'Owner', lang: 'en' as const },
            { email: 'teammate@test.com', name: 'Teammate', lang: 'en' as const },
        ]);

        const serviceWithSpy = new TaskService(mockDao, spyMessaging, mockUserDao);
        await serviceWithSpy.updateTask('valid-task', 'owner-1', {
            title: 'Edited Title',
            description: 'Edited description text',
            projectId: '11111111-1111-1111-1111-111111111111',
        });

        assert.deepStrictEqual(notifiedEmails, ['teammate@test.com']);
    });
});