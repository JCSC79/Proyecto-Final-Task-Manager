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
 * Defines the strict contract that every task object must satisfy.
 */
export interface ITask {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    createdAt: Date;
}