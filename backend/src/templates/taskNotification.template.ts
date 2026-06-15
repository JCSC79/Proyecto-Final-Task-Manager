import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TaskNotificationPayload } from '../models/notification.model.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_TEMPLATE = readFileSync(join(__dirname, 'taskNotification.html'), 'utf-8');

// Translations 
// EN is the default. ES will be used when payload.lang === 'es'.

type Lang = 'en' | 'es';

const i18n: Record<Lang, Record<string, string>> = {
    en: {
        TASK_CREATED:   'A new task has been created',
        TASK_COMPLETED: 'A task has been completed',
        TASK_UPDATED:   'A task has been updated',
        labelStatus:      'Status',
        labelDescription: 'Description',
        labelCreated:     'Created',
        footerNote: 'This is an automated notification from Task Manager. Do not reply to this email.',
    },
    es: {
        TASK_CREATED:   'Se ha creado una nueva tarea',
        TASK_COMPLETED: 'Una tarea ha sido completada',
        TASK_UPDATED:   'Una tarea ha sido actualizada',
        labelStatus:      'Estado',
        labelDescription: 'Descripción',
        labelCreated:     'Creada el',
        footerNote: 'Esta es una notificación automática de Task Manager. No respondas a este correo.',
    },
};

//  Status colours 

//  Public API 

/**
 * Builds the HTML body for a task notification email.
 * Reads the HTML template from disk and replaces {{placeholders}} with real values.
 */
export function buildTaskEmailHtml(payload: TaskNotificationPayload): string {
    const { task, eventType } = payload;
    const lang: Lang = payload.lang ?? 'en';
    const t = i18n[lang] ?? i18n.en;

    const taskStatus     = task.status.replace('_', ' ');
    const taskDescription = task.description ?? '—';
    const taskCreatedAt  = task.createdAt
        ? new Date(task.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    const vars: Record<string, string> = {
        eventLabel:       t[eventType] ?? eventType,
        taskTitle:        task.title,
        taskStatus,
        taskDescription,
        taskCreatedAt,
        labelStatus:      t.labelStatus ?? '',
        labelDescription: t.labelDescription ?? '',
        labelCreated:     t.labelCreated ?? '',
        footerNote:       t.footerNote ?? '',
    };

    return replacePlaceholders(HTML_TEMPLATE, vars);
}

// Helpers 

function replacePlaceholders(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}
