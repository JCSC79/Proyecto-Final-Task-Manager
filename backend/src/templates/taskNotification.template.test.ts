import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildMemberEmailHtml, buildTaskEmailHtml } from './taskNotification.template.ts';
import type { ProjectNotificationPayload, TaskNotificationPayload } from '../models/notification.model.ts';
import type { ITask } from '../models/task.model.ts';

const baseTask: ITask = {
    id: 't1',
    title: 'Write the report',
    description: 'Quarterly report for the board',
    status: 'PENDING',
    userId: 'u1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

/**
 * BACKEND UNIT TESTS: taskNotification.template
 * Regression coverage for the MEMBER_ADDED vs JOINED email body wording bug:
 * the greeting must always address the real recipient (recipientName), and the
 * intro line must reflect the actual event (added by owner vs. joined on their own).
 */
describe('buildMemberEmailHtml', () => {

    test('ADDED event: greets the new member and says they were added', () => {
        const payload: ProjectNotificationPayload = {
            type: 'PROJECT',
            eventType: 'ADDED',
            projectId: 'p1',
            projectName: 'Alpha',
            recipientEmail: 'member@test.com',
            recipientName: 'Member Name',
            lang: 'es',
        };
        const html = buildMemberEmailHtml(payload);

        assert.ok(html.includes('Member Name'));
        assert.ok(html.includes('Has sido añadido como miembro del proyecto "Alpha"'));
        assert.ok(!html.includes('se ha unido a tu proyecto'));
    });

    test('JOINED event: greets the owner (recipientName) and names the joiner (actorName) in the intro', () => {
        const payload: ProjectNotificationPayload = {
            type: 'PROJECT',
            eventType: 'JOINED',
            projectId: 'p1',
            projectName: 'Alpha',
            recipientEmail: 'owner@test.com',
            recipientName: 'Owner Name',
            actorName: 'New Joiner',
            lang: 'es',
        };
        const html = buildMemberEmailHtml(payload);

        // Greeting must use the owner's own name, not the joiner's
        assert.ok(html.includes('Owner Name'));
        assert.ok(!html.includes('>New Joiner<'));
        // Intro line must mention who joined, not the generic "added" wording
        assert.ok(html.includes('New Joiner se ha unido a tu proyecto "Alpha"'));
        assert.ok(!html.includes('Has sido añadido como miembro'));
    });

    test('JOINED event without actorName falls back to a generic placeholder', () => {
        const payload: ProjectNotificationPayload = {
            type: 'PROJECT',
            eventType: 'JOINED',
            projectId: 'p1',
            projectName: 'Alpha',
            recipientEmail: 'owner@test.com',
            recipientName: 'Owner Name',
            lang: 'en',
        };
        const html = buildMemberEmailHtml(payload);

        assert.ok(html.includes('Someone joined your project "Alpha"'));
    });
});

describe('buildTaskEmailHtml', () => {

    test('TASK_CREATED, TASK_COMPLETED and TASK_UPDATED all render a non-empty intro line (regression: intro key derivation used to silently mismatch and leave the intro blank)', () => {
        const eventTypes: TaskNotificationPayload['eventType'][] = ['TASK_CREATED', 'TASK_COMPLETED', 'TASK_UPDATED'];
        for (const eventType of eventTypes) {
            const payload: TaskNotificationPayload = {
                task: baseTask,
                recipientEmail: 'member@test.com',
                recipientName: 'Member Name',
                eventType,
                lang: 'en',
            };
            const html = buildTaskEmailHtml(payload);
            assert.ok(html.includes(baseTask.title));
            assert.ok(!html.includes('undefined'));
        }
    });

    test('TASK_ASSIGNED renders the assignment intro line for the recipient', () => {
        const payload: TaskNotificationPayload = {
            task: baseTask,
            recipientEmail: 'assignee@test.com',
            recipientName: 'Assignee Name',
            eventType: 'TASK_ASSIGNED',
            lang: 'en',
        };
        const html = buildTaskEmailHtml(payload);

        assert.ok(html.includes('Assignee Name'));
        assert.ok(html.includes('You have been assigned to the following task'));
        assert.ok(html.includes(baseTask.title));
    });

    test('TASK_ASSIGNED in Spanish renders the localized assignment intro line', () => {
        const payload: TaskNotificationPayload = {
            task: baseTask,
            recipientEmail: 'assignee@test.com',
            recipientName: 'Nombre Asignado',
            eventType: 'TASK_ASSIGNED',
            lang: 'es',
        };
        const html = buildTaskEmailHtml(payload);

        assert.ok(html.includes('Se te ha asignado la siguiente tarea'));
    });
});
