import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Spinner, NonIdealState, Button, Intent, Icon, Dialog, DialogBody } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosInstance';
import { downloadTasksPdf } from '../api/task.api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useUnreadComments } from '../hooks/useUnreadComments';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { ProjectSelector } from '../components/tasks/ProjectSelector';
import type { Task, TaskStatus, TaskPriority } from '../types/task';
import type { IComment } from '../api/comment.api';
import pageStyles from './pages.module.css';
import formStyles from '../components/tasks/TaskForm.module.css';

const HomePageInner: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // Socket.IO: receive real-time comments and mark tasks as unread
  const { markUnread, markRead, hasUnread, unreadCount } = useUnreadComments();
  const queryClient = useQueryClient();
  useSocket({
    onNewComment: (comment: IComment) => {
      // Only mark unread for comments from OTHER users
      if (comment.userId !== user?.id) {
        markUnread(comment.taskId);
      }
    },
    onTaskUpdated: (updatedTask) => {
      queryClient.setQueryData<Task[]>(['tasks'], (prev) => {
        if (!prev) {
          return prev;
        }
        const exists = prev.some(t => t.id === updatedTask.id);
        // New task (create) -> append; existing task (update) -> replace
        return exists
          ? prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t)
          : [...prev, updatedTask];
      });
    },
    onTaskDeleted: ({ id }) => {
      queryClient.setQueryData<Task[]>(['tasks'], (prev) =>
        prev ? prev.filter(t => t.id !== id) : prev
      );
    },
    onProjectCreated: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onProjectDeleted: ({ id }) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      // If the deleted project was selected, reset to "All projects"
      setSelectedProjectId(prev => prev === id ? null : prev);
    },
    onProjectMembersChanged: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
  // Initialize statusFilter from navigation state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>(
    () => (location.state as { statusFilter?: TaskStatus } | null)?.statusFilter ?? 'ALL'
  );

  // Only clear the navigation state — no setState here to avoid cascading renders
  useEffect(() => {
    const state = location.state as { statusFilter?: TaskStatus } | null;
    if (state?.statusFilter) {
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, navigate]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: tasks, isLoading, isError, error, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/api/tasks');
      return response.data as Task[];
    },
  });

  const filteredTasks = useMemo(() => {
    if (!tasks) {
      return [];
    }
    return tasks.filter(task => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchesProject = selectedProjectId === null || task.projectId === selectedProjectId;
      const matchesCategory = categoryId === null || task.categoryId === categoryId;
      const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
      const matchesOwner = !onlyMyTasks || task.userId === user?.id;
      return matchesSearch && matchesStatus && matchesProject && matchesCategory && matchesPriority && matchesOwner;
    });
  }, [tasks, searchTerm, statusFilter, selectedProjectId, categoryId, priorityFilter, onlyMyTasks, user?.id]);

  const total = tasks?.length ?? 0;
  const completed = tasks?.filter(t => t.status === 'COMPLETED').length ?? 0;
  const progressValue = total > 0 ? completed / total : 0;

  return (
    <div className={pageStyles.wrapper}>
      <Header
        progress={progressValue}
        activeView="home"
        setActiveView={(view) => view === 'dashboard' && navigate('/dashboard')}
      />

      <main className={pageStyles.main}>
        {/* sr-only h1 satisfies WCAG: every page must have a first-level heading */}
        <h1 className="sr-only">{t('appName')}</h1>
        {isError && (
          <div className={pageStyles.errorWrapper}>
            <NonIdealState
              icon={<Icon icon="warning-sign" size={60} intent={Intent.DANGER} />}
              title={t('errorTitle')}
              description={error?.message || t('errorMessage')}
              action={
                <Button intent={Intent.PRIMARY} icon="refresh" onClick={() => refetch()} size="large">
                  {t('retry')}
                </Button>
              }
            />
          </div>
        )}

        {!isError && (
          <>
            <ProjectSelector
              selectedProjectId={selectedProjectId}
              onSelect={setSelectedProjectId}
            />

            <TaskFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              onlyMyTasks={onlyMyTasks}
              setOnlyMyTasks={setOnlyMyTasks}
            />

            {isLoading ? (
              <div className={pageStyles.loadingState}>
                <Spinner size={50} intent={Intent.PRIMARY} />
                <div className={pageStyles.loadingLabel}>{t('syncing')}</div>
              </div>
            ) : (
              <>
                <div className={pageStyles.boardActions}>
                  <Button
                    icon="import"
                    intent={Intent.PRIMARY}
                    variant="outlined"
                    onClick={() => { void downloadTasksPdf(user?.lang ?? 'en'); }}
                    disabled={!tasks || tasks.length === 0}
                  >
                    {t('exportPdf')}
                  </Button>
                </div>
                <TaskBoard tasks={filteredTasks} statusFilter={statusFilter} hasUnread={hasUnread} unreadCount={unreadCount} onRead={markRead} />
              </>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button - FAB */}
      <div className={formStyles.fabContainer}>
        <Button
          className={formStyles.fab}
          intent={Intent.PRIMARY}
          icon={<Icon icon="add" size={25} />}
          onClick={() => setIsFormOpen(true)}
          aria-label={t('createTask')}
        >
          {/* <span className="sr-only">{t('createTask')}</span> */}
        </Button>
      </div>

      {/* Create Task Modal */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t('createTask')}
        icon="add"
        className={pageStyles.taskDialog}
      >
        <DialogBody>
          <TaskForm
            onSuccess={() => setIsFormOpen(false)}
            defaultProjectId={selectedProjectId ?? undefined}
          />
        </DialogBody>
      </Dialog>

      <Footer />
    </div>
  );
};

export default HomePageInner;