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

    // Regression coverage: a project MEMBER (non-owner) must never see "your project" wording,
    // since the project actually belongs to its OWNER. The owner keeps the original "your project"
    // phrasing, while other members get "the project you belong to" plus the project name.
    test('TASK_CREATED: OWNER recipient sees "your project" wording', () => {
        const payload: TaskNotificationPayload = {
            task: baseTask,
            recipientEmail: 'owner@test.com',
            recipientName: 'Owner Name',
            eventType: 'TASK_CREATED',
            lang: 'en',
            isOwner: true,
            projectName: 'Demo Project',
        };
        const html = buildTaskEmailHtml(payload);

        assert.ok(html.includes('A new task has been assigned to your project'));
        assert.ok(!html.includes('the project you belong to'));
    });

    test('TASK_CREATED: non-owner MEMBER recipient sees "the project you belong to" wording with the project name', () => {
        const payload: TaskNotificationPayload = {
            task: baseTask,
            recipientEmail: 'member@test.com',
            recipientName: 'Member Name',
            eventType: 'TASK_CREATED',
            lang: 'en',
            isOwner: false,
            projectName: 'Demo Project',
        };
        const html = buildTaskEmailHtml(payload);

        assert.ok(html.includes('A new task has been created in the project you belong to, "Demo Project"'));
        assert.ok(!html.includes('your project'));
    });

    test('TASK_COMPLETED and TASK_UPDATED: non-owner MEMBER recipient sees the member-facing wording in Spanish', () => {
        const completedPayload: TaskNotificationPayload = {
            task: baseTask,
            recipientEmail: 'member@test.com',
            recipientName: 'Miembro',
            eventType: 'TASK_COMPLETED',
            lang: 'es',
            isOwner: false,
            projectName: 'Proyecto Demo',
        };
        const completedHtml = buildTaskEmailHtml(completedPayload);
        assert.ok(completedHtml.includes('Se ha completado una tarea en el proyecto al cual perteneces, "Proyecto Demo"'));

        const updatedPayload: TaskNotificationPayload = {
            ...completedPayload,
            eventType: 'TASK_UPDATED',
        };
        const updatedHtml = buildTaskEmailHtml(updatedPayload);
        assert.ok(updatedHtml.includes('Se ha actualizado una tarea en el proyecto al cual perteneces, "Proyecto Demo"'));
    });

    test('TASK_CREATED: missing projectName falls back to the owner-facing wording even for a non-owner (never crashes / never shows a broken sentence)', () => {
        const payload: TaskNotificationPayload = {
            task: baseTask,
            recipientEmail: 'member@test.com',
            recipientName: 'Member Name',
            eventType: 'TASK_CREATED',
            lang: 'en',
            isOwner: false,
        };
        const html = buildTaskEmailHtml(payload);

        assert.ok(html.includes('A new task has been assigned to your project'));
        assert.ok(!html.includes('undefined'));
    });
});
