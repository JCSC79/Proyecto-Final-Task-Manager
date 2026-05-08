import React, { useState } from 'react';
import {
  InputGroup, ButtonGroup, Button, Card,
  Elevation, Alert, Intent, Popover, Position
} from '@blueprintjs/core';
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

interface FilterButtonsProps {
  isMobile?: boolean;
  statusFilter: string;
  setStatusFilter: (val: TaskStatus | 'ALL') => void;
  t: (key: string) => string;
  onSelect?: () => void;
}

/**
 * Sub-component for filter buttons.
 */
const FilterButtons: React.FC<FilterButtonsProps> = ({
  isMobile = false, statusFilter, setStatusFilter, t, onSelect
}) => {
  const handleSetFilter = (val: TaskStatus | 'ALL') => {
    setStatusFilter(val);
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <ButtonGroup size="large" fill vertical={isMobile}>
      <Button
        text={t('all')}
        active={statusFilter === 'ALL'}
        onClick={() => handleSetFilter('ALL')}
      />
      <Button
        text={t('pending')}
        intent={Intent.WARNING}
        active={statusFilter === 'PENDING'}
        onClick={() => handleSetFilter('PENDING')}
      />
      <Button
        text={t('inProgress')}
        intent={Intent.PRIMARY}
        active={statusFilter === 'IN_PROGRESS'}
        onClick={() => handleSetFilter('IN_PROGRESS')}
      />
      <Button
        text={t('completed')}
        intent={Intent.SUCCESS}
        active={statusFilter === 'COMPLETED'}
        onClick={() => handleSetFilter('COMPLETED')}
      />
    </ButtonGroup>
  );
};

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const clearMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await api.delete('/api/tasks', { params: { status: 'COMPLETED' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      AppToaster.show({
        message: t('completedCleared'),
        intent: Intent.DANGER,
        icon: 'trash'
      });
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
            size="large"
            aria-label={t('search')}
            rightElement={
              searchTerm ? (
                <Button
                  icon="cross"
                  variant="minimal"
                  onClick={() => setSearchTerm('')}
                  aria-label={t('clear')}
                />
              ) : undefined
            }
          />
        </div>

        <div className={styles.controlsContainer}>
          <div className={styles.desktopFilters}>
            <FilterButtons
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              t={t}
            />
          </div>

          <div className={styles.mobileFilters}>
            <Popover
              isOpen={isPopoverOpen}
              onInteraction={(state) => setIsPopoverOpen(state)}
              position={Position.BOTTOM}
              minimal={true}
              matchTargetWidth={true}
              usePortal={false}
              content={
                <div className={styles.popoverMenu}>
                  <FilterButtons
                    isMobile
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    t={t}
                    onSelect={() => setIsPopoverOpen(false)}
                  />
                </div>
              }
            >
              <Button
                size="large"
                fill
                icon="filter"
                text={t('statusDistribution')}
                endIcon="caret-down"
                className={styles.filterMenuBtn}
                aria-label={t('statusDistribution')}
              />
            </Popover>
          </div>

          <Button
            icon="trash"
            intent={Intent.DANGER}
            text={t('clearCompleted')}
            onClick={() => setIsAlertOpen(true)}
            size="large"
            className={styles.clearBtn}
          />
        </div>
      </div>

      <Alert
        cancelButtonText={t('cancel')}
        confirmButtonText={t('clearCompleted')}
        icon="trash"
        intent={Intent.DANGER}
        isOpen={isAlertOpen}
        onCancel={() => setIsAlertOpen(false)}
        onConfirm={() => clearMutation.mutate()}
        loading={clearMutation.isPending}
      >
        <p>{t('clearCompletedWarning')}</p>
      </Alert>
    </Card>
  );
};
