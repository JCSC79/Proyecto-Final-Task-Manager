import React, { useState } from 'react';
import { Card, Elevation, Button, InputGroup, TextArea, FormGroup, H4, Intent } from '@blueprintjs/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { useTranslation } from 'react-i18next';
import { AppToaster } from '../../utils/toaster';
import styles from './TaskForm.module.css';

/**
 * Updated interface to handle single strings or arrays of error keys
 * sent by the Yup validation in the backend.
 */
interface ServerError {
  response?: { 
    data?: { 
      error?: string | string[] 
    } 
  };
}

export const TaskForm: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: (newTask: { title: string; description: string }) => api.post('/tasks', newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // SUCCESS: The toaster remains for creation as it's a primary action
      AppToaster.show({ message: t('taskCreated'), intent: Intent.SUCCESS, icon: 'tick-circle' });
      handleClear();
    },
    onError: (error: unknown) => {
      const serverError = error as ServerError;
      const rawError = serverError.response?.data?.error;
      
      /**
       * IMPROVEMENT: Process server errors dynamically.
       * If it's an array (multiple validation failures), we translate and join them.
       * If it's a string, we translate it using our i18n keys.
       */
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

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    // Client-side quick check
    if (!title.trim() || !description.trim()) {
      AppToaster.show({ message: t('requiredFieldsError'), intent: Intent.WARNING, icon: 'info-sign' });
      return;
    }
    mutation.mutate({ title, description });
  };

  return (
    <Card elevation={Elevation.TWO} className={styles.card}>
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
            intent="none" 
            variant="outlined"
            text={t('clear')} 
            icon="eraser" 
            onClick={handleClear} 
            size="large" 
          />
        </div>
      </form>
    </Card>
  );
};