/**
 * Task status options.
 * Using an enum ensures type safety for task states across the application.
 */
export enum TaskStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED'
}

/**
 * Main Task Interface.
 * Added updatedAt to support efficiency metrics in the KPI Dashboard.
 */
export interface ITask {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    createdAt: Date;
    updatedAt?: Date; // Optional: only present after the first update
}