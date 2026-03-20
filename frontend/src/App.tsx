import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from './api/axiosInstance';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { TaskFilters } from './components/tasks/TaskFilters';
import { TaskForm } from './components/tasks/TaskForm';
import { TaskBoard } from './components/tasks/TaskBoard';
import { DashboardView } from './components/dashboard/DashboardView';
import type { Task, TaskStatus } from './types/task';
import { useTranslation } from 'react-i18next';

// BLUEPRINT COMPONENTS: UI refinement for Phase 3 
import { Spinner, NonIdealState, Button, Intent, Icon } from '@blueprintjs/core';
import { AppToaster } from './utils/toaster'; 

/**
 * App Component
 * Core container managing global state, theme, and data fetching.
 * Aligned with Phase 3: Frontend React + Vite + TanStack Query.
 */
const App: React.FC = () => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [isDark, setIsDark] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'dashboard'>('home');

  // THEME EFFECT: Manages BlueprintJS dark theme classes and body background
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('bp4-dark');
      document.body.style.backgroundColor = '#202b33'; 
    } else {
      document.body.classList.remove('bp4-dark');
      document.body.style.backgroundColor = '#f5f8fa'; 
    }
  }, [isDark]);

  // DATA FETCHING: Server state management using TanStack Query (Phase 3)
  const { data: tasks, isLoading, isError, error, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data;
    },
    // ERROR HANDLING: Triggers global toaster on failure (Phase 1/3 integration)
    meta: {
      onError: (err: Error) => {
        AppToaster.show({
          message: `${t('errorLoadingTasks')}: ${err.message}`,
          intent: Intent.DANGER, 
          icon: "error"
        });
      }
    }
  });

  /**
   * NAVIGATION: Handles dashboard interactions to filter and switch views
   */
  const handleDashboardClick = (status: TaskStatus) => {
    setSearchTerm('');
    setStatusFilter(status);
    setActiveView('home');
  };

  // MEMOIZED FILTERING: Optimization for task list display
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  // KPI CALCULATIONS: Shared metrics for Header and Dashboard
  const total = tasks?.length || 0;
  const completed = tasks?.filter(t => t.status === 'COMPLETED').length || 0;
  const progressValue = total > 0 ? completed / total : 0;

  return (
    <div className={isDark ? "bp4-dark" : ""} style={{ minHeight: '100vh', color: isDark ? '#f5f8fa' : '#182026' }}>
      <Header 
        progress={progressValue} 
        isDark={isDark} 
        toggleDark={() => setIsDark(!isDark)} 
        activeView={activeView}
        setActiveView={setActiveView}
      />
      
      <main style={{ maxWidth: '1400px', margin: '20px auto', padding: '0 20px' }}>
        
        {/* REFINED ERROR STATE: Noticeable alert style (Phase 3 refinement) */}
        {isError && (
          <div style={{ 
            marginTop: '80px', 
            padding: '40px', 
            border: `1px solid ${isDark ? '#5c2526' : '#f5e0e0'}`, 
            borderRadius: '12px', 
            backgroundColor: isDark ? '#29333a' : '#fff1f1', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
          }}>
            <NonIdealState
              icon={
                <div style={{ padding: '15px', borderRadius: '50%', backgroundColor: '#f5e0e0', color: '#c23030', display: 'inline-flex' }}>
                   <Icon icon="warning-sign" size={60} intent={Intent.DANGER} />
                </div>
              } 
              title={<span style={{ color: Intent.DANGER }}>{t('errorTitle')}</span>} 
              description={<div style={{ marginTop: '10px', fontSize: '1.1em' }}>{(error as Error)?.message || t('errorMessage')}</div>}
              action={
                <Button 
                  intent={Intent.PRIMARY} 
                  icon="refresh" 
                  onClick={() => refetch()}
                  large
                  style={{ marginTop: '20px' }}
                >
                  {t('retry')}
                </Button>
              }
            />
          </div>
        )}

        {/* HOME VIEW: Kanban Board and Filters */}
        {activeView === 'home' && !isError && (
          <>
            <div style={{ marginTop: '20px' }}>
              {/* FIXED: Added isDark prop to satisfy TypeScript and TaskFilters requirements */}
              <TaskFilters 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                isDark={isDark} 
              />
              <TaskForm isDark={isDark} />
            </div>

            {/* LOADING STATE: Using Blueprint Spinner (Phase 3 refinement)  */}
            {isLoading ? (
              <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <Spinner size={50} intent={Intent.PRIMARY} />
                <div style={{ marginTop: '15px', fontWeight: 500 }}>{t('syncing')}</div>
              </div>
            ) : (
              <TaskBoard tasks={filteredTasks} statusFilter={statusFilter} isDark={isDark} />
            )}
          </>
        )}

        {/* DASHBOARD VIEW: Analytics and Charts */}
        {activeView === 'dashboard' && !isError && (
          <DashboardView 
            tasks={tasks || []} 
            isDark={isDark} 
            onChartClick={handleDashboardClick}
          />
        )}

      </main>

      <Footer isDark={isDark} />
    </div>
  );
};

export default App;