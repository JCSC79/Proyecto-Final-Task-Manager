import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosInstance';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { DashboardView } from '../components/dashboard/DashboardView';
import type { Task, TaskStatus } from '../types/task';
import styles from './pages.module.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/api/tasks');
      return response.data as Task[];
    },
  });

  const total = tasks?.length ?? 0;
  const completed = tasks?.filter(t => t.status === 'COMPLETED').length ?? 0;
  const progressValue = total > 0 ? completed / total : 0;

  const handleChartClick = (status: TaskStatus) => {
    // Navigate to home and the filter will be applied via state if needed
    // For now, navigate home — filter state can be lifted later
    navigate('/', { state: { statusFilter: status } });
  };

  return (
    <div className={styles.wrapper}>
      <Header
        progress={progressValue}
        activeView="dashboard"
        setActiveView={(view) => view === 'home' && navigate('/')}
      />

      <main className={styles.main}>
        {/* sr-only h1 satisfies WCAG: every page must have a first-level heading */}
        <h1 className="sr-only">{t('kpiDashboard')}</h1>
        <DashboardView
          tasks={tasks ?? []}
          onChartClick={handleChartClick}
        />
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;
