import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchAdminUsers, updateUserRole, blockUser, deleteUser, fetchAdminAnalytics, type AdminAnalytics } from '../api/admin.api';
import type { IUserWithStats } from '../types/admin';
import { AppToaster } from '../utils/toaster';
import { Intent } from '@blueprintjs/core';
import { useSocket } from './useSocket';

// Reusable type for our sorting system
export type SortColumn = 'name' | 'email' | 'total' | 'pending' | 'inProgress' | 'completed' | 'rate';

/**
 * Custom Hook: useAdminDashboard
 * Encapsulates all data fetching, filtering, sorting, and pagination logic.
 */
export const useAdminDashboard = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // UI STATE
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<{ column: SortColumn; direction: 'asc' | 'desc' }>({
    column: 'name',
    direction: 'asc'
  });
  const [pendingChange, setPendingChange] = useState<{ user: IUserWithStats; targetRole: 'ADMIN' | 'USER' } | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUserWithStats | null>(null);
  const [userToDelete, setUserToDelete] = useState<IUserWithStats | null>(null);
  const [userToBlock, setUserToBlock] = useState<IUserWithStats | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<'7' | '30' | '90' | 'all'>('all');

  const pageSize = 10;

  // DATA FETCHING
  const { data: users = [], isLoading, isError } = useQuery<IUserWithStats[]>({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    retry: 1,
    staleTime: 30_000,
  });

  const { data: analytics } = useQuery<AdminAnalytics>({
    queryKey: ['admin-analytics', analyticsRange],
    queryFn: () => fetchAdminAnalytics(analyticsRange),
    staleTime: 60_000,
  });

  // Real-time: refresh all admin data on any relevant change
  useSocket({
    onUserRegistered: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onTaskUpdated: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onTaskDeleted: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
    onProjectDeleted: () => {
      // Project deletion cascades tasks — stats, KPIs and analytics all change
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });

  // ACTIONS
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'ADMIN' | 'USER' }) =>
      updateUserRole(userId, role),
    onSuccess: (_, { role }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      AppToaster.show({
        message: role === 'ADMIN' ? t('adminPromoted') : t('adminDemoted'),
        intent: Intent.SUCCESS,
        icon: 'people',
      });
      setPendingChange(null);
    },
    onError: (err: Error) => {
      AppToaster.show({ message: err.message, intent: Intent.DANGER, icon: 'warning-sign' });
      setPendingChange(null);
    },
  });

  const blockMutation = useMutation({
    mutationFn: ({ userId, blocked }: { userId: string; blocked: boolean }) =>
      blockUser(userId, blocked),
    onSuccess: (_, { blocked }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      AppToaster.show({
        message: blocked ? t('userBlocked') : t('userUnblocked'),
        intent: blocked ? Intent.DANGER : Intent.SUCCESS,
        icon: blocked ? 'lock' : 'unlock',
      });
      setUserToBlock(null);
    },
    onError: (err: Error) => {
      AppToaster.show({ message: err.message, intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      AppToaster.show({
        message: t('userDeleted'),
        intent: Intent.DANGER,
        icon: 'trash',
      });
      setUserToDelete(null);
    },
    onError: (err: Error) => {
      AppToaster.show({ message: err.message, intent: Intent.DANGER, icon: 'warning-sign' });
    },
  });

  // LOGIC: SORTING AND FILTERING
  const handleSort = (column: SortColumn) => {
    const isSameColumn = sort.column === column;
    setSort({
      column,
      direction: isSameColumn && sort.direction === 'asc' ? 'desc' : 'asc'
    });
    setCurrentPage(1);
  };

  const sortedAndFilteredUsers = useMemo(() => {
    const filtered = users.filter(u => {
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesSearch = search === '' ||
        (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sort.column) {
        case 'email': valA = a.email.toLowerCase(); valB = b.email.toLowerCase(); break;
        case 'total': valA = a.stats.total; valB = b.stats.total; break;
        case 'pending': valA = a.stats.pending; valB = b.stats.pending; break;
        case 'inProgress': valA = a.stats.inProgress; valB = b.stats.inProgress; break;
        case 'completed': valA = a.stats.completed; valB = b.stats.completed; break;
        case 'rate': valA = a.stats.completionRate; valB = b.stats.completionRate; break;
        case 'name':
        default:
          valA = (a.name ?? a.email).toLowerCase();
          valB = (b.name ?? b.email).toLowerCase();
      }

      if (valA < valB) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [users, roleFilter, search, sort]);

  // LOGIC: PAGINATION
  const totalPages = Math.ceil(sortedAndFilteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = sortedAndFilteredUsers.slice(startIndex, startIndex + pageSize);

  // KPI CALCULATION
  const globalTotal = users.reduce((s, u) => s + u.stats.total, 0);
  const globalPending = users.reduce((s, u) => s + u.stats.pending, 0);
  const globalInProgress = users.reduce((s, u) => s + u.stats.inProgress, 0);
  const globalCompleted = users.reduce((s, u) => s + u.stats.completed, 0);
  const globalRate = globalTotal === 0 ? 0 : Math.round((globalCompleted / globalTotal) * 100);

  return {
    t, isLoading, isError, search, setSearch, roleFilter, setRoleFilter,
    currentPage, setCurrentPage, totalPages, paginatedUsers, sort, handleSort,
    pendingChange, setPendingChange, selectedUser, setSelectedUser, roleMutation,
    userToDelete, setUserToDelete, blockMutation, deleteMutation,
    userToBlock, setUserToBlock,
    analytics, analyticsRange, setAnalyticsRange,
    users, // for bar chart
    globalStats: { total: globalTotal, pending: globalPending, inProgress: globalInProgress, completed: globalCompleted, rate: globalRate }
  };
};