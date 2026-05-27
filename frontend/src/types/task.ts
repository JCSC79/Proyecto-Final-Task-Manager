/**
 * Task interface aligned with Backend ITask and TaskStatus
 */
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface ICategory {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  userId: string;
  projectId?: string;
  categoryId?: string | null;
  category?: ICategory;
  createdAt?: string;
  updatedAt?: string;
}