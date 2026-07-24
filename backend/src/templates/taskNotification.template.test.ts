import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildMemberEmailHtml } from './taskNotification.template.ts';
import type { ProjectNotificationPayload } from '../models/notification.model.ts';

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
