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
    /** ADDED = owner invited user;  JOINED = user joined on their own (owner is notified) */
    eventType?: 'ADDED' | 'JOINED';
    projectId: string;
    projectName: string;
    recipientEmail: string;
    /** Display name of the actual recipient — always used for the email greeting. */
    recipientName?: string;
    /** Display name of the user who joined the project. Only set for JOINED events; used in the subject/intro line, never for the greeting. */
    actorName?: string;
    lang?: 'en' | 'es';
}

/**
 * Shape of a project-deleted notification. Sent to every member before the
 * project (and all its tasks) are permanently removed by CASCADE.
 */
export interface ProjectDeletedPayload {
    type: 'PROJECT_DELETED';
    projectName: string;
    taskCount: number;
    recipients: { email: string; name: string; lang: 'en' | 'es' }[];
}

/** Union of all message types the worker can receive on task_notifications. */
export type NotificationMessage = TaskNotificationPayload | ProjectNotificationPayload | ProjectDeletedPayload;
