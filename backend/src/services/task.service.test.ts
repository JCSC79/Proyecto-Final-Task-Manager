import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TaskService } from './task.service.ts';
import { TaskStatus } from '../models/task.model.ts';
import type { ITask } from '../models/task.model.ts';
import type { taskDAO } from '../daos/task.dao.ts';
import type { messagingService } from './messaging.service.ts';

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
        sendTaskNotification: async (_task: ITask): Promise<void> => {}
    } as unknown as typeof messagingService;

    const service = new TaskService(mockDao, mockMessaging);

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
    test('should call messaging service when a task is created', async () => {
        let notificationSent = false;
        
        const spyMessaging = {
            sendTaskNotification: async (_task: ITask): Promise<void> => { 
                notificationSent = true; 
            }
        } as unknown as typeof messagingService;
        
        const serviceWithSpy = new TaskService(mockDao, spyMessaging);
        await serviceWithSpy.createTask({ title: 'New Task', description: 'A valid description' }, 'owner-1');

        assert.strictEqual(notificationSent, true);
    });
});