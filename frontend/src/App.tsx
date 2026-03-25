import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api/axiosInstance';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { TaskFilters } from './components/tasks/TaskFilters';
import { TaskForm } from './components/tasks/TaskForm';
import { TaskBoard } from './components/tasks/TaskBoard';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProfileModal } from './components/profile/ProfileModal'; // NEW
import { LoginView } from './views/LoginView'; 
import type { Task, TaskStatus } from './types/task';
import { useTranslation } from 'react-i18next';

// BLUEPRINT COMPONENTS
import { Spinner, NonIdealState, Button, Intent, Icon } from '@blueprintjs/core';
import { AppToaster } from './utils/toaster'; 

interface UserProfile {
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
}

interface AxiosErrorResponse {
  response?: {
    status: number;
    data?: { error?: string };
  };
  message: string;
}

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // AUTH & PROFILE STATE
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('userEmail'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));
  const [userAvatar, setUserAvatar] = useState<string | null>(localStorage.getItem('userAvatar'));
  
  // UI PERSISTENCE
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // NEW Phase 5

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [activeView, setActiveView] = useState<'home' | 'dashboard'>('home');

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.body.classList.add('bp4-dark');
      document.body.style.backgroundColor = '#202b33'; 
    } else {
      document.body.classList.remove('bp4-dark');
      document.body.style.backgroundColor = '#f5f8fa'; 
    }
  }, [isDark]);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const { data: tasks, isLoading, isError, error, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data;
    },
    enabled: !!token,
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatar');
    setToken(null);
    setUserEmail(null);
    setUserName(null);
    setUserAvatar(null);
    queryClient.clear();
    AppToaster.show({ message: "Logged out", intent: Intent.WARNING, icon: "log-out" });
  };

  const handleLoginSuccess = (newToken: string, profile: UserProfile) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', profile.email);
    localStorage.setItem('userName', profile.name || '');
    localStorage.setItem('userAvatar', profile.avatar_url || '');
    
    setToken(newToken);
    setUserEmail(profile.email);
    setUserName(profile.name);
    setUserAvatar(profile.avatar_url);
  };

  // Phase 5: Handler for successful profile update
  const handleUpdateName = (newName: string) => {
    localStorage.setItem('userName', newName);
    setUserName(newName);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const progress = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    return completed / tasks.length;
  }, [tasks]);

  const handleDashboardClick = (status: TaskStatus) => {
    setSearchTerm('');
    setStatusFilter(status);
    setActiveView('home');
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  if (!token) {
    return (
      <div className={isDark ? "bp4-dark" : ""} style={{ 
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        backgroundColor: isDark ? '#202b33' : '#f5f8fa'
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px', gap: '10px' }}>
          <Button className="bp4-minimal" icon="translate" text={i18n.language.toUpperCase()} onClick={toggleLanguage} large />
          <Button className="bp4-minimal" icon={isDark ? "flash" : "moon"} onClick={() => setIsDark(!isDark)} large />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoginView onLoginSuccess={handleLoginSuccess} />
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
        activeView={activeView}
        setActiveView={setActiveView}
        userEmail={userEmail || ''}
        userName={userName}
        userAvatar={userAvatar}
        onLogout={handleLogout}
        onEditProfile={() => setIsProfileModalOpen(true)} // NEW
      />
      
      <main style={{ flex: 1, padding: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {isError && (
          <div style={{ padding: '40px', border: `1px solid ${isDark ? '#5c2526' : '#f5e0e0'}`, borderRadius: '12px', backgroundColor: isDark ? '#29333a' : '#fff1f1' }}>
            <NonIdealState
              icon={<Icon icon="warning-sign" size={60} intent={Intent.DANGER} />} 
              title={t('errorTitle')} 
              description={(error as AxiosErrorResponse)?.message || t('errorMessage')}
              action={<Button intent={Intent.PRIMARY} icon="refresh" onClick={() => refetch()} text={t('retry')} />}
            />
          </div>
        )}

        {activeView === 'home' && !isError && (
          <>
            <TaskFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} isDark={isDark} />
            <TaskForm isDark={isDark} />
            {isLoading ? (
              <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <Spinner size={50} intent={Intent.PRIMARY} />
              </div>
            ) : (
              <TaskBoard tasks={filteredTasks} statusFilter={statusFilter} isDark={isDark} />
            )}
          </>
        )}

        {activeView === 'dashboard' && !isError && <DashboardView tasks={tasks || []} isDark={isDark} onChartClick={handleDashboardClick} />}
      </main>

      {/* Phase 5: Profile Editing Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)}
        currentName={userName || ''}
        onUpdateSuccess={handleUpdateName}
        isDark={isDark}
      />

      <Footer isDark={isDark} />
    </div>
  );
};

export default App;