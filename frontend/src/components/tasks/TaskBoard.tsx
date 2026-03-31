import React, { useState } from 'react';
import { Button, HTMLSelect } from '@blueprintjs/core';
import { TaskItem } from './TaskItem';
import type { Task, TaskStatus } from '../../types/task';
import { useTranslation } from 'react-i18next';
import styles from './TaskBoard.module.css';

interface TaskBoardProps {
  tasks: Task[];
  statusFilter: TaskStatus | 'ALL';
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, statusFilter }) => {
  const { t } = useTranslation();
  
  // Constants
  const ITEMS_PER_PAGE = 5;

  // Sorting state ('desc' = newest first, 'asc' = oldest first)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Independent pagination state for each column
  const [pages, setPages] = useState<Record<TaskStatus, number>>({
    PENDING: 1,
    IN_PROGRESS: 1,
    COMPLETED: 1
  });

  // Helper to update page for a specific column
  const setPage = (status: TaskStatus, newPage: number) => {
    setPages(prev => ({ ...prev, [status]: newPage }));
  };

  // Sort tasks globally before distributing to columns
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const renderColumn = (labelKey: string, status: TaskStatus) => {
    const columnTasks = sortedTasks.filter(task => task.status === status);
    const totalPages = Math.ceil(columnTasks.length / ITEMS_PER_PAGE) || 1;
    const currentPage = pages[status];

    // Ensure current page is within bounds (if tasks are deleted)
    const validPage = Math.min(currentPage, totalPages);
    
    // Slice tasks for current page
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    const paginatedTasks = columnTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    return (
      <div className={styles.column}>
        <h3 className={styles.columnHeader}>
          {t(labelKey)}
          <span className={styles.columnCount}>({columnTasks.length})</span>
        </h3>

        <div className={styles.columnScroll}>
          {paginatedTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
          {columnTasks.length === 0 && (
            <div className={styles.emptyColumn}>{t('noTasks')}</div>
          )}
        </div>

        <div className={styles.pagination}>
          <Button icon="chevron-left" text={t('prev')} disabled={validPage === 1} onClick={() => setPage(status, validPage - 1)} small />
          <span className={styles.pageLabel}>{t('page')} {validPage} {t('of')} {totalPages}</span>
          <Button rightIcon="chevron-right" text={t('next')} disabled={validPage === totalPages} onClick={() => setPage(status, validPage + 1)} small />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.sortBar}>
        <HTMLSelect
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
          minimal={false}
        >
          <option value="desc">{t('sortNewest')}</option>
          <option value="asc">{t('sortOldest')}</option>
        </HTMLSelect>
      </div>

      <div className={styles.board}>
        {(statusFilter === 'ALL' || statusFilter === 'PENDING') && renderColumn('pending', 'PENDING')}
        {(statusFilter === 'ALL' || statusFilter === 'IN_PROGRESS') && renderColumn('inProgress', 'IN_PROGRESS')}
        {(statusFilter === 'ALL' || statusFilter === 'COMPLETED') && renderColumn('completed', 'COMPLETED')}
      </div>
    </div>
  );
};