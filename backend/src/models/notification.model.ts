import type { ITask } from './task.model.ts';

export type NotificationEventType = 'TASK_CREATED' | 'TASK_COMPLETED' | 'TASK_UPDATED' | 'MEMBER_ADDED';

/**
 * Shape of every task-event message published to the task_notifications queue.
 * The `type` discriminator lets the worker route to the correct handler.
 */
export interface TaskNotificationPayload {
    type?: 'TASK';                // optional for backwards compatibility
    task: ITask;
    recipientEmail: string;
    recipientName?: string;
    eventType: NotificationEventType;
    lang?: 'en' | 'es';
    projectName?: string;
}

/**
 * Shape of a project-membership notification published to the same queue.
 * Uses type: 'PROJECT' so the worker routes it separately from task events.
 */
export interface ProjectNotificationPayload {
    type: 'PROJECT';
    projectId: string;
    projectName: string;
    recipientEmail: string;
    recipientName?: string;
    lang?: 'en' | 'es';
}

/** Union of all message types the worker can receive on task_notifications. */
export type NotificationMessage = TaskNotificationPayload | ProjectNotificationPayload;
