import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { TaskNotificationPayload } from '../models/notification.model.ts';
import { buildTaskEmailHtml } from '../templates/taskNotification.template.ts';

/**
 * EmailService — sends transactional emails via SMTP.
 * In development (NODE_ENV !== 'production') it auto-creates an Ethereal test account and prints the preview URL to stdout so you can inspect the
 * rendered email without a real SMTP server.
 */
class EmailService {
    private transporter?: Transporter;

    async init(): Promise<void> {
        if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
            // Auto-create a disposable Ethereal test account for development
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('[*] Email service: using Ethereal test account ->', testAccount.user);
        } else {
            // Production / staging: read real SMTP credentials from .env
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT ?? 587),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }

        // Verify connectivity on startup
        try {
            await this.transporter.verify();
            console.log('[*] Email service: SMTP connection verified.');
        } catch (err) {
            console.error('[-] Email service: SMTP verification failed.', err);
        }
    }

    async sendTaskNotification(payload: TaskNotificationPayload): Promise<void> {
        if (!this.transporter) {
            console.error('[-] Email service not initialized.');
            return;
        }

        const from = process.env.SMTP_FROM ?? '"Task Manager" <noreply@taskmanager.dev>';
        const subject = buildSubject(payload);
        const html = buildTaskEmailHtml(payload);

        const info = await this.transporter.sendMail({
            from,
            to: payload.recipientEmail,
            subject,
            html,
        });

        // In dev, Ethereal gives a URL to preview the email in the browser
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[v] Email preview: ${previewUrl}`);
        } else {
            console.log(`[v] Email sent to ${payload.recipientEmail} - id: ${info.messageId}`);
        }
    }
}

function buildSubject(payload: TaskNotificationPayload): string {
    const titles: Record<TaskNotificationPayload['eventType'], string> = {
        TASK_CREATED: `New task: ${payload.task.title}`,
        TASK_COMPLETED: `Task completed: ${payload.task.title}`,
        TASK_UPDATED: `Task updated: ${payload.task.title}`,
    };
    return titles[payload.eventType];
}

export const emailService = new EmailService();
