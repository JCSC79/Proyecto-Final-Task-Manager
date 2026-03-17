import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from './api/axiosInstance';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { TaskFilters } from './components/tasks/TaskFilters';
import { TaskForm } from './components/tasks/TaskForm';
import { TaskBoard } from './components/tasks/TaskBoard'; // <--- Import the new component
import type { Task, TaskStatus } from './types/task';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook

/**
 * Main Application Component
 * Orchestrates data fetching, global filtering, and component layout.
 * Updated to use modular TaskBoard and i18n.
 */
const App: React.FC = () => {
  const { t } = useTranslation();

  // Global filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');

  // Fetch tasks from PostgreSQL via Backend API
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data;
    },
  });

  // Client-side filtering logic for search and status bar
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  // Calculate dynamic metrics for the Header progress bar
  const total = tasks?.length || 0;
  const completed = tasks?.filter(t => t.status === 'COMPLETED').length || 0;
  const progressValue = total > 0 ? completed / total : 0;

  return (
    <div style={{ backgroundColor: '#f5f8fa', minHeight: '100vh' }}>
      <Header progress={progressValue} />
      
      <main style={{ maxWidth: '1400px', margin: '20px auto', padding: '0 20px' }}>
        <div style={{ marginTop: '20px' }}>
          <TaskFilters 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <TaskForm />
        </div>

        {/* Translated Loading State */}
        {isLoading && <div style={{ textAlign: 'center', marginTop: '50px' }}>{t('syncing')}</div>}

        {/* The new modular TaskBoard component replaces the inline columns */}
        {!isLoading && (
          <TaskBoard tasks={filteredTasks} statusFilter={statusFilter} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;