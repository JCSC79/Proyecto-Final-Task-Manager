/**
 * Task status options.
 * Using a constant object with 'as const' ensures type safety and compatibility with Node.js native execution.
 */
export const TaskStatus = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
} as const;

// This creates a type from the object values for your interfaces
export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

/**
 * Main Task Interface.
 * Updated to include userId for database relationship integrity.
 */
export interface ITask {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    userId: string;     // Foreign key reference to User.id
    projectId?: string; // Optional — column exists in DB but is not required by the app
    createdAt: Date;
    updatedAt?: Date;
}