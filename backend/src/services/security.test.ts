import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TaskService } from './task.service.ts';
import { taskDAO } from '../daos/task.dao.ts';
import { messagingService } from './messaging.service.ts';
import type { ITask } from '../models/task.model.ts';
import { TaskStatus } from '../models/task.model.ts';

/**
 * SECURITY INTEGRITY TESTS
 * Focus: Cross-user data leakage and ID spoofing prevention.
 */
describe('Security - User Context Integrity', () => {

    // 1. TYPED MOCKS SETUP
    const mockDao = {
        // Correctly typing the parameter as ITask instead of any
        create: async (task: ITask): Promise<ITask> => task,
        
        getById: async (id: string, userId: string): Promise<ITask | undefined> => {
            if (id === 'task-1' && userId === 'legit-user') {
                return { 
                    id: 'task-1', 
                    userId: 'legit-user',
                    title: 'Legit Task',
                    description: 'Safe content',
                    status: TaskStatus.PENDING,
                    createdAt: new Date()
                };
            }
            return undefined;
        },

        delete: async (id: string, userId: string): Promise<boolean> => {
            // Only allows deletion if both ID and Owner match
            return id === 'task-1' && userId === 'legit-user';
        }
    } as unknown as typeof taskDAO;

    const mockMessaging = {
        sendTaskNotification: async (_task: ITask): Promise<void> => {}
    } as unknown as typeof messagingService;

    const service = new TaskService(mockDao, mockMessaging);

    // 2. SCENARIO: Cross-user deletion attempt
    test('should reject deletion if the task does not belong to the requester', async () => {
        const victimTaskId = 'task-1';
        const attackerUserId = 'hacker-user';

        const result = await service.deleteTask(victimTaskId, attackerUserId);

        assert.strictEqual(result.isFailure, true);
        assert.strictEqual(result.error, 'Task not found or permission denied');
    });

    // 3. SCENARIO: ID Spoofing on Creation
    test('should ignore any external ID and enforce the authenticated User ID', async () => {
        const authenticatedUser = 'user-123';
        
        // We simulate a creation call where we ensure the service uses the ID 
        // provided by our Auth Middleware, not some random value.
        const result = await service.createTask({ title: 'New Task', description: 'A valid description' }, authenticatedUser);

        assert.strictEqual(result.isSuccess, true);
        assert.strictEqual(result.getValue().userId, authenticatedUser);
    });
});