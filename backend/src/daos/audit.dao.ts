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
};
