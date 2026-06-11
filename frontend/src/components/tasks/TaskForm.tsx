import React, { useState } from 'react';
import { Button, InputGroup, TextArea, FormGroup, H4, Intent, HTMLSelect, Checkbox } from '@blueprintjs/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { getProjects } from '../../api/project.api';
import { getCategories } from '../../api/category.api';
import { getTagsByProject } from '../../api/tag.api';
import { useTranslation } from 'react-i18next';
import { AppToaster } from '../../utils/toaster';
import type { IProject } from '../../types/project';
import type { ICategory, TaskPriority } from '../../types/task';
import { TagBadge } from './TagBadge';
import styles from './TaskForm.module.css';

// 1. Interface for the exact shape of our API error responses
interface ServerErrorResponse {
  response?: {
    data?: {
      error?: string | string[]
    }
  };
}

interface TaskFormProps {
  onSuccess?: () => void;
  defaultProjectId?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onSuccess, defaultProjectId }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? '');
  const [categoryId, setCategoryId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  const { data: projects = [] } = useQuery<IProject[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { data: projectTags = [] } = useQuery({
    queryKey: ['tags', projectId],
    queryFn: () => getTagsByProject(projectId),
    enabled: !!projectId,
  });

  const mutation = useMutation({
    mutationFn: (newTask: { title: string; description: string; projectId?: string; categoryId?: string; tagIds?: string[] }) =>
      api.post('/api/tasks', newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      AppToaster.show({ message: t('taskCreated'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      handleClear();
      if (onSuccess) {
        onSuccess();
      }
    },
    // 2. We use 'unknown' to satisfy strict linting rules
    onError: (error: unknown) => {
      // 3. Type Guard: Cast unknown to our specific error interface safely
      const serverError = error as ServerErrorResponse;
      const rawError = serverError.response?.data?.error;

      const errorMessage = Array.isArray(rawError)
        ? rawError.map(errKey => t(errKey)).join(' | ')
        : t(rawError || 'errorMessage');

      AppToaster.show({
        message: errorMessage,
        intent: Intent.DANGER,
        icon: 'warning-sign'
      });
    },
  });

  const handleClear = () => { setTitle(''); setDescription(''); setProjectId(defaultProjectId ?? ''); setCategoryId(''); setPriority(''); setSelectedTagIds([]); };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      AppToaster.show({ message: t('requiredFieldsError'), intent: Intent.WARNING, icon: 'info-sign' });
      return;
    }
    mutation.mutate({
      title,
      description,
      ...(projectId ? { projectId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(priority ? { priority } : {}),
      ...(selectedTagIds.length > 0 ? { tagIds: selectedTagIds } : {}),
    });
  };

  return (
    <div className={styles.formContainer}>
      <H4 className={styles.heading}>{t('createTask')}</H4>
      <form onSubmit={handleSubmit}>
        <FormGroup label={t('title')} labelFor="title-input" labelInfo={`(${t('required')})`}>
          <InputGroup
            id="title-input"
            size="large"
            placeholder={t('placeholderTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormGroup>
        <FormGroup label={t('description')} labelFor="description-input" labelInfo={`(${t('required')})`}>
          <TextArea
            fill
            size="large"
            id="description-input"
            placeholder={t('placeholderDesc')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
          />
        </FormGroup>
        {projects.length > 0 && (
          <FormGroup label={t('project')} labelFor="project-select">
            <HTMLSelect
              id="project-select"
              fill
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setSelectedTagIds([]); }}
            >
              <option value="">{t('noProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </HTMLSelect>
          </FormGroup>
        )}
        {categories.length > 0 && (
          <FormGroup label={t('category')} labelFor="category-select">
            <HTMLSelect
              id="category-select"
              fill
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">{t('noCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </HTMLSelect>
          </FormGroup>
        )}
        <FormGroup label={t('priority')} labelFor="priority-select">
          <HTMLSelect
            id="priority-select"
            fill
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority | '')}
          >
            <option value="">{t('noPriority')}</option>
            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
              <option key={p} value={p}>{t(p)}</option>
            ))}
          </HTMLSelect>
        </FormGroup>
        {projectTags.length > 0 && (
          <FormGroup label={t('tags')}>
            <div className={styles.tagList}>
              {projectTags.map((tag) => {
                const checked = selectedTagIds.includes(tag.id);
                return (
                  <label key={tag.id} className={styles.tagCheckLabel}>
                    <Checkbox
                      checked={checked}
                      onChange={() =>
                        setSelectedTagIds(
                          checked
                            ? selectedTagIds.filter((id) => id !== tag.id)
                            : [...selectedTagIds, tag.id]
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
        <div className={styles.buttonRow}>
          <Button
            intent="primary"
            text={t('addTask')}
            icon="add"
            type="submit"
            loading={mutation.isPending}
            size="large"
          />
          <Button
            variant="outlined"
            text={t('clear')}
            icon="eraser"
            onClick={handleClear}
            size="large"
          />
        </div>
      </form>
    </div>
  );
};