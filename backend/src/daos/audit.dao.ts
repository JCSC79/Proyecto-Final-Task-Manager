import knex from 'knex';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import type { IAuditLog, IAuditLogEvent } from '../models/audit.model.ts';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');
const db = knex(config.development);

export const auditDAO = {
    async insert(event: IAuditLogEvent): Promise<void> {
        await db('audit_logs').insert({
            id: crypto.randomUUID(),
            taskId: event.taskId,
            userId: event.userId,
            action: event.action,
            oldValue: event.oldValue ? JSON.stringify(event.oldValue) : null,
            newValue: event.newValue ? JSON.stringify(event.newValue) : null,
            createdAt: new Date(),
        });
    },

    async getByTaskId(taskId: string): Promise<IAuditLog[]> {
        const rows = await db('audit_logs')
            .where({ taskId })
            .orderBy('createdAt', 'asc')
            .select('*');

        return rows.map((row) => ({
            id: row.id as string,
            taskId: row.taskId as string,
            userId: row.userId as string,
            action: row.action as IAuditLog['action'],
            oldValue: row.oldValue as Record<string, unknown> | null,
            newValue: row.newValue as Record<string, unknown> | null,
            createdAt: row.createdAt as Date,
        }));
    },

    /**
     * Calculates average resolution time (Lead Time) per category.
     * Lead Time = days from task.createdAt to the first TASK_COMPLETED audit event.
     * Optionally filtered by a start date (since).
     */
    async getLeadTimesByCategory(since?: Date): Promise<{ category: string; avgDays: number; resolved: number }[]> {
        const query = db('tasks as t')
            .join(
                db('audit_logs')
                    .where({ action: 'TASK_COMPLETED' })
                    .select('taskId')
                    .min('createdAt as completedAt')
                    .groupBy('taskId')
                    .as('al'),
                'al.taskId', 't.id'
            )
            .leftJoin('categories as c', 'c.id', 't.categoryId')
            .select(
                db.raw("COALESCE(c.name, 'No category') as category"),
                db.raw('AVG(EXTRACT(EPOCH FROM (al."completedAt"::timestamptz - t."createdAt"::timestamptz)) / 86400) as "avgDays"'),
                db.raw('COUNT(*) as resolved'),
            )
            .groupBy('c.name')
            .orderBy('avgDays', 'desc');

        if (since) {
            void query.where('al.completedAt', '>=', since);
        }

        const rows = await query as { category: string; avgDays: string; resolved: string }[];
        return rows.map(r => ({
            category: r.category,
            avgDays: Math.round(Number(r.avgDays) * 10) / 10,
            resolved: Number(r.resolved),
        }));
    },

    /**
     * Returns active task count per user (PENDING + IN_PROGRESS).
     * Used for the Resource Management section.
     */
    async getWorkloadByUser(): Promise<{ userId: string; name: string | null; email: string; activeTasks: number }[]> {
        const rows = await db('tasks as t')
            .join('users as u', 'u.id', 't.userId')
            .whereIn('t.status', ['PENDING', 'IN_PROGRESS'])
            .select('t.userId', 'u.name', 'u.email')
            .count('t.id as activeTasks')
            .groupBy('t.userId', 'u.name', 'u.email')
            .orderBy('activeTasks', 'desc') as { userId: string; name: string | null; email: string; activeTasks: string }[];

        return rows.map(r => ({
            userId: r.userId,
            name: r.name,
            email: r.email,
            activeTasks: Number(r.activeTasks),
        }));
    },
};
