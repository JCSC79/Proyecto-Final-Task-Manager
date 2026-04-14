import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, NonIdealState, Button, Intent, Icon } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import api from '../api/axiosInstance';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskBoard } from '../components/tasks/TaskBoard';
import type { Task, TaskStatus } from '../types/task';
import styles from './pages.module.css';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');

  const { data: tasks, isLoading, isError, error, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks');
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
    <div className={styles.wrapper}>
      <Header
        progress={progressValue}
        activeView="home"
        setActiveView={(view) => view === 'dashboard' && navigate('/dashboard')}
      />

      <main className={styles.main}>
        {isError && (
          <div className={styles.errorWrapper}>
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
            <TaskForm />

            {isLoading ? (
              <div className={styles.loadingState}>
                <Spinner size={50} intent={Intent.PRIMARY} />
                <div className={styles.loadingLabel}>{t('syncing')}</div>
              </div>
            ) : (
              <TaskBoard tasks={filteredTasks} statusFilter={statusFilter} />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
