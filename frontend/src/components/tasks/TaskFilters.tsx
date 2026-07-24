import React, { useState } from 'react';
import {
  InputGroup, ButtonGroup, Button, Card,
  Elevation, Alert, Intent, HTMLSelect, PopoverNext as Popover
} from '@blueprintjs/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import type { TaskStatus, TaskPriority, ICategory, ITag } from '../../types/task';
import { useTranslation } from 'react-i18next';
import { AppToaster } from '../../utils/toaster';
import { getCategories } from '../../api/category.api';
import { getTagsByProject } from '../../api/tag.api';
import styles from './TaskFilters.module.css';

interface TaskFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: TaskStatus | 'ALL') => void;
  categoryId: string | null;
  setCategoryId: (val: string | null) => void;
  priorityFilter: TaskPriority | 'ALL';
  setPriorityFilter: (val: TaskPriority | 'ALL') => void;
  onlyMyTasks: boolean;
  setOnlyMyTasks: (val: boolean) => void;
  onlyMyAssignments: boolean;
  setOnlyMyAssignments: (val: boolean) => void;
  selectedProjectId: string | null;
  selectedTagIds: string[];
  setSelectedTagIds: (val: string[]) => void;
}

interface FilterButtonsProps {
  isMobile?: boolean;
  statusFilter: string;
  setStatusFilter: (val: TaskStatus | 'ALL') => void;
  t: (key: string) => string;
  onSelect?: () => void;
  onClearCompleted?: () => void;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({
  isMobile = false, statusFilter, setStatusFilter, t, onSelect, onClearCompleted
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
        icon="clipboard"
        size="large"
        alignText="start" 
        text={t('all')}
        active={statusFilter === 'ALL'}
        onClick={() => handleSetFilter('ALL')}
      />
      <Button
        icon="circle"
        size="large"
        alignText="start" 
        text={t('pending')}
        intent={Intent.WARNING}
        active={statusFilter === 'PENDING'}
        onClick={() => handleSetFilter('PENDING')}
      />
      <Button
        icon="full-circle"
        size="large"
        alignText="start" 
        text={t('inProgress')}
        intent={Intent.PRIMARY}
        active={statusFilter === 'IN_PROGRESS'}
        onClick={() => handleSetFilter('IN_PROGRESS')}
      />
      <Button
        icon="tick-circle"
        size="large"
        alignText="start" 
        text={t('completed')}
        intent={Intent.SUCCESS}
        active={statusFilter === 'COMPLETED'}
        onClick={() => handleSetFilter('COMPLETED')}
      />
      {onClearCompleted && (
        <Button
          icon="trash"
          size="large"
          alignText="start"
          text={t('clearCompleted')}
          intent={Intent.DANGER}
          onClick={onClearCompleted}
        />
      )}
    </ButtonGroup>
  );
};

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchTerm, 
  setSearchTerm,
  statusFilter, 
  setStatusFilter,
  categoryId, 
  setCategoryId,
  priorityFilter, 
  setPriorityFilter,
  onlyMyTasks,
  setOnlyMyTasks,
  onlyMyAssignments,
  setOnlyMyAssignments,
  selectedProjectId,
  selectedTagIds,
  setSelectedTagIds,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  // Only fetch tags when a project is selected — tags are project-scoped
  const { data: projectTags = [] } = useQuery<ITag[]>({
    queryKey: ['project-tags', selectedProjectId],
    queryFn: () => getTagsByProject(selectedProjectId!),
    enabled: !!selectedProjectId,
    staleTime: 30_000,
  });

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
        intent: Intent.DANGER
      });
    },
  });

  return (
    <Card elevation={Elevation.ZERO} className={styles.wrapper} >

      {/* Row 1: search + status filters */}
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
                  variant="outlined"
                  onClick={() => setSearchTerm('')}
                  aria-label={t('clear')}
                />
              ) : undefined
            }
          />
        </div>

        <div className={styles.desktopFilters}>
          <FilterButtons
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            t={t}
            onClearCompleted={() => setIsAlertOpen(true)}
          />
        </div>

        <div className={styles.mobileFilters}>
          <Popover
            isOpen={isPopoverOpen}
            onInteraction={(state) => setIsPopoverOpen(state)}
            placement="bottom-end"
            usePortal={false}
            content={
              <div className={styles.popoverMenu}>
                <FilterButtons
                  isMobile
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  t={t}
                  onSelect={() => setIsPopoverOpen(false)}
                  onClearCompleted={() => { setIsPopoverOpen(false); setIsAlertOpen(true); }}
                />
              </div>
            }
          >
            <Button
              size="large"
              fill
              icon="filter-list"
              text={t('statusDistribution')}
              endIcon="caret-down"
              className={styles.filterMenuBtn}
              aria-label={t('statusDistribution')}
            />
          </Popover>
        </div>
      </div>

      {/* Row 2: advanced filters + clear button */}
      <div className={styles.advancedRow}>
        {categories.length > 0 && (
          <div className={styles.advancedSelect}>
            <HTMLSelect
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              aria-label={t('filterByCategory')}
              fill={true}
              iconName='caret-down'
            >
              <option value="">{t('filterByCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </HTMLSelect>
          </div>
        )}

        {/* Tag filter — only shown when a project is selected and it has tags */}
        {selectedProjectId && projectTags.length > 0 && (
          <div className={styles.advancedSelect}>
            <HTMLSelect
              value={selectedTagIds[0] ?? ''}
              onChange={(e) => setSelectedTagIds(e.target.value ? [e.target.value] : [])}
              aria-label={t('filterByTag')}
              fill={true}
              iconName='caret-down'
            >
              <option value="">{t('filterByTag')}</option>
              {projectTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </HTMLSelect>
          </div>
        )}

        <div className={styles.advancedSelect}>
          <HTMLSelect
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'ALL')}
            aria-label={t('priority')}
            fill={true}
            iconName='caret-down'
          >
            <option value="ALL">{t('priority')}: {t('all')}</option>
            <option value="URGENT">{t('URGENT')}</option>
            <option value="HIGH">{t('HIGH')}</option>
            <option value="MEDIUM">{t('MEDIUM')}</option>
            <option value="LOW">{t('LOW')}</option>
          </HTMLSelect>
        </div>

        <Button
          icon="person"
          intent={onlyMyTasks ? Intent.PRIMARY : Intent.NONE}
          active={onlyMyTasks}
          variant={onlyMyTasks ? 'solid' : 'outlined'}
          className={styles.myTasksBtn}
          onClick={() => setOnlyMyTasks(!onlyMyTasks)}
          aria-pressed={onlyMyTasks}
          title={onlyMyTasks ? t('allTasks') : t('onlyMyTasks')}
        >
          {t('onlyMyTasks')}
        </Button>

        <Button
          icon="id-number"
          intent={onlyMyAssignments ? Intent.PRIMARY : Intent.NONE}
          active={onlyMyAssignments}
          variant={onlyMyAssignments ? 'solid' : 'outlined'}
          className={styles.myTasksBtn}
          onClick={() => setOnlyMyAssignments(!onlyMyAssignments)}
          aria-pressed={onlyMyAssignments}
          title={t('onlyMyAssignments')}
        >
          {t('onlyMyAssignments')}
        </Button>

        {(searchTerm !== '' || statusFilter !== 'ALL' || categoryId !== null || priorityFilter !== 'ALL' || onlyMyTasks || onlyMyAssignments || selectedTagIds.length > 0) && (
          <Button
            icon="filter-remove"
            intent={Intent.PRIMARY}
            variant="outlined"
            className={styles.clearFiltersBtn}
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setCategoryId(null);
              setPriorityFilter('ALL');
              setOnlyMyTasks(false);
              setOnlyMyAssignments(false);
              setSelectedTagIds([]);
            }}
            aria-label={t('clearFilters')}
            title={t('clearFilters')}
          >
            {t('clearFilters')}
          </Button>
        )}
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
