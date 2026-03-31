import React, { useState } from 'react';
import { InputGroup, ButtonGroup, Button, Card, Elevation, Alert, Intent } from '@blueprintjs/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import type { TaskStatus } from '../../types/task';
import { useTranslation } from 'react-i18next';
import { AppToaster } from '../../utils/toaster';
import styles from './TaskFilters.module.css';

interface TaskFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: TaskStatus | 'ALL') => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const clearMutation = useMutation({
    mutationFn: () => api.delete('/tasks'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      AppToaster.show({ message: t('boardCleared'), intent: Intent.DANGER, icon: 'trash' });
      setIsAlertOpen(false);
    },
    onError: (err: Error) => {
      AppToaster.show({
        message: `${t('errorLoadingTasks')}: ${err.message}`,
        intent: Intent.DANGER,
      });
    },
  });

  return (
    <Card elevation={Elevation.ZERO} className={styles.wrapper}>
      <div className={styles.row}>
        <div className={styles.searchWrapper}>
          <InputGroup
            leftIcon="search"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.controls}>
          <ButtonGroup>
            <Button text={t('all')} active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} />
            <Button text={t('pending')} intent="warning" active={statusFilter === 'PENDING'} onClick={() => setStatusFilter('PENDING')} />
            <Button text={t('inProgress')} intent="primary" active={statusFilter === 'IN_PROGRESS'} onClick={() => setStatusFilter('IN_PROGRESS')} />
            <Button text={t('completed')} intent="success" active={statusFilter === 'COMPLETED'} onClick={() => setStatusFilter('COMPLETED')} />
          </ButtonGroup>

          <Button icon="clean" intent="danger" text={t('clearBoard')} onClick={() => setIsAlertOpen(true)} />
        </div>
      </div>

      <Alert
        cancelButtonText={t('cancel')}
        confirmButtonText={t('clearBoard')}
        icon="trash"
        intent={Intent.DANGER}
        isOpen={isAlertOpen}
        onCancel={() => setIsAlertOpen(false)}
        onConfirm={() => clearMutation.mutate()}
        loading={clearMutation.isPending}
      >
        <p>{t('clearBoardWarning')}</p>
      </Alert>
    </Card>
  );
};
