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
  onSelect?: () => void; // Added callback to close popover
}

/**
 * Sub-component for filter buttons.
 * Triggers onSelect when a button is clicked to handle menu closing.
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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); // Controlled popover state

  const clearMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await api.delete('/tasks');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      AppToaster.show({ 
        message: t('boardCleared'), 
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
              usePortal={false} // FIXED: Prevents "jumping" to top-left on small viewports
              content={
                <div className={styles.popoverMenu}>
                  <FilterButtons 
                    isMobile 
                    statusFilter={statusFilter} 
                    setStatusFilter={setStatusFilter} 
                    t={t} 
                    onSelect={() => setIsPopoverOpen(false)} // Closes on click
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
              />
            </Popover>
          </div>

          <Button 
            icon="clean" 
            intent={Intent.DANGER} 
            text={t('clearBoard')} 
            onClick={() => setIsAlertOpen(true)}
            size="large"
            className={styles.clearBtn}
          />
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
