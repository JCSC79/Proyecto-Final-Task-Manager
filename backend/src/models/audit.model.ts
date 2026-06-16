export type AuditAction = 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_DELETED';

export interface IAuditLog {
    id: string;
    taskId: string;
    userId: string;
    action: AuditAction;
    oldValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    createdAt?: Date;
}

export interface IAuditLogEvent {
    taskId: string;
    userId: string;
    action: AuditAction;
    oldValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
}
