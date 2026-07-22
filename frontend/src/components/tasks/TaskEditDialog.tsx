import React, { useState } from 'react';
import {
  Dialog, Classes, FormGroup, InputGroup, TextArea, HTMLSelect, Checkbox,
  Button, Intent,
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dateStringToIso, isoToDateString, formatLocalDate, parseLocalDate } from '../../utils/date';
import api from '../../api/axiosInstance';
import { getCategories } from '../../api/category.api';
import { getTagsByProject, assignTag, unassignTag } from '../../api/tag.api';
import type { Task, TaskPriority, ICategory } from '../../types/task';
import { useTranslation } from 'react-i18next';
import { es, enUS } from 'date-fns/locale';
import { AppToaster } from '../../utils/toaster';
import { TagBadge } from './TagBadge';
import styles from './TaskItem.module.css';

function isContentEdit(payload: Partial<Task>): boolean {
  return payload.title !== undefined || payload.description !== undefined;
}

function diffTagIds(original: string[], edited: string[]): { toAdd: string[]; toRemove: string[] } {
  return {
    toAdd:    edited.filter(id => !original.includes(id)),
    toRemove: original.filter(id => !edited.includes(id)),
  };
}

interface TaskEditDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskEditDialog: React.FC<TaskEditDialogProps> = ({ task, isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith('es') ? es : enUS;
  const queryClient = useQueryClient();

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editCategoryId, setEditCategoryId] = useState<string>(task.category?.id ?? '');
  const [editPriority, setEditPriority] = useState<TaskPriority | ''>(task.priority ?? '');
  const [editDueDate, setEditDueDate] = useState<string>(task.dueDate ?? '');
  const [editTagIds, setEditTagIds] = useState<string[]>([]);

  // Reset form fields when dialog opens without triggering an extra render cycle
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setEditTitle(task.title);
      setEditDescription(task.description);
      setEditCategoryId(task.category?.id ?? '');
      setEditPriority(task.priority ?? '');
      setEditDueDate(task.dueDate ?? '');
      setEditTagIds(task.tags?.map(tag => tag.id) ?? []);
    }
  }

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  const projectId = task.projectId ?? '';
  const { data: projectTags = [] } = useQuery({
    queryKey: ['tags', projectId],
    queryFn: () => getTagsByProject(projectId),
    enabled: !!projectId && isOpen,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Task>) => api.patch(`/api/tasks/${task.id}`, payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (isContentEdit(payload)) {
        AppToaster.show({ message: t('taskUpdated'), intent: Intent.SUCCESS, icon: 'refresh' });
        onClose();
      }
    },
    onError: () => {
      AppToaster.show({ message: t('notYourTask'), intent: Intent.WARNING, icon: 'lock' });
    },
  });

  const handleSave = () => {
    const originalIds = task.tags?.map(tag => tag.id) ?? [];
    const { toAdd, toRemove } = diffTagIds(originalIds, editTagIds);
    if (toAdd.length > 0 || toRemove.length > 0) {
      Promise.all([
        ...toAdd.map(id => assignTag(task.id, id)),
        ...toRemove.map(id => unassignTag(task.id, id)),
      ]).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))
        .catch(() => AppToaster.show({ message: t('errorLoadingTasks'), intent: Intent.DANGER }));
    }
    updateMutation.mutate({
      title: editTitle,
      description: editDescription,
      categoryId: editCategoryId || null,
      ...(editPriority ? { priority: editPriority } : { priority: null }),
      dueDate: editDueDate || null,
    });
  };

  return (
    <Dialog
      icon="edit"
      onClose={onClose}
      title={t('editTask')}
      isOpen={isOpen}
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
        <FormGroup label={t('dueDate')} labelFor="edit-due-date-input">
          <DateInput
            inputProps={{ id: 'edit-due-date-input' }}
            fill
            canClearSelection
            formatDate={formatLocalDate}
            parseDate={(str) => parseLocalDate(str) ?? false}
            placeholder="YYYY-MM-DD"
            value={dateStringToIso(editDueDate)}
            onChange={(isoValue) => setEditDueDate(isoToDateString(isoValue))}
            popoverProps={{ placement: 'bottom-start' }}
            locale={dateLocale}
          />
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
          <Button onClick={onClose}>{t('cancel')}</Button>
          <Button
            intent="primary"
            onClick={handleSave}
            loading={updateMutation.isPending}
          >
            {t('saveChanges')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
