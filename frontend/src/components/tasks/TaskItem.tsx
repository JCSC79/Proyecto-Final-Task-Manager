import React, { useState, useEffect } from 'react';
import {
  Card, Elevation, H3, Text, Button, ButtonGroup,
  Alert, Intent, Dialog, Classes, FormGroup, InputGroup, TextArea,
  Tag, Icon, HTMLSelect, Checkbox, Tabs, Tab
} from '@blueprintjs/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { getCategories } from '../../api/category.api';
import { getTagsByProject, assignTag, unassignTag } from '../../api/tag.api';
import { getTaskHistory } from '../../api/task.api';
import type { Task, TaskStatus, TaskPriority, ICategory, AuditLog } from '../../types/task';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { AppToaster } from '../../utils/toaster';
import clsx from 'clsx';
import { TagBadge } from './TagBadge';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
}

//  Extracted outside the component
function getPriorityIntent(priority: TaskPriority): Intent {
  if (priority === 'URGENT') {
    return Intent.DANGER;
  }
  if (priority === 'HIGH') {
    return Intent.WARNING;
  }
  if (priority === 'MEDIUM') {
    return Intent.PRIMARY;
  }
  return Intent.NONE;
}

function getCategoryDotClass(name: string): string {
  const key = `categoryDot${name}`;
  return (styles as Record<string, string>)[key] ?? '';
}

function getTranslatedStatus(status: TaskStatus, t: (key: string) => string): string {
  if (status === 'IN_PROGRESS') {
    return t('inProgress');
  }
  if (status === 'PENDING') {
    return t('pending');
  }
  return t('completed');
}

// Lookup tables — no branching
const STATUS_INTENT: Record<string, Intent> = {
  COMPLETED: Intent.SUCCESS,
  IN_PROGRESS: Intent.PRIMARY,
  PENDING: Intent.WARNING,
};

const STATUS_CLASS: Record<string, string> = {
  COMPLETED: styles.statusDone,
  IN_PROGRESS: styles.statusProgress,
  PENDING: styles.statusPending,
};

function isContentEdit(payload: Partial<Task>): boolean {
  return payload.title !== undefined || payload.description !== undefined;
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
  const [detailsTab, setDetailsTab] = useState<string>('info');

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editCategoryId, setEditCategoryId] = useState<string>(task.category?.id ?? '');
  const [editPriority, setEditPriority] = useState<TaskPriority | ''>(task.priority ?? '');
  const [editTagIds, setEditTagIds] = useState<string[]>([]);

  // Reset edit state when the edit dialog opens — "setState during render" avoids useEffect
  const [prevIsEditOpen, setPrevIsEditOpen] = useState(false);
  if (prevIsEditOpen !== isEditOpen) {
    setPrevIsEditOpen(isEditOpen);
    if (isEditOpen) {
      setEditTitle(task.title);
      setEditDescription(task.description);
      setEditCategoryId(task.category?.id ?? '');
      setEditPriority(task.priority ?? '');
      setEditTagIds(task.tags?.map(tag => tag.id) ?? []);
    }
  }

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  // Fetch project tags only when the edit dialog is open and the task belongs to a project
  const { data: projectTags = [] } = useQuery({
    queryKey: ['tags', task.projectId],
    queryFn: () => getTagsByProject(task.projectId!),
    enabled: !!task.projectId && isEditOpen,
  });

  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: ['taskHistory', task.id],
    queryFn: () => getTaskHistory(task.id),
    enabled: isDetailsOpen && detailsTab === 'history',
  });

  const isInProgress = task.status === 'IN_PROGRESS';
  const isCompleted = task.status === 'COMPLETED';
  const statusIntent = STATUS_INTENT[task.status] ?? Intent.WARNING;
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

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Task>) => api.patch(`/api/tasks/${task.id}`, payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const isEditingContent = isContentEdit(payload);
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

  const handleSaveEdit = () => {
    // Reconcile tag changes in parallel (fire-and-forget; invalidation handles the UI refresh)
    const originalIds = task.tags?.map(tag => tag.id) ?? [];
    const toAdd = editTagIds.filter(id => !originalIds.includes(id));
    const toRemove = originalIds.filter(id => !editTagIds.includes(id));
    const hasTagChanges = toAdd.length > 0 || toRemove.length > 0;
    if (hasTagChanges) {
      Promise.all([
        ...toAdd.map(id => assignTag(task.id, id)),
        ...toRemove.map(id => unassignTag(task.id, id)),
      ]).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))
        .catch(() => AppToaster.show({ message: t('errorLoadingTasks'), intent: Intent.DANGER }));
    }
    // Save task fields — onSuccess shows toast and closes the dialog
    updateMutation.mutate({
      title: editTitle,
      description: editDescription,
      categoryId: editCategoryId || null,
      ...(editPriority ? { priority: editPriority } : { priority: null }),
    });
  };

  let nextStatus: TaskStatus | null = null;
  if (task.status === 'PENDING') {
    nextStatus = 'IN_PROGRESS';
  } else if (isInProgress) {
    nextStatus = 'COMPLETED';
  }

  let prevStatus: TaskStatus | null = null;
  if (isCompleted) {
    prevStatus = 'IN_PROGRESS';
  } else if (isInProgress) {
    prevStatus = 'PENDING';
  }

  return (
    <>
      <Card
        elevation={Elevation.ONE}
        interactive
        className={clsx(styles.card, cardStatusClass, showHighlight && styles.newTaskHighlight)}
      >
        <button
          type="button"
          className={styles.content}
          onClick={() => setIsDetailsOpen(true)}
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
                  <span className={`${styles.categoryDot} ${getCategoryDotClass(task.category.name)}`} />
                  {task.category.name}
                </span>
              )}
              {task.priority && (
                <Tag
                  minimal
                  round
                  intent={getPriorityIntent(task.priority)}
                  className={styles.priorityBadge}
                >
                  {t(task.priority)}
                </Tag>
              )}
            </div>
          )}
          {task.tags && task.tags.length > 0 && (
            <div className={styles.tagRow}>
              {task.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}
          {task.createdAt && (
            <div className={styles.dateRow}>
              <Icon icon="calendar" size={16} aria-hidden="true" />
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </button>

        <ButtonGroup variant="minimal" className={styles.actions}>
          {prevStatus && (
            <Button 
              icon="undo" 
              /* ACCESSIBILITY FIX: Enhanced ARIA label for empty buttons */
              aria-label={`${t('moveTo')} ${getTranslatedStatus(prevStatus, t)}`} 
              onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ status: prevStatus }); }} 
            />
          )}
          {nextStatus && (
            <Button 
              icon="double-chevron-right" 
              intent="primary" 
              aria-label={`${t('moveTo')} ${getTranslatedStatus(nextStatus, t)}`} 
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
              {getTranslatedStatus(task.status, t)}
            </Tag>
          </div>
          <Tabs
            id="task-detail-tabs"
            selectedTabId={detailsTab}
            onChange={(newTabId) => setDetailsTab(String(newTabId))}
          >
            <Tab id="info" title={t('taskDetails')} panel={
              <>
                <div className={styles.detailBody}>
                  <Text>{task.description || t('noDetails')}</Text>
                </div>
                {task.tags && task.tags.length > 0 && (
                  <div className={styles.detailTagRow}>
                    {task.tags.map((tag) => (
                      <TagBadge key={tag.id} tag={tag} />
                    ))}
                  </div>
                )}
                {task.createdAt && (
                  <div className={styles.detailDate}>
                    {t('createdOn')}: {new Date(task.createdAt).toLocaleString()}
                  </div>
                )}
              </>
            } />
            <Tab id="history" title={t('history')} panel={
              <div className={styles.historyList}>
                {auditLogs.length === 0
                  ? <Text className={styles.noHistory}>{t('noHistory')}</Text>
                  : auditLogs.map((log) => (
                    <div key={log.id} className={styles.historyEntry}>
                      <Icon icon="history" size={14} />
                      <span className={styles.historyAction}>
                        {t(`historyAction_${log.action}`)}
                      </span>
                      {log.createdAt && (
                        <span className={styles.historyDate}>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))
                }
              </div>
            } />
          </Tabs>
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
          <FormGroup label={t('priority')} labelFor="edit-priority-select">
            <HTMLSelect
              id="edit-priority-select"
              fill
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as TaskPriority | '')}
            >
              <option value="">{t('noPriority')}</option>
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                <option key={p} value={p}>{t(p)}</option>
              ))}
            </HTMLSelect>
          </FormGroup>
          {projectTags.length > 0 && (
            <FormGroup label={t('tags')}>
              <div className={styles.editTagGrid}>
                {projectTags.map((tag) => {
                  const checked = editTagIds.includes(tag.id);
                  return (
                    <label key={tag.id} className={styles.editTagLabel}>
                      <Checkbox
                        checked={checked}
                        onChange={() =>
                          setEditTagIds(
                            checked
                              ? editTagIds.filter(id => id !== tag.id)
                              : [...editTagIds, tag.id]
                          )
                        }
                      />
                      <TagBadge tag={tag} />
                    </label>
                  );
                })}
              </div>
            </FormGroup>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => setIsEditOpen(false)}>{t('cancel')}</Button>
            <Button
              intent="primary"
              onClick={handleSaveEdit}
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