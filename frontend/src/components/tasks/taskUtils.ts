/**
 * Shared helpers for task-related components.
 * Pure functions — no React, no side effects.
 */
import type { TaskStatus } from '../../types/task';

export function getTranslatedStatus(status: TaskStatus, t: (key: string) => string): string {
  if (status === 'IN_PROGRESS') {
    return t('inProgress');
  }
  if (status === 'PENDING') {
    return t('pending');
  }
  return t('completed');
}
