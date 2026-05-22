import React, { useState, useEffect } from 'react';
import {
  Card, Elevation, H3, Text, Button, ButtonGroup,
  Alert, Intent, Dialog, Classes, FormGroup, InputGroup, TextArea,
  Tag, Icon, HTMLSelect
} from '@blueprintjs/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { getCategories } from '../../api/category.api';
import type { Task, TaskStatus, ICategory } from '../../types/task';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { AppToaster } from '../../utils/toaster';
import clsx from 'clsx';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // True when the logged-in user created this task.
  // Only the owner can edit content or delete; status changes will be opened to project members in Bloque 1.
  const isOwner = user?.id === task.userId;

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editCategoryId, setEditCategoryId] = useState<string>(task.category?.id ?? '');

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  const isInProgress = task.status === 'IN_PROGRESS';
  const isCompleted = task.status === 'COMPLETED';
  const statusIntent = isCompleted ? Intent.SUCCESS : isInProgress ? Intent.PRIMARY : Intent.WARNING;

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

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Task>) => api.patch(`/api/tasks/${task.id}`, payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const isEditingContent = payload.title !== undefined || payload.description !== undefined;
      if (isEditingContent) {
        AppToaster.show({
          message: t('taskUpdated'),
          intent: Intent.SUCCESS,
          icon: "refresh"
        });
        setIsEditOpen(false);
      }
    },
    onError: () => {
      AppToaster.show({
        message: t('notYourTask'),
        intent: Intent.WARNING,
        icon: "lock"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/tasks/${task.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      AppToaster.show({
        message: t('taskDeleted'),
        intent: Intent.DANGER,
        icon: "trash"
      });
    },
    onError: () => {
      AppToaster.show({
        message: t('notYourTask'),
        intent: Intent.WARNING,
        icon: "lock"
      });
    },
  });

  const nextStatus: TaskStatus | null = task.status === 'PENDING' ? 'IN_PROGRESS' : isInProgress ? 'COMPLETED' : null;
  const prevStatus: TaskStatus | null = isCompleted ? 'IN_PROGRESS' : isInProgress ? 'PENDING' : null;

  const getTranslatedStatus = (status: TaskStatus) => {
    if (status === 'IN_PROGRESS') {
      return t('inProgress');
    }
    if (status === 'PENDING') {
      return t('pending');
    }
    return t('completed');
  };

  return (
    <>
      <Card
        elevation={Elevation.ONE}
        interactive
        className={clsx(
          styles.card,
          isCompleted ? styles.statusDone : isInProgress ? styles.statusProgress : styles.statusPending,
          showHighlight && styles.newTaskHighlight
        )}
      >
        <div className={styles.content} onClick={() => setIsDetailsOpen(true)} role="button" tabIndex={0}>
          <H3 className={clsx(styles.title, isCompleted && styles.titleDone)}>
            {task.title}
          </H3>
          <Text ellipsize className={styles.description}>
            {task.description || t('noDescription')}
          </Text>
          {task.category && (
            <span className={styles.categoryBadge}>
              <span className={`${styles.categoryDot} ${styles[`categoryDot${task.category.name}` as keyof typeof styles] ?? ''}`} />
              {task.category.name}
            </span>
          )}
          {task.createdAt && (
            <div className={styles.dateRow}>
              <Icon icon="calendar" size={16} />
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <ButtonGroup variant="minimal" className={styles.actions}>
          {prevStatus && (
            <Button 
              icon="undo" 
              /* ACCESSIBILITY FIX: Enhanced ARIA label for empty buttons */
              aria-label={`${t('moveTo')} ${getTranslatedStatus(prevStatus)}`} 
              onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ status: prevStatus }); }} 
            />
          )}
          {nextStatus && (
            <Button 
              icon="double-chevron-right" 
              intent="primary" 
              aria-label={`${t('moveTo')} ${getTranslatedStatus(nextStatus)}`} 
              onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ status: nextStatus }); }} 
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

      {/* Details Dialog */}
      <Dialog
        icon="info-sign"
        onClose={() => setIsDetailsOpen(false)}
        title={t('taskDetails')}
        isOpen={isDetailsOpen}
      >
        <div className={Classes.DIALOG_BODY}>
          <div className={styles.detailHeader}>
            <H3 className={styles.dialogTitle}>{task.title}</H3>
            <Tag intent={statusIntent} size="large" round className={styles.statusTag}>
              {getTranslatedStatus(task.status)}
            </Tag>
          </div>
          <div className={styles.detailBody}>
            <Text>{task.description || t('noDetails')}</Text>
          </div>
          {task.createdAt && (
            <div className={styles.detailDate}>
              {t('createdOn')}: {new Date(task.createdAt).toLocaleString()}
            </div>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => setIsDetailsOpen(false)}>{t('close')}</Button>
            {isOwner && (
              <Button intent="primary" icon="edit" onClick={() => { setIsDetailsOpen(false); setIsEditOpen(true); }}>
                {t('editTask')}
              </Button>
            )}
          </div>
        </div>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        icon="edit"
        onClose={() => setIsEditOpen(false)}
        title={t('editTask')}
        isOpen={isEditOpen}
      >
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={t('title')} labelInfo={`(${t('required')})`}>
            <InputGroup value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </FormGroup>
          <FormGroup label={t('description')}>
            <TextArea
              fill
              className={styles.editTextarea}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </FormGroup>
          {categories.length > 0 && (
            <FormGroup label={t('category')} labelFor="edit-category-select">
              <HTMLSelect
                id="edit-category-select"
                fill
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
              >
                <option value="">{t('noCategory')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </HTMLSelect>
            </FormGroup>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => setIsEditOpen(false)}>{t('cancel')}</Button>
            <Button
              intent="primary"
              onClick={() => updateMutation.mutate({
                title: editTitle,
                description: editDescription,
                ...(editCategoryId ? { categoryId: editCategoryId } : {}),
              })}
              loading={updateMutation.isPending}
            >
              {t('saveChanges')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
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