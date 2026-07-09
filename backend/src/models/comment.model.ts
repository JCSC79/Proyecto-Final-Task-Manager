/**
 * Comment model — represents a single message in a task's discussion thread.
 */
export interface IComment {
    id: string;
    taskId: string;
    userId: string;
    body: string;
    createdAt?: Date;
    // Denormalised from JOIN — display only
    authorName?: string | null;
    authorEmail?: string;
    authorAvatarUrl?: string | null;
}
