import React from 'react';
import { TaskItem } from './TaskItem';
import type { Task, TaskStatus } from '../../types/task';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook

interface TaskBoardProps {
  tasks: Task[];
  statusFilter: TaskStatus | 'ALL';
}

/**
 * TaskBoard Component
 * Handles the rendering of the Kanban columns and distributes tasks.
 * Extracted from App.tsx for better modularity.
 */
export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, statusFilter }) => {
  const { t } = useTranslation();

  /**
   * Helper function to render a single Kanban column
   */
  const renderColumn = (labelKey: string, status: TaskStatus) => {
    const columnTasks = tasks.filter(task => task.status === status);
    
    return (
      <div style={{ 
        flex: 1, 
        minWidth: '300px', 
        backgroundColor: '#ebf1f5', 
        padding: '15px', 
        borderRadius: '8px',
        minHeight: '400px'
      }}>
        <h3 style={{ 
          borderBottom: '2px solid #5c7080', 
          paddingBottom: '10px', 
          marginBottom: '15px',
          color: '#182026',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {/* Dynamically translated column title */}
          {t(labelKey)} 
          <span style={{ fontSize: '0.8em', color: '#5c7080' }}>({columnTasks.length})</span>
        </h3>
        
        <div>
          {columnTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
          {columnTasks.length === 0 && (
            <div style={{ textAlign: 'center', color: '#a7b6c2', marginTop: '20px', fontStyle: 'italic' }}>
              {t('noTasks')}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      marginTop: '30px',
      alignItems: 'flex-start',
      overflowX: 'auto',
      paddingBottom: '20px'
    }}>
      {(statusFilter === 'ALL' || statusFilter === 'PENDING') && renderColumn('pending', 'PENDING')}
      {(statusFilter === 'ALL' || statusFilter === 'IN_PROGRESS') && renderColumn('inProgress', 'IN_PROGRESS')}
      {(statusFilter === 'ALL' || statusFilter === 'COMPLETED') && renderColumn('completed', 'COMPLETED')}
    </div>
  );
};