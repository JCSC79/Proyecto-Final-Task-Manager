import { test } from 'node:test';
import assert from 'node:assert';
import { TaskService } from './task.service.ts';
import { taskDAO } from '../daos/task.dao.ts';
import { messagingService } from './messaging.service.ts';

test('TaskService should validate mandatory fields', async () => {
    // Correctly typing the mocks with 'typeof'
    const mockDao = {} as typeof taskDAO;
    const mockMessaging = {} as typeof messagingService;
    
    const service = new TaskService(mockDao, mockMessaging);

    const result = await service.createTask('', 'No title provided', 'mock-user-id');

    assert.strictEqual(result.isFailure, true);
    assert.strictEqual(result.error, 'Title is required');
});