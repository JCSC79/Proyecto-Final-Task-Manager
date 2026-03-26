import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from './api/axiosInstance';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { TaskFilters } from './components/tasks/TaskFilters';
import { TaskForm } from './components/tasks/TaskForm';
import { TaskBoard } from './components/tasks/TaskBoard';
import { DashboardView } from './components/dashboard/DashboardView';
import { AdminView } from './views/AdminView';
import { ProfileModal } from './components/profile/ProfileModal';
import { LoginView } from './views/LoginView'; 
import type { Task, TaskStatus } from './types/task';
import { useTranslation } from 'react-i18next';

// BLUEPRINT COMPONENTS
import { Spinner, NonIdealState, Button, Intent, Icon } from '@blueprintjs/core';

interface AxiosErrorResponse {
  response?: {
    status: number;
    data?: { error?: string };
  };
  message: string;
}

/**
 * Main Application Component - Hardened Version
 */
const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, login, logout, updateProfile } = useAuth();

  // UI PERSISTENCE
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'dashboard' | 'admin'>('home');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.body.className = isDark ? 'bp4-dark' : '';
    document.body.style.backgroundColor = isDark ? '#202b33' : '#f5f8fa';
  }, [isDark]);

  const { data: tasks, isLoading, isError, error, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const progress = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    return completed / tasks.length;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  const handleDashboardClick = (status: TaskStatus) => {
    setSearchTerm('');
    setStatusFilter(status);
    setActiveView('home');
  };

  if (!isAuthenticated) {
    return (
      <div className={isDark ? "bp4-dark" : ""} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: isDark ? '#202b33' : '#f5f8fa' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px', gap: '10px' }}>
          <Button className="bp4-minimal" icon="translate" text={i18n.language.toUpperCase()} onClick={() => i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es')} large />
          <Button className="bp4-minimal" icon={isDark ? "flash" : "moon"} onClick={() => setIsDark(!isDark)} large />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoginView onLoginSuccess={login} />
        </div>
        <Footer isDark={isDark} />
      </div>
    );
  }

  return (
    <div className={isDark ? "bp4-dark" : ""} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header 
        progress={progress} 
        isDark={isDark} 
        toggleDark={() => setIsDark(!isDark)} 
        activeView={activeView === 'admin' ? 'dashboard' : activeView}
        setActiveView={setActiveView}
        userEmail={user?.email || ''}
        userName={user?.name || null}
        userAvatar={user?.avatar_url || null}
        userRole={user?.role || 'USER'}
        onLogout={logout}
        onEditProfile={() => setIsProfileModalOpen(true)}
      />
      
      <main style={{ flex: 1, padding: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {isError && (
          <NonIdealState
            icon={<Icon icon="warning-sign" size={60} intent={Intent.DANGER} />} 
            title={t('errorTitle')} 
            description={(error as AxiosErrorResponse)?.message || t('errorMessage')}
            action={<Button intent={Intent.PRIMARY} icon="refresh" onClick={() => refetch()} text={t('retry')} />}
          />
        )}

        {/* SECURITY GATE: HARDENED RENDER */}
        {activeView === 'admin' && (
          user?.role === 'ADMIN' ? (
            <AdminView />
          ) : (
            <NonIdealState 
              icon={<Icon icon="shield" intent={Intent.DANGER} size={60} />}
              title="Acceso Restringido"
              description="No tienes permisos de administrador verificados."
              action={<Button intent={Intent.PRIMARY} text="Volver al Inicio" onClick={() => setActiveView('home')} />}
            />
          )
        )}

        {activeView === 'home' && !isError && (
          <>
            <TaskFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} isDark={isDark} />
            <TaskForm isDark={isDark} />
            {isLoading ? <Spinner size={50} /> : <TaskBoard tasks={filteredTasks} statusFilter={statusFilter} isDark={isDark} />}
          </>
        )}

        {activeView === 'dashboard' && !isError && <DashboardView tasks={tasks || []} isDark={isDark} onChartClick={handleDashboardClick} />}
      </main>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)}
        currentName={user?.name || ''}
        currentRole={user?.role || 'USER'}
        onUpdateSuccess={updateProfile}
        isDark={isDark}
      />

      <Footer isDark={isDark} />
    </div>
  );
};

export default App;