import React, { useState } from 'react';
import { Button, InputGroup, TextArea, FormGroup, H4, Intent } from '@blueprintjs/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { useTranslation } from 'react-i18next';
import { AppToaster } from '../../utils/toaster';
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
}

export const TaskForm: React.FC<TaskFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: (newTask: { title: string; description: string }) => api.post('/tasks', newTask),
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

  const handleClear = () => { setTitle(''); setDescription(''); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      AppToaster.show({ message: t('requiredFieldsError'), intent: Intent.WARNING, icon: 'info-sign' });
      return;
    }
    mutation.mutate({ title, description });
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