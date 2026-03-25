import React, { useState } from 'react';
import { Button, HTMLSelect, NonIdealState, Icon, Intent } from "@blueprintjs/core";
import { TaskItem } from './TaskItem';
import type { Task, TaskStatus } from '../../types/task';
import { useTranslation } from 'react-i18next';

interface TaskBoardProps {
  tasks: Task[];
  statusFilter: TaskStatus | 'ALL';
  isDark: boolean;
}

/**
 * TaskBoard Component
 * Updated for Phase 6: Added user-specific cleanup functionality.
 * Maintains Phase 4: Non-Ideal States for empty boards.
 * Maintains Phase 3: Fixed heights, independent column pagination, and sorting.
 */
export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, statusFilter, isDark }) => {
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

  /**
   * USER-SPECIFIC CLEANUP (NEW PHASE 6)
   * Calls the new /tasks/cleanup endpoint which doesn't require ADMIN role.
   */


  // Sort tasks globally before distributing to columns
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // --- NEW UX LOGIC: EMPTY STATES ---
  
  // 1. Check if the board is completely empty for this user (at 'ALL' filter level)
  if (tasks.length === 0 && statusFilter === 'ALL') {
    return (
      <div style={{ marginTop: '80px', padding: '40px' }}>
        <NonIdealState
          icon={<Icon icon="clipboard" size={60} intent={Intent.PRIMARY} />}
          title={t('noTasksTitle')}
          description={t('noTasksDescription')}
        />
      </div>
    );
  }

  // 2. Check if there are no results for a specific filter
  if (tasks.length === 0) {
    return (
      <div style={{ marginTop: '80px', padding: '40px' }}>
        <NonIdealState
          icon={<Icon icon="search" size={60} />}
          title={t('noResultsTitle')}
          description={t('noResultsDescription')}
        />
      </div>
    );
  }

  const renderColumn = (labelKey: string, status: TaskStatus) => {
    const columnTasks = sortedTasks.filter(task => task.status === status);
    const totalPages = Math.ceil(columnTasks.length / ITEMS_PER_PAGE) || 1;
    const currentPage = pages[status];

    const validPage = Math.min(currentPage, totalPages);
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    const paginatedTasks = columnTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    return (
      <div style={{ 
        flex: 1, 
        minWidth: '300px', 
        backgroundColor: isDark ? '#293742' : '#ebf1f5', 
        padding: '15px', 
        borderRadius: '8px',
        height: '580px', 
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.3s ease'
      }}>
        <h3 style={{ 
          borderBottom: '2px solid #5c7080', 
          paddingBottom: '10px', 
          marginBottom: '15px',
          color: isDark ? '#f5f8fa' : '#182026',
          display: 'flex',
          justifyContent: 'space-between',
          transition: 'color 0.3s ease',
          flexShrink: 0 
        }}>
          {t(labelKey)} 
          <span style={{ fontSize: '0.8em', color: '#5c7080' }}>({columnTasks.length})</span>
        </h3>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          {paginatedTasks.map((task) => (
            <TaskItem key={task.id} task={task} isDark={isDark} />
          ))}
          {columnTasks.length === 0 && (
            <div style={{ textAlign: 'center', color: '#a7b6c2', marginTop: '20px', fontStyle: 'italic' }}>
              {t('noTasks')}
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingTop: '15px',
          borderTop: `1px solid ${isDark ? '#394b59' : '#dbe3e8'}`,
          marginTop: 'auto', 
          flexShrink: 0
        }}>
          <Button 
            icon="chevron-left" 
            text={t('prev')} 
            disabled={validPage === 1} 
            onClick={() => setPage(status, validPage - 1)}
            small
          />
          <span style={{ fontSize: '12px', color: isDark ? '#a7b6c2' : '#5c7080' }}>
            {t('page')} {validPage} {t('of')} {totalPages}
          </span>
          <Button 
            rightIcon="chevron-right" 
            text={t('next')} 
            disabled={validPage === totalPages} 
            onClick={() => setPage(status, validPage + 1)}
            small
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', gap: '10px' }}>
        {/* NEW BUTTON FOR PHASE 6 CLEANUP */}
        <HTMLSelect 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
          className={isDark ? "bp4-dark" : ""}
          style={{ 
            backgroundColor: isDark ? '#293742' : '#ffffff', 
            color: isDark ? '#f5f8fa' : '#182026',           
            boxShadow: isDark ? '0 0 0 1px rgba(16, 22, 26, 0.4)' : 'none' 
          }}
        >
          <option value="desc">{t('sortNewest')}</option>
          <option value="asc">{t('sortOldest')}</option>
        </HTMLSelect>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'flex-start',
        overflowX: 'auto',
        paddingBottom: '20px'
      }}>
        {(statusFilter === 'ALL' || statusFilter === 'PENDING') && renderColumn('pending', 'PENDING')}
        {(statusFilter === 'ALL' || statusFilter === 'IN_PROGRESS') && renderColumn('inProgress', 'IN_PROGRESS')}
        {(statusFilter === 'ALL' || statusFilter === 'COMPLETED') && renderColumn('completed', 'COMPLETED')}
      </div>
    </div>
  );
};