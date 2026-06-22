import type { ICategory } from './category.model.ts';
import type { ITag } from './tag.model.ts';

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

export const TaskPriority = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

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
    projectId?: string;  // Optional — column exists in DB but is not required by the app
    categoryId?: string | null;  // FK -> categories.id — null explicitly clears the category
    category?: ICategory; // Populated via LEFT JOIN in read queries; absent on write operations
    tags?: ITag[];        // Populated via task_tags JOIN in read queries; absent on write operations
    priority?: TaskPriority | null;
    projectName?: string;   // Denormalised from projects.name via JOIN — read-only
    creatorName?: string;   // Denormalised from users.name via JOIN — read-only
    createdAt: Date;
    updatedAt?: Date;
}