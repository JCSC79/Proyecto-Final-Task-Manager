import React, { useState } from 'react';
import { Button, H5, Icon } from '@blueprintjs/core';
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
  const ITEMS_PER_PAGE = 5;

  // NEW: Independent sorting state for each column
  const [sortOrders, setSortOrders] = useState<Record<TaskStatus, 'desc' | 'asc'>>({
    PENDING: 'desc',
    IN_PROGRESS: 'desc',
    COMPLETED: 'desc'
  });

  const [pages, setPages] = useState<Record<TaskStatus, number>>({
    PENDING: 1,
    IN_PROGRESS: 1,
    COMPLETED: 1
  });

  const setPage = (status: TaskStatus, newPage: number) => {
    setPages(prev => ({ ...prev, [status]: newPage }));
  };

  // Helper to toggle sort for a specific column
  const toggleSort = (status: TaskStatus) => {
    setSortOrders(prev => ({
      ...prev,
      [status]: prev[status] === 'desc' ? 'asc' : 'desc'
    }));
  };

  const renderColumn = (labelKey: string, status: TaskStatus) => {
    const currentSort = sortOrders[status];
    
    // Sort tasks locally for THIS column only
    const columnTasks = tasks
      .filter(task => task.status === status)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return currentSort === 'desc' ? dateB - dateA : dateA - dateB;
      });

    const totalPages = Math.ceil(columnTasks.length / ITEMS_PER_PAGE) || 1;
    const validPage = Math.min(pages[status], totalPages);
    
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    const paginatedTasks = columnTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    return (
      <div className={styles.column}>
        <div className={styles.columnHeader}>
          <div className={styles.headerInfo}>
            <H5 className={styles.columnTitle}>{t(labelKey)}</H5>
            <span className={styles.columnCount}>({columnTasks.length})</span>
          </div>
          <Button 
            variant="minimal" 
            icon={currentSort === 'desc' ? "sort-desc" : "sort-asc"} 
            onClick={() => toggleSort(status)}
            aria-label={currentSort === 'desc' ? t('sortNewest') : t('sortOldest')}
            title={currentSort === 'desc' ? t('sortNewest') : t('sortOldest')}
          >
            {/* sr-only text ensures WAVE detects accessible name regardless of Blueprint prop forwarding */}
            <span className="sr-only">{currentSort === 'desc' ? t('sortNewest') : t('sortOldest')}</span>
          </Button>
        </div>

        <div className={styles.taskList}>
          {paginatedTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
          {columnTasks.length === 0 && (
            <div className={styles.emptyColumn}>
              <Icon icon="inbox" size={30} />
              <p>{t('noTasks')}</p>
            </div>
          )}
        </div>

        <div className={styles.pagination}>
          <Button 
            icon="chevron-left" 
            disabled={validPage === 1} 
            onClick={() => setPage(status, validPage - 1)} 
            variant="minimal"
            aria-label={t('prev')}
          />
          <span className={styles.pageLabel}>{validPage} / {totalPages}</span>
          <Button 
            icon="chevron-right" 
            disabled={validPage === totalPages} 
            onClick={() => setPage(status, validPage + 1)} 
            variant="minimal"
            aria-label={t('next')}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.boardGrid}>
      {(statusFilter === 'ALL' || statusFilter === 'PENDING') && renderColumn('pending', 'PENDING')}
      {(statusFilter === 'ALL' || statusFilter === 'IN_PROGRESS') && renderColumn('inProgress', 'IN_PROGRESS')}
      {(statusFilter === 'ALL' || statusFilter === 'COMPLETED') && renderColumn('completed', 'COMPLETED')}
    </div>
  );
};
