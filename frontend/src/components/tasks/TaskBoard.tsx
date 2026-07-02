import React, { useState } from 'react';
import { Button, H2, Icon } from '@blueprintjs/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { TaskItem } from './TaskItem';
import type { Task, TaskStatus } from '../../types/task';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import styles from './TaskBoard.module.css';

// Registers a column div as a valid dnd-kit drop target.
// Must be a component (not inline) so the hook runs at the top level.
const DroppableColumn: React.FC<{
  id: string;
  isOver: boolean;
  children: React.ReactNode;
}> = ({ id, isOver, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnDropTarget : ''}`}
    >
      {children}
    </div>
  );
};

interface TaskBoardProps {
  tasks: Task[];
  statusFilter: TaskStatus | 'ALL';
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, statusFilter }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isDesktop = useMediaQuery('(min-width: 1081px)');
  const ITEMS_PER_PAGE = 5;

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 5px threshold — lower = more responsive drag initiation
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    setOverColumnId(null);
    const { active, over } = event;
    if (!over) {
      return;
    }

    const overId = String(over.id);
    // over.id is either a column status ('PENDING'|'IN_PROGRESS'|'COMPLETED')
    // or another task's id — resolve the column from that task's status
    const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    const newStatus: TaskStatus | undefined = STATUSES.includes(overId as TaskStatus)
      ? (overId as TaskStatus)
      : tasks.find(t => t.id === overId)?.status;

    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask || !newStatus || draggedTask.status === newStatus) {
      return;
    }

    // Optimistic update — move the task in the cache immediately
    queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
      old.map(t => t.id === draggedTask.id ? { ...t, status: newStatus } : t)
    );

    try {
      await api.patch(`/api/tasks/${draggedTask.id}`, { status: newStatus });
    } catch {
      // Rollback on failure
      queryClient.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.map(t => t.id === draggedTask.id ? { ...t, status: draggedTask.status } : t)
      );
    }
  };

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
    const taskIds = paginatedTasks.map(t => t.id);

    const columnInner = (
      <>
        <div className={styles.columnHeader}>
          <div className={styles.headerInfo}>
            <H2 className={styles.columnTitle}>{t(labelKey)}</H2>
            <span className={styles.columnCount}>({columnTasks.length})</span>
          </div>
          <Button
            variant="minimal"
            icon={currentSort === 'desc' ? "sort-desc" : "sort-asc"}
            onClick={() => toggleSort(status)}
            aria-label={currentSort === 'desc' ? t('sortNewest') : t('sortOldest')}
          >
            <span className="sr-only">{currentSort === 'desc' ? t('sortNewest') : t('sortOldest')}</span>
          </Button>
        </div>

        <div className={styles.taskList}>
          {paginatedTasks.map((task) => (
            <TaskItem key={task.id} task={task} isDragEnabled={isDesktop} />
          ))}
          {columnTasks.length === 0 && (
            <div className={styles.emptyColumn}>
              <Icon icon="inbox" size={30} />
              <p>{t('noTasks')}</p>
            </div>
          )}
        </div>

        <div className={styles.pagination}>
          {totalPages > 2 && (
            <Button
              icon="double-chevron-left"
              disabled={validPage === 1}
              onClick={() => setPage(status, 1)}
              variant="minimal"
              aria-label={t('firstPage')}
            />
          )}
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
          {totalPages > 2 && (
            <Button
              icon="double-chevron-right"
              disabled={validPage === totalPages}
              onClick={() => setPage(status, totalPages)}
              variant="minimal"
              aria-label={t('lastPage')}
            />
          )}
        </div>
      </>
    );

    if (!isDesktop) {
      return <div className={styles.column}>{columnInner}</div>;
    }

    return (
      <SortableContext key={status} items={taskIds} strategy={verticalListSortingStrategy}>
        <DroppableColumn id={status} isOver={overColumnId === status}>
          {columnInner}
        </DroppableColumn>
      </SortableContext>
    );
  };

  const boardGrid = (
    <div className={styles.boardGrid}>
      {(statusFilter === 'ALL' || statusFilter === 'PENDING') && renderColumn('pending', 'PENDING')}
      {(statusFilter === 'ALL' || statusFilter === 'IN_PROGRESS') && renderColumn('inProgress', 'IN_PROGRESS')}
      {(statusFilter === 'ALL' || statusFilter === 'COMPLETED') && renderColumn('completed', 'COMPLETED')}
    </div>
  );

  if (!isDesktop) {
    return boardGrid;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={(e) => {
        const overId = e.over ? String(e.over.id) : null;
        const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
        if (overId && STATUSES.includes(overId as TaskStatus)) {
          setOverColumnId(overId);
        } else {
          const overTask = tasks.find(t => t.id === overId);
          setOverColumnId(overTask?.status ?? null);
        }
      }}
      onDragEnd={(e) => { void handleDragEnd(e); }}
    >
      {boardGrid}
      <DragOverlay>
        {activeTask ? <TaskItem task={activeTask} isDragEnabled={false} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
