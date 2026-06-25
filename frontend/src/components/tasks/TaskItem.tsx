import React, { useState, useEffect } from 'react';
import {
  Card, Elevation, H3, Text, Button, ButtonGroup,
  Alert, Intent, Tag, Icon,
} from '@blueprintjs/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../api/axiosInstance';
import type { Task, TaskStatus, TaskPriority } from '../../types/task';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { AppToaster } from '../../utils/toaster';
import clsx from 'clsx';
import { TagBadge } from './TagBadge';
import { hexToIntent } from '../../utils/hexToIntent';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { TaskEditDialog } from './TaskEditDialog';
import { getTranslatedStatus } from './taskUtils';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  /** When true, enables drag-and-drop via useSortable (desktop only). */
  isDragEnabled?: boolean;
  /** When true, renders a simplified ghost card inside DragOverlay. */
  isOverlay?: boolean;
}

function getPriorityIntent(priority: TaskPriority): Intent {
  if (priority === 'URGENT') {
    return Intent.DANGER;
  }
  if (priority === 'HIGH')   {
    return Intent.WARNING;
  }
  if (priority === 'MEDIUM') {
    return Intent.PRIMARY;
  }
  return Intent.NONE;
}

function getCategoryDotClass(color: string): string {
  const cls = 'categoryDot_' + hexToIntent(color);
  return (styles as Record<string, string>)[cls] ?? '';
}

function getAdjacentStatuses(status: TaskStatus): { next: TaskStatus | null; prev: TaskStatus | null } {
  if (status === 'PENDING')     {
    return { next: 'IN_PROGRESS', prev: null };
  }
  if (status === 'IN_PROGRESS') {
    return { next: 'COMPLETED',   prev: 'PENDING' };
  }
  return { next: null, prev: 'IN_PROGRESS' };
}

const STATUS_CLASS: Record<string, string> = {
  COMPLETED:   styles.statusDone,
  IN_PROGRESS: styles.statusProgress,
  PENDING:     styles.statusPending,
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, isDragEnabled = false, isOverlay = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isOwner = user?.id === task.userId;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !isDragEnabled });

  const dragStyle: React.CSSProperties = isDragEnabled ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    cursor: isOverlay ? 'grabbing' : 'grab',
  } : {};

  const [isAlertOpen, setIsAlertOpen]   = useState(false);
  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isCompleted    = task.status === 'COMPLETED';
  const cardStatusClass = STATUS_CLASS[task.status] ?? styles.statusPending;

  const [showHighlight, setShowHighlight] = useState(() => {
    if (!task.createdAt) {
      return false;
    }
    return Date.now() - new Date(task.createdAt).getTime() < 5000;
  });

  useEffect(() => {
    if (showHighlight) {
      const timer = setTimeout(() => setShowHighlight(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showHighlight]);

  // Move-status mutation (used by the << >> buttons on the card)
  const moveMutation = useMutation({
    mutationFn: (payload: Partial<Task>) => api.patch(`/api/tasks/${task.id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () =>
      AppToaster.show({ message: t('notYourTask'), intent: Intent.WARNING, icon: 'lock' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/tasks/${task.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      AppToaster.show({ message: t('taskDeleted'), intent: Intent.DANGER, icon: 'trash' });
    },
    onError: () =>
      AppToaster.show({ message: t('notYourTask'), intent: Intent.WARNING, icon: 'lock' }),
  });

  const { next: nextStatus, prev: prevStatus } = getAdjacentStatuses(task.status);

  return (
    <>
      <Card
        ref={setNodeRef}
        elevation={isOverlay ? Elevation.THREE : Elevation.ONE}
        interactive={!isDragging}
        className={clsx(styles.card, cardStatusClass, showHighlight && styles.newTaskHighlight, isOverlay && styles.cardOverlay)}
        style={dragStyle}
        {...(isDragEnabled ? { ...attributes, ...listeners } : {})}
      >
        <button
          type="button"
          className={styles.content}
          onClick={() => { if (!isDragging) setIsDetailsOpen(true); }}
        >
          <H3 className={clsx(styles.title, isCompleted && styles.titleDone)}>
            {task.title}
          </H3>
          <Text ellipsize className={styles.description}>
            {task.description || t('noDescription')}
          </Text>
          {Boolean(task.category ?? task.priority) && (
            <div className={styles.metaRow}>
              {task.category && (
                <span className={styles.categoryBadge}>
                  <span className={clsx(styles.categoryDot, getCategoryDotClass(task.category.color))} />
                  {task.category.name}
                </span>
              )}
              {task.priority && (
                <Tag minimal round intent={getPriorityIntent(task.priority)} className={styles.priorityBadge}>
                  {t(task.priority)}
                </Tag>
              )}
            </div>
          )}
          {task.tags && task.tags.length > 0 && (
            <div className={styles.tagRow}>
              {task.tags.map((tag) => <TagBadge key={tag.id} tag={tag} />)}
            </div>
          )}
          {task.createdAt && (
            <div className={styles.dateRow}>
              <Icon icon="calendar" size={16} aria-hidden="true" />
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {(task.projectName ?? task.creatorName) && (
            <div className={styles.footerRow}>
              {task.projectName && (
                <span className={styles.footerMeta}>
                  <Icon icon="folder-open" size={12} aria-hidden="true" />
                  {task.projectName}
                </span>
              )}
              {task.creatorName && (
                <span className={styles.footerMeta}>
                  <Icon icon="person" size={12} aria-hidden="true" />
                  {task.creatorName}
                </span>
              )}
            </div>
          )}
        </button>

        <ButtonGroup variant="minimal" className={styles.actions}>
          {prevStatus && (
            <Button
              icon="undo"
              aria-label={`${t('moveTo')} ${getTranslatedStatus(prevStatus, t)}`}
              onClick={(e) => { e.stopPropagation(); moveMutation.mutate({ status: prevStatus }); }}
            />
          )}
          {nextStatus && (
            <Button
              icon="double-chevron-right"
              intent="primary"
              aria-label={`${t('moveTo')} ${getTranslatedStatus(nextStatus, t)}`}
              onClick={(e) => { e.stopPropagation(); moveMutation.mutate({ status: nextStatus }); }}
            />
          )}
          {isOwner && (
            <Button
              icon="edit"
              aria-label={t('editTask')}
              onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
            />
          )}
          {isOwner && (
            <Button
              icon="trash"
              intent="danger"
              aria-label={t('deleteTask')}
              onClick={(e) => { e.stopPropagation(); setIsAlertOpen(true); }}
            />
          )}
        </ButtonGroup>
      </Card>

      <TaskDetailsDialog
        task={task}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={() => setIsEditOpen(true)}
        isOwner={isOwner}
      />

      <TaskEditDialog
        task={task}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      <Alert
        isOpen={isAlertOpen}
        icon="trash"
        intent={Intent.DANGER}
        confirmButtonText={t('deleteTask')}
        cancelButtonText={t('cancel')}
        onCancel={() => setIsAlertOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      >
        <p>{t('deleteWarning')} <b>{task.title}</b>? {t('deleteAction')}</p>
      </Alert>
    </>
  );
};
