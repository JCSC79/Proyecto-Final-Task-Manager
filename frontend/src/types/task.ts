/**
 * Task interface aligned with Backend ITask and TaskStatus
 */
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ICategory {
  id: string;
  name: string;
  color: string;
}

export interface ITag {
  id: string;
  name: string;
  color: string; // 7-char hex e.g. #e03131
  projectId: string;
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
  tags?: ITag[];
  priority?: TaskPriority | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AuditAction = 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_DELETED';

export interface AuditLog {
  id: string;
  taskId: string;
  userId: string;
  action: AuditAction;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  createdAt?: string;
}