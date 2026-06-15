import type { ITask } from './task.model.ts';

export type NotificationEventType = 'TASK_CREATED' | 'TASK_COMPLETED' | 'TASK_UPDATED';

/**
 * Shape of every message published to the task_notifications queue.
 * The worker deserializes this from the RabbitMQ message body.
 */
export interface TaskNotificationPayload {
    task: ITask;
    recipientEmail: string;
    eventType: NotificationEventType;
    lang?: 'en' | 'es';   // Optional: defaults to 'en' in the template
}
