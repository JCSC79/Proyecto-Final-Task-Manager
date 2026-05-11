import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, NonIdealState, Button, Intent, Icon, Dialog, DialogBody } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskBoard } from '../components/tasks/TaskBoard';
import type { Task, TaskStatus } from '../types/task';
import pageStyles from './pages.module.css';
import formStyles from '../components/tasks/TaskForm.module.css';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
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
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

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
              description={(error as Error)?.message || t('errorMessage')}
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
            <TaskFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />

            {isLoading ? (
              <div className={pageStyles.loadingState}>
                <Spinner size={50} intent={Intent.PRIMARY} />
                <div className={pageStyles.loadingLabel}>{t('syncing')}</div>
              </div>
            ) : (
              <TaskBoard tasks={filteredTasks} statusFilter={statusFilter} />
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
          <TaskForm onSuccess={() => setIsFormOpen(false)} />
        </DialogBody>
      </Dialog>

      <Footer />
    </div>
  );
};

export default HomePage;