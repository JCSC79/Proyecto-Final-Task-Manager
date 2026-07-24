import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TaskNotificationPayload, ProjectNotificationPayload } from '../models/notification.model.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_TEMPLATE = readFileSync(join(__dirname, 'taskNotification.html'), 'utf-8');

// Logo embedded as base64 so it works in any email client without a public URL
const LOGO_PATH = join(__dirname, '../../../frontend/src/assets/Logo.png');
let LOGO_BASE64 = '';
try {
    const raw = readFileSync(LOGO_PATH);
    LOGO_BASE64 = `data:image/png;base64,${raw.toString('base64')}`;
} catch {
    // Logo file not found — leave empty; <img> will degrade gracefully
}

//  i18n 
type Lang = 'en' | 'es';

const i18n: Record<Lang, Record<string, string>> = {
    en: {
        TASK_CREATED:   'New task created',
        TASK_COMPLETED: 'Task completed',
        TASK_UPDATED:   'Task updated',
        MEMBER_ADDED:   'You have been added to a project',
        MEMBER_JOINED:  'New member joined your project',
        appName:          'Task Manager',
        greeting:         'Hello',
        introCreated:     'A new task has been assigned to your project:',
        introCompleted:   'Great news! The following task has been completed:',
        introUpdated:     'The following task has been updated:',
        introMemberAdded: 'You have been added as a member of project',
        introMemberJoined: 'joined your project',
        labelStatus:      'Status',
        labelDescription: 'Description',
        labelCreated:     'Created',
        footerNote: 'This is an automated notification from Task Manager. Do not reply to this email.',
    },
    es: {
        TASK_CREATED:   'Nueva tarea creada',
        TASK_COMPLETED: 'Tarea completada',
        TASK_UPDATED:   'Tarea actualizada',
        MEMBER_ADDED:   'Has sido añadido a un proyecto',
        MEMBER_JOINED:  'Nuevo miembro en tu proyecto',
        appName:          'Gestor de Tareas',
        greeting:         'Hola',
        introCreated:     'Se ha creado una nueva tarea en tu proyecto:',
        introCompleted:   '¡Buenas noticias! La siguiente tarea ha sido completada:',
        introUpdated:     'La siguiente tarea ha sido actualizada:',
        introMemberAdded: 'Has sido añadido como miembro del proyecto',
        introMemberJoined: 'se ha unido a tu proyecto',
        labelStatus:      'Estado',
        labelDescription: 'Descripción',
        labelCreated:     'Creada el',
        footerNote: 'Esta es una notificación automática de Task Manager. No respondas a este correo.',
    },
};

// Status colours (badge background / text) 
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
    PENDING:     { bg: '#fff7e6', fg: '#b45309' },
    IN_PROGRESS: { bg: '#eff6ff', fg: '#1d4ed8' },
    COMPLETED:   { bg: '#f0fdf4', fg: '#15803d' },
};

// Public API 

/**
 * Builds the HTML body for a task notification email.
 * Reads the HTML template from disk and replaces {{placeholders}} with real values.
 */
export function buildTaskEmailHtml(payload: TaskNotificationPayload): string {
    const { task, eventType } = payload;
    const lang: Lang = payload.lang ?? 'en';
    const t = i18n[lang];

    const recipientName  = payload.recipientName ?? payload.recipientEmail;
    const taskStatus     = task.status.replace('_', ' ');
    const statusColors   = STATUS_COLORS[task.status] ?? { bg: '#f3f4f6', fg: '#374151' };
    const taskDescription = task.description ?? '—';
    const dateLocale     = lang === 'es' ? 'es-ES' : 'en-GB';
    const taskCreatedAt  = task.createdAt
        ? new Date(task.createdAt).toLocaleDateString(dateLocale, {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : '—';

    // Build the intro line depending on event type
    let introLine = t[`intro${eventType.charAt(0) + eventType.slice(1).toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}`] ?? '';
    if (eventType === 'MEMBER_ADDED' && payload.projectName) {
        introLine = `${t.introMemberAdded} "${payload.projectName}".`;
    }

    const vars: Record<string, string> = {
        logoBase64:       LOGO_BASE64,
        appName:          t.appName ?? 'Task Manager',
        eventLabel:       t[eventType] ?? eventType,
        greeting:         t.greeting ?? 'Hello',
        recipientName,
        introLine,
        taskTitle:        task.title,
        taskStatus,
        statusBadgeStyle: `display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;background-color:${statusColors.bg};color:${statusColors.fg};`,
        taskDescription,
        taskCreatedAt,
        labelStatus:      t.labelStatus ?? '',
        labelDescription: t.labelDescription ?? '',
        labelCreated:     t.labelCreated ?? '',
        footerNote:       t.footerNote ?? '',
    };

    return replacePlaceholders(HTML_TEMPLATE, vars);
}

/**
 * Builds the HTML body for a PROJECT_DELETED email notification.
 * Reuses the same HTML template — the "task card" shows project name + task count.
 */
export function buildProjectDeletedEmailHtml(
    projectName: string,
    taskCount: number,
    recipientName: string,
    lang: Lang = 'en',
): string {
    const t = i18n[lang];

    const labels: Record<Lang, { eventLabel: string; intro: string; taskCountLine: string; closing: string }> = {
        en: {
            eventLabel:    'Project deleted',
            intro:         `The project has been deleted by its owner.`,
            taskCountLine: `${taskCount} associated task(s) have been removed.`,
            closing:       'Thank you for using Task Manager.',
        },
        es: {
            eventLabel:    'Proyecto eliminado',
            intro:         `El proyecto ha sido eliminado por su propietario.`,
            taskCountLine: `Se han eliminado ${taskCount} tarea(s) asociadas a este proyecto.`,
            closing:       'Gracias por usar el Gestor de Tareas.',
        },
    };

    const lbl = labels[lang];

    const vars: Record<string, string> = {
        logoBase64:       LOGO_BASE64,
        appName:          t.appName ?? 'Task Manager',
        eventLabel:       lbl.eventLabel,
        greeting:         t.greeting ?? 'Hello',
        recipientName,
        introLine:        `${lbl.intro} ${lbl.taskCountLine}`,
        taskTitle:        projectName,
        taskStatus:       '',
        statusBadgeStyle: 'display:none;',
        taskDescription:  lbl.closing,
        taskCreatedAt:    '',
        labelStatus:      '',
        labelDescription: '',
        labelCreated:     '',
        footerNote:       t.footerNote ?? '',
    };

    return replacePlaceholders(HTML_TEMPLATE, vars);
}

function replacePlaceholders(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}

/**
 * Builds the HTML body for a MEMBER_ADDED project notification email.
 * Reuses the same HTML template but passes simplified vars:
 * the task card shows the project name and hides irrelevant fields.
 */
export function buildMemberEmailHtml(payload: ProjectNotificationPayload): string {
    const lang: Lang = payload.lang ?? 'en';
    const t = i18n[lang];
    const recipientName = payload.recipientName ?? payload.recipientEmail;
    const isJoined = payload.eventType === 'JOINED';
    const actorName = payload.actorName ?? (lang === 'es' ? 'Alguien' : 'Someone');
    const introLine = isJoined
        ? `${actorName} ${t.introMemberJoined} "${payload.projectName}".`
        : `${t.introMemberAdded} "${payload.projectName}".`;

    const vars: Record<string, string> = {
        logoBase64:       LOGO_BASE64,
        appName:          t.appName ?? 'Task Manager',
        eventLabel:       isJoined ? (t.MEMBER_JOINED ?? 'New member') : (t.MEMBER_ADDED ?? 'Added to project'),
        greeting:         t.greeting ?? 'Hello',
        recipientName,
        introLine,
        taskTitle:        payload.projectName,
        taskStatus:       '',
        statusBadgeStyle: 'display:none;',
        taskDescription:  '',
        taskCreatedAt:    '',
        labelStatus:      '',
        labelDescription: '',
        labelCreated:     '',
        footerNote:       t.footerNote ?? '',
    };

    return replacePlaceholders(HTML_TEMPLATE, vars);
}