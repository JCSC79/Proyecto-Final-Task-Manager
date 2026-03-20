import React, { useState } from 'react';
import { 
  Card, Elevation, H5, Text, Button, ButtonGroup, 
  Alert, Intent, Dialog, Classes, FormGroup, InputGroup, TextArea,
  Tag, Icon 
} from "@blueprintjs/core";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import type { Task, TaskStatus } from '../../types/task';
import { useTranslation } from 'react-i18next';
import { AppToaster } from '../../utils/toaster';

interface TaskItemProps {
  task: Task;
  isDark: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isDark }) => {
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

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Task>) => api.patch(`/tasks/${task.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // SUCCESS NOTIFICATION: Task updated
      AppToaster.show({
        message: t('taskUpdated'),
        intent: Intent.SUCCESS,
        icon: "refresh"
      });
      setIsEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${task.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // SUCCESS NOTIFICATION: Task removed
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
    if (status === 'IN_PROGRESS') return t('inProgress');
    if (status === 'PENDING') return t('pending');
    return t('completed');
  };

  return (
    <>
      <Card 
        elevation={Elevation.ONE} 
        interactive={true}
        style={{ 
          marginBottom: '12px',
          padding: '12px',
          borderLeft: `6px solid ${isCompleted ? '#0F9960' : isInProgress ? '#2B95D9' : '#D9822B'}`,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          backgroundColor: isDark ? '#30404d' : '#ffffff',
          transition: 'background-color 0.3s ease'
        }}
      >
        <div onClick={() => setIsDetailsOpen(true)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <H5 style={{ 
            margin: 0, 
            textDecoration: isCompleted ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isDark ? '#ffffff' : 'inherit'
          }}>
            {task.title}
          </H5>
          
          <Text ellipsize style={{ color: isDark ? '#a7b6c2' : '#5c7080', fontSize: '12px', marginBottom: '4px' }}>
            {task.description || t('noDescription')}
          </Text>

          {task.createdAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDark ? '#8a9ba8' : '#738694', fontSize: '10px' }}>
              <Icon icon="calendar" size={10} />
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <ButtonGroup minimal style={{ flexShrink: 0 }}>
          {prevStatus && (
            <Button icon="undo" onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ status: prevStatus }); }} />
          )}
          {nextStatus && (
            <Button icon="double-chevron-right" intent="primary" onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ status: nextStatus }); }} />
          )}
          <Button icon="edit" onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }} />
          <Button icon="trash" intent="danger" onClick={(e) => { e.stopPropagation(); setIsAlertOpen(true); }} />
        </ButtonGroup>
      </Card>

      <Dialog className={isDark ? "bp4-dark" : ""} icon="info-sign" onClose={() => setIsDetailsOpen(false)} title={t('taskDetails')} isOpen={isDetailsOpen}>
        <div className={Classes.DIALOG_BODY}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <H5 style={{ margin: 0 }}>{task.title}</H5>
            <Tag intent={statusIntent} large round style={{ textTransform: 'uppercase' }}>
              {getTranslatedStatus(task.status)}
            </Tag>
          </div>
          <div style={{ padding: '20px', backgroundColor: isDark ? '#293742' : '#f5f8fa', borderRadius: '8px', border: isDark ? '1px solid #394b59' : '1px solid #dbe3e8', whiteSpace: 'pre-wrap', minHeight: '100px' }}>
            <Text style={{ fontSize: '14px', lineHeight: '1.5', color: isDark ? '#f5f8fa' : 'inherit' }}>
              {task.description || t('noDetails')}
            </Text>
          </div>
          {task.createdAt && (
            <div style={{ marginTop: '15px', color: isDark ? '#8a9ba8' : '#738694', fontSize: '12px', fontStyle: 'italic' }}>
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

      <Dialog className={isDark ? "bp4-dark" : ""} icon="edit" onClose={() => setIsEditOpen(false)} title={t('editTask')} isOpen={isEditOpen}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={t('title')} labelInfo={`(${t('required')})`}>
            <InputGroup value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </FormGroup>
          <FormGroup label={t('description')}>
            <TextArea fill style={{ minHeight: '120px' }} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => setIsEditOpen(false)}>{t('cancel')}</Button>
            <Button intent="primary" onClick={() => updateMutation.mutate({ title: editTitle, description: editDescription })} loading={updateMutation.isPending}>
              {t('saveChanges')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Alert className={isDark ? "bp4-dark" : ""} isOpen={isAlertOpen} icon="trash" intent={Intent.DANGER} confirmButtonText={t('deleteTask')} cancelButtonText={t('cancel')} onCancel={() => setIsAlertOpen(false)} onConfirm={() => deleteMutation.mutate()}>
        <p>{t('deleteWarning')} <b>{task.title}</b>? {t('deleteAction')}</p>
      </Alert>
    </>
  );
};