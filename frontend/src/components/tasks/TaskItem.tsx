import React, { useState, useEffect } from 'react';
import {
  Card, Elevation, H3, Text, Button, ButtonGroup,
  Alert, Intent, Dialog, Classes, FormGroup, InputGroup, TextArea,
  Tag, Icon
} from '@blueprintjs/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import type { Task, TaskStatus } from '../../types/task';
import { useTranslation } from 'react-i18next';
import { AppToaster } from '../../utils/toaster';
import clsx from 'clsx';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);

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
          {task.createdAt && (
            <div className={styles.dateRow}>
              <Icon icon="calendar" size={15} />
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
          <Button 
            icon="edit" 
            aria-label={t('editTask')} 
            onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }} 
          />
          <Button 
            icon="trash" 
            intent="danger" 
            aria-label={t('deleteTask')} 
            onClick={(e) => { e.stopPropagation(); setIsAlertOpen(true); }} 
          />
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
            <Button intent="primary" icon="edit" onClick={() => { setIsDetailsOpen(false); setIsEditOpen(true); }}>
              {t('editTask')}
            </Button>
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
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => setIsEditOpen(false)}>{t('cancel')}</Button>
            <Button
              intent="primary"
              onClick={() => updateMutation.mutate({ title: editTitle, description: editDescription })}
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